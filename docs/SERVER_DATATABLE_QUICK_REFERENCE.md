# Server DataTable Quick Reference

## Quick Start

### 1. Backend Setup (Controller)

```php
use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\StatusFilter;
use Spatie\QueryBuilder\AllowedFilter;

class YourController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $baseQuery = YourModel::query()->with('relations');

        $data = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            ],
            'sorts' => ['name', 'created_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('your-page/index', ['data' => $data]);
    }
}
```

### 2. Frontend Setup (Page Component)

```tsx
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<YourType>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
    },
    // More columns...
];

export default function YourPage({ data }) {
    return <ServerDataTable columns={columns} data={data} />;
}
```

## Available Filters

### Status Filter (Active/Inactive)

**Backend:**

```php
use App\Http\Filters\StatusFilter;

AllowedFilter::custom('status', new StatusFilter(), 'is_active')
```

**Frontend:**

```tsx
import { DataTableFacetedFilter } from '@/components/server-data-table-faceted-filter';

<DataTableFacetedFilter
    filterKey="status"
    title="Status"
    options={[
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
    ]}
/>;
```

### Date Range Filter

**Backend:**

```php
use App\Http\Filters\{DateFromFilter, DateToFilter};

AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
AllowedFilter::custom('date_to', new DateToFilter(), 'created_at')
```

**Frontend Option 1 (Range Picker - Recommended):**

```tsx
import { DataTableRangeDateFilter } from '@/components/server-data-table-range-date-filter';

<DataTableRangeDateFilter
    filterFromKey="date_from"
    filterToKey="date_to"
    title="Date Range"
    placeholder="Pick date range"
/>;
```

**Frontend Option 2 (Separate Filters):**

```tsx
import { DataTableDateFilter } from '@/components/server-data-table-date-filter';

<DataTableDateFilter filterKey="date_from" title="From" />
<DataTableDateFilter filterKey="date_to" title="To" />
```

### Select Filter (with Search)

**Backend:**

```php
use App\Http\Filters\ManagerFilter;

// For relationship filtering
AllowedFilter::custom('manager', new ManagerFilter('managers'))
```

**Frontend:**

```tsx
import { DataTableSelectFilter } from '@/components/server-data-table-select-filter';

<DataTableSelectFilter
    filterKey="manager"
    title="Manager"
    placeholder="Select manager..."
    searchPlaceholder="Search managers..."
    emptyMessage="No managers found."
    options={managerOptions}
    showIcon={false}
/>;
```

### Multi-Select Filter

**Backend:**

```php
use App\Http\Filters\MultiSelectFilter;

AllowedFilter::custom('category', new MultiSelectFilter(), 'category')
```

**Frontend:**

```tsx
<DataTableFacetedFilter
    filterKey="category"
    title="Category"
    options={[
        { label: 'Finance', value: 'finance' },
        { label: 'IT', value: 'it' },
        { label: 'HR', value: 'hr' },
    ]}
/>
```

## Column Configurations

### Sortable Column

```tsx
{
    accessorKey: 'name',
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
}
```

### Non-Sortable Column

```tsx
{
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
}
```

### Custom Cell Rendering

```tsx
{
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
            {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
    ),
}
```

### Date Formatting

```tsx
{
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return <div>{date.toLocaleDateString()}</div>;
    },
}
```

### Actions Column

```tsx
{
    id: 'actions',
    cell: ({ row }) => {
        const item = row.original;
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(item)}>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    },
}
```

## ServerDataTable Props

```tsx
interface ServerDataTableProps<TData> {
    columns: ColumnDef<TData>[]; // Column definitions
    data: PaginatedData<TData>; // Laravel paginated data
    searchPlaceholder?: string; // Search input placeholder
    searchable?: boolean; // Enable/disable search (default: true)
    filters?: React.ReactNode; // Custom filter components
    toolbar?: React.ReactNode; // Additional toolbar buttons
    className?: string; // Additional CSS classes
    onRowClick?: (row: TData) => void; // Row click handler
}
```

## buildDataTableQuery Options

```php
[
    'searchColumns' => [],        // Columns to search (supports 'relation.field')
    'filters' => [],              // AllowedFilter instances
    'sorts' => [],                // Sortable columns
    'defaultSort' => 'column',    // Default sort column
    'includes' => [],             // Allowed includes
    'perPage' => 15,             // Default items per page
    'scopes' => [],              // Query scopes to apply
]
```

## URL Query Parameters

- `search` - Search term
- `sort` - Sort column (prefix with `-` for desc)
- `filter[key]` - Filter value(s)
- `page` - Current page
- `per_page` - Items per page

## Common Patterns

### With Toolbar Actions

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    toolbar={
        <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
        </Button>
    }
/>
```

### With Row Click

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    onRowClick={(row) => router.visit(`/items/${row.id}`)}
/>
```

### With Multiple Filters

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    filters={
        <>
            <DataTableFacetedFilter
                filterKey="status"
                title="Status"
                options={statusOptions}
            />
            <DataTableFacetedFilter
                filterKey="category"
                title="Category"
                options={categoryOptions}
            />
            <DataTableDateFilter filterKey="date_from" title="From" />
            <DataTableDateFilter filterKey="date_to" title="To" />
        </>
    }
/>
```

## Custom Filter Implementation

### 1. Create Filter Class

```php
// app/Http/Filters/CustomFilter.php
<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class CustomFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // Your custom logic
        return $query->where($property, 'custom_condition', $value);
    }
}
```

### 2. Register in Controller

```php
use App\Http\Filters\CustomFilter;

AllowedFilter::custom('custom', new CustomFilter(), 'column_name')
```

### 3. Use in Frontend

```tsx
<DataTableFacetedFilter
    filterKey="custom"
    title="Custom"
    options={yourOptions}
/>
```

## Performance Tips

1. **Index** frequently sorted/filtered columns
2. **Eager load** relationships with `with()`
3. **Use** `withCount()` for aggregates
4. **Limit** searchColumns to necessary fields
5. **Set** appropriate defaultSort
6. **Consider** caching for heavy queries

## Troubleshooting

| Issue               | Solution                                  |
| ------------------- | ----------------------------------------- |
| Filters not working | Check filter key matches frontend/backend |
| Sorting not working | Add column to `sorts` array               |
| Search not working  | Add columns to `searchColumns`            |
| Slow queries        | Add indexes, eager load relations         |
| N+1 queries         | Use `with()` in base query                |
