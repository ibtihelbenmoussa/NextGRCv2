# Server-Driven DataTable Implementation Guide

## Overview

This guide documents the complete implementation of a reusable, fully server-driven DataTable component using TanStack React Table and shadcn UI, integrated with Laravel + Spatie Query Builder on the backend.

## Architecture

### Frontend Components

1. **ServerDataTable** (`resources/js/components/server-data-table.tsx`)
    - Main table component with built-in search, pagination, and sorting
    - All state changes trigger server requests via Inertia.js
    - Debounced search (500ms) to reduce server load
    - URL-based state management for shareable/bookmarkable filters

2. **DataTableColumnHeader** (`resources/js/components/server-data-table-column-header.tsx`)
    - Sortable column headers with visual indicators
    - Dropdown menu for sort direction selection

3. **DataTableFacetedFilter** (`resources/js/components/server-data-table-faceted-filter.tsx`)
    - Multi-select filter with badges
    - Supports custom icons for options
    - Shows selected count

4. **DataTableDateFilter** (`resources/js/components/server-data-table-date-filter.tsx`)
    - Date picker filter using react-day-picker
    - Clear button for resetting

5. **DataTableViewOptions** (`resources/js/components/server-data-table-view-options.tsx`)
    - Column visibility toggle

### Backend Components

1. **HasDataTable Trait** (`app/Http/Controllers/Concerns/HasDataTable.php`)
    - Reusable trait for controllers
    - Integrates Spatie Query Builder with common DataTable features
    - Handles search, filtering, sorting, and pagination

2. **Custom Filters** (`app/Http/Filters/`)
    - `StatusFilter`: Active/Inactive toggle with intelligent logic
    - `DateFromFilter`: Date range start filter
    - `DateToFilter`: Date range end filter
    - `BooleanFilter`: Boolean value filter
    - `MultiSelectFilter`: Multi-value filter with optional value mapping

## Usage Example: Business Units

### Backend Controller

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\StatusFilter;
use App\Models\BusinessUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;

class BusinessUnitController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Base query
        $baseQuery = BusinessUnit::where('organization_id', $currentOrgId)
            ->with('managers')
            ->withCount('macroProcesses');

        // Build DataTable query
        $businessUnits = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description', 'managers.name'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
            ],
            'sorts' => [
                'name',
                'code',
                'updated_at',
                'macro_processes_count',
            ],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('business-units/index', [
            'businessUnits' => $businessUnits,
        ]);
    }
}
```

### Frontend Page Component

```tsx
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { DataTableDateFilter } from '@/components/server-data-table-date-filter';
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
import { Badge } from '@/components/ui/badge';
import { BusinessUnit, PaginatedData } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BusinessUnitsIndexProps {
    businessUnits: PaginatedData<BusinessUnit>;
}

export default function BusinessUnitsIndex({
    businessUnits,
}: BusinessUnitsIndexProps) {
    // Filter options
    const statusOptions: FacetedFilterOption[] = [
        { label: 'Active', value: 'Active', icon: CheckCircle2 },
        { label: 'Inactive', value: 'Inactive', icon: XCircle },
    ];

    // Define columns
    const columns: ColumnDef<BusinessUnit>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('code')}</div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.getValue('is_active') ? 'default' : 'secondary'
                    }
                >
                    {row.getValue('is_active') ? 'Active' : 'Inactive'}
                </Badge>
            ),
            enableSorting: false,
        },
        // ... more columns
    ];

    return (
        <ServerDataTable
            columns={columns}
            data={businessUnits}
            searchPlaceholder="Search business units..."
            filters={
                <>
                    <DataTableFacetedFilter
                        filterKey="status"
                        title="Status"
                        options={statusOptions}
                    />
                    <DataTableDateFilter
                        filterKey="date_from"
                        title="From Date"
                        placeholder="From date"
                    />
                    <DataTableDateFilter
                        filterKey="date_to"
                        title="To Date"
                        placeholder="To date"
                    />
                </>
            }
        />
    );
}
```

## URL Query Parameters

The DataTable component uses URL query parameters for state management:

- `search`: Global search term
- `sort`: Column to sort by (prefix with `-` for descending, e.g., `-name`)
- `filter[filterKey]`: Filter values (comma-separated for multi-select)
- `page`: Current page number
- `per_page`: Items per page

**Example URL:**

```
/business-units?search=IT&filter[status]=Active&sort=-updated_at&page=2&per_page=20
```

## Features

### 1. Server-Side Search

- Debounced by 500ms to reduce server requests
- Searches across multiple columns (configurable)
- Supports relationship fields (e.g., `managers.name`)

### 2. Server-Side Filtering

- Faceted filters with badges
- Date range filters
- Custom filter implementations
- Multiple active filters simultaneously

### 3. Server-Side Sorting

- Click column headers to sort
- Visual indicators for sort direction
- Multi-column sorting support (can be extended)

### 4. Server-Side Pagination

- Configurable page sizes (10, 20, 30, 40, 50)
- First/Previous/Next/Last navigation
- Page info display

### 5. Column Visibility

- Toggle column visibility
- Persisted in React state (could be extended to localStorage)

## Creating Custom Filters

### Backend Filter

```php
<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class CustomFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // Your custom filter logic
        return $query->where($property, 'like', "%{$value}%");
    }
}
```

### Usage in Controller

```php
use App\Http\Filters\CustomFilter;
use Spatie\QueryBuilder\AllowedFilter;

