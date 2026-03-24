# Server-Driven DataTable Component

> A production-ready, fully server-driven DataTable implementation using TanStack React Table, shadcn UI, Laravel, and Spatie Query Builder.

## 🎯 Overview

This DataTable component handles all filtering, sorting, and pagination exclusively on the backend, making it ideal for large datasets while maintaining excellent performance and user experience.

## ✨ Features

- ✅ **Server-Side Everything**: Filtering, sorting, pagination all handled by Laravel
- ✅ **URL-Based State**: Shareable and bookmarkable filtered views
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Performance Optimized**: Debounced search, eager loading, efficient queries
- ✅ **Flexible Filtering**: Status, date range, multi-select, and custom filters
- ✅ **Sortable Columns**: Click-to-sort with visual indicators
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Column Visibility**: Toggle column visibility on the fly
- ✅ **Customizable**: Easy to extend and customize

## 📦 What's Included

### Frontend Components

- `ServerDataTable` - Main table component
- `DataTableColumnHeader` - Sortable column headers
- `DataTableFacetedFilter` - Multi-select filter
- `DataTableDateFilter` - Date picker filter
- `DataTableViewOptions` - Column visibility toggle

### Backend Components

- `HasDataTable` trait - Reusable controller trait
- `StatusFilter` - Active/Inactive filter
- `DateFromFilter` - Date range start filter
- `DateToFilter` - Date range end filter
- `BooleanFilter` - Boolean value filter
- `MultiSelectFilter` - Multi-value filter

## 🚀 Quick Start

### 1. Backend Setup

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\StatusFilter;
use Spatie\QueryBuilder\AllowedFilter;

class YourController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $baseQuery = YourModel::query()
            ->with('relations')
            ->withCount('children');

        $data = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            ],
            'sorts' => ['name', 'code', 'created_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('your-page/index', ['data' => $data]);
    }
}
```

### 2. Frontend Setup

```tsx
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { DataTableFacetedFilter } from '@/components/server-data-table-faceted-filter';
import { PaginatedData } from '@/types';
import { ColumnDef } from '@tanstack/react-table';

interface PageProps {
    data: PaginatedData<YourType>;
}

export default function YourPage({ data }: PageProps) {
    const columns: ColumnDef<YourType>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
        },
        // ... more columns
    ];

    return (
        <ServerDataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search..."
            filters={
                <DataTableFacetedFilter
                    filterKey="status"
                    title="Status"
                    options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' },
                    ]}
                />
            }
        />
    );
}
```

## 📖 Documentation

| Document                                                     | Description                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Implementation Guide](./SERVER_DATATABLE_IMPLEMENTATION.md) | Comprehensive guide with architecture, examples, and best practices |
| [Quick Reference](./SERVER_DATATABLE_QUICK_REFERENCE.md)     | Quick lookup for common patterns and configurations                 |
| [Migration Guide](./SERVER_DATATABLE_MIGRATION.md)           | Step-by-step guide to migrate existing tables                       |
| [Summary](./SERVER_DATATABLE_SUMMARY.md)                     | Overview of implementation and testing guide                        |

## 🎨 Examples

### Basic Table with Search

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    searchPlaceholder="Search items..."
/>
```

### Table with Filters

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
            <DataTableDateFilter filterKey="date_from" title="From" />
        </>
    }
/>
```

### Table with Toolbar Actions

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

### Table with Row Click Handler

```tsx
<ServerDataTable
    columns={columns}
    data={data}
    onRowClick={(row) => router.visit(`/items/${row.id}`)}
/>
```

## 🔧 Configuration

### ServerDataTable Props

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

### buildDataTableQuery Options

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

## 🎯 Column Types

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

## 🔌 Available Filters

### Status Filter (Active/Inactive)

**Backend:**

```php
AllowedFilter::custom('status', new StatusFilter(), 'is_active')
```

**Frontend:**

```tsx
<DataTableFacetedFilter
    filterKey="status"
    title="Status"
    options={[
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
    ]}
/>
```

### Date Range Filter

**Backend:**

```php
AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
AllowedFilter::custom('date_to', new DateToFilter(), 'created_at')
```

**Frontend (Range Picker - Recommended):**

```tsx
<DataTableRangeDateFilter
    filterFromKey="date_from"
    filterToKey="date_to"
    title="Date Range"
    placeholder="Pick date range"
/>
```

**Frontend (Separate Filters - Alternative):**

```tsx
<DataTableDateFilter filterKey="date_from" title="From" />
<DataTableDateFilter filterKey="date_to" title="To" />
```

### Select Filter (Single Selection with Search)

**Backend:**

```php
use App\Http\Filters\ManagerFilter;

AllowedFilter::custom('manager', new ManagerFilter('managers'))
```

**Frontend:**

```tsx
const managerOptions = managers.map((user) => ({
    label: user.name,
    value: user.id.toString(),
}));

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
    ]}
/>
```

## 🔨 Creating Custom Filters

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
        return $query->where($property, 'operator', $value);
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

## 🌐 URL Query Parameters

The DataTable uses URL query parameters for state:

- `search` - Search term
- `sort` - Sort column (prefix with `-` for descending)
- `filter[key]` - Filter values (comma-separated for multi-select)
- `page` - Current page number
- `per_page` - Items per page

**Example:**

```
/items?search=test&filter[status]=Active&sort=-created_at&page=2&per_page=20
```

## 📊 Performance Tips

1. **Index database columns** used for sorting/filtering
2. **Eager load relationships** with `with()` to avoid N+1 queries
3. **Use `withCount()`** for aggregates instead of loading full relationships
4. **Limit searchColumns** to necessary fields only
5. **Set appropriate defaultSort** for consistent ordering
6. **Consider caching** for heavy/complex queries

## 🐛 Troubleshooting

| Issue               | Solution                                   |
| ------------------- | ------------------------------------------ |
| Filters not working | Check filter key matches frontend/backend  |
| Sorting not working | Add column to `sorts` array in controller  |
| Search not working  | Add columns to `searchColumns` array       |
| Slow queries        | Add database indexes, eager load relations |
| N+1 queries         | Use `with()` in base query                 |
| Type errors         | Import `PaginatedData<T>` type             |

## 📁 File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Concerns/
│   │   │   └── HasDataTable.php
│   │   └── YourController.php
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
        └── your-page/
            └── index.tsx
```

## 🎓 Working Example

See the Business Units implementation for a complete working example:

- Backend: `app/Http/Controllers/BusinessUnitController.php`
- Frontend: `resources/js/pages/business-units/index.tsx`

## 🚀 Next Steps

1. **Read the [Implementation Guide](./SERVER_DATATABLE_IMPLEMENTATION.md)** for detailed documentation
2. **Check the [Quick Reference](./SERVER_DATATABLE_QUICK_REFERENCE.md)** for common patterns
3. **Use the [Migration Guide](./SERVER_DATATABLE_MIGRATION.md)** to convert existing tables
4. **Review the Business Units example** for a production implementation

## 📝 License

This implementation is part of the NextGRC project.

## 🤝 Contributing

To extend or enhance the DataTable:

1. Add new filter types in `app/Http/Filters/`
2. Create corresponding frontend components
3. Update documentation
4. Test thoroughly with various data scenarios

---

**Need help?** Check the documentation files or review the Business Units implementation example.