$data = $this->buildDataTableQuery($baseQuery, [
    'filters' => [
        AllowedFilter::custom('myFilter', new CustomFilter(), 'column_name'),
    ],
]);
```

### Frontend Filter Component

```tsx
<DataTableFacetedFilter
    filterKey="myFilter"
    title="My Filter"
    options={[
        { label: 'Option 1', value: 'value1' },
        { label: 'Option 2', value: 'value2' },
    ]}
/>
```

## Best Practices

1. **Always use the HasDataTable trait** for consistent query building
2. **Define searchColumns** to enable global search across relevant fields
3. **Use custom filters** from `app/Http/Filters/` for reusable filter logic
4. **Keep defaultSort** to ensure consistent ordering
5. **Load relationships efficiently** using `with()` to avoid N+1 queries
6. **Use withCount()** for aggregates instead of counting in the frontend
7. **Validate filter inputs** in custom filters to prevent SQL injection
8. **Use TypeScript interfaces** for type safety on column definitions

## Performance Considerations

1. **Indexes**: Ensure database columns used for sorting/filtering are indexed
2. **Eager Loading**: Use `with()` for relationships to avoid N+1 queries
3. **Pagination**: Always paginate large datasets (default: 15 per page)
4. **Debouncing**: Search is debounced by 500ms to reduce server load
5. **Query Optimization**: Use `select()` to limit columns when possible

## Extending the DataTable

### Adding a Toolbar Action

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    toolbar={
        <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
        </Button>
    }
/>
```

### Adding Row Click Handler

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    onRowClick={(row) => router.visit(`/items/${row.id}`)}
/>
```

### Customizing Search Placeholder

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    searchPlaceholder="Search by name, code, or description..."
/>
```

### Disabling Search

```tsx
<ServerDataTable columns={columns} data={data} searchable={false} />
```

## Troubleshooting

### Filters not working

- Check that the filter key in frontend matches the backend filter name
- Verify the AllowedFilter is registered in the controller
- Check browser network tab for correct query parameters

### Sorting not working

- Ensure the column is in the `sorts` array in the controller
- Check that `enableSorting` is not set to `false` in column definition
- Verify the column name matches the database column

### Search not working

- Check that `searchColumns` includes the columns you want to search
- For relationship fields, use dot notation (e.g., `managers.name`)
- Verify the base query includes necessary relationships with `with()`

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Concerns/
│   │   │   └── HasDataTable.php
│   │   └── BusinessUnitController.php
│   └── Filters/
│       ├── BooleanFilter.php
│       ├── DateFromFilter.php
│       ├── DateToFilter.php
│       ├── MultiSelectFilter.php
│       └── StatusFilter.php
resources/
└── js/
    ├── components/
    │   ├── server-data-table.tsx
    │   ├── server-data-table-column-header.tsx
    │   ├── server-data-table-date-filter.tsx
    │   ├── server-data-table-faceted-filter.tsx
    │   └── server-data-table-view-options.tsx
    └── pages/
        └── business-units/
            └── index.tsx
```

## Future Enhancements

1. **Export functionality** (CSV, Excel, PDF)
2. **Column resizing** using react-resizable-panels
3. **Row selection** with bulk actions
4. **Saved filters** persisted to user preferences
5. **Advanced filters** with AND/OR logic
6. **Column reordering** via drag-and-drop
7. **Inline editing** for quick updates
8. **Virtual scrolling** for extremely large datasets
