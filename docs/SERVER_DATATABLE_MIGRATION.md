# Migrating Existing Tables to ServerDataTable

This guide helps you migrate existing DataTable implementations to use the new server-driven ServerDataTable component.

## Before You Start

### Prerequisites

- Understand your current implementation (client-side vs server-side)
- Identify all filters, sorts, and search fields currently in use
- Review the current controller method

### Benefits of Migration

- ✅ Better performance with large datasets
- ✅ Reduced client-side memory usage
- ✅ Consistent filtering/sorting logic
- ✅ Shareable/bookmarkable filtered views
- ✅ Easier to maintain

## Step-by-Step Migration

### Step 1: Update Backend Controller

#### Before (typical client-side approach):

```php
public function index()
{
    $items = Item::with('relations')
        ->where('organization_id', $orgId)
        ->get(); // Gets ALL records

    return Inertia::render('items/index', [
        'items' => $items,
    ]);
}
```

#### After (server-driven approach):

```php
use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\StatusFilter;
use Spatie\QueryBuilder\AllowedFilter;

class ItemController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $user = $request->user();
        $orgId = $user->current_organization_id;

        // Build base query with relationships
        $baseQuery = Item::where('organization_id', $orgId)
            ->with(['relations'])
            ->withCount(['childItems']);

        // Build DataTable query
        $items = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            ],
            'sorts' => ['name', 'code', 'created_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('items/index', [
            'items' => $items,
        ]);
    }
}
```

### Step 2: Update TypeScript Types

Change from array to PaginatedData:

```tsx
// Before
interface ItemsIndexProps {
    items: Item[];
}

// After
import { PaginatedData } from '@/types';

interface ItemsIndexProps {
    items: PaginatedData<Item>;
}
```

### Step 3: Update Page Component

#### Before (client-side DataTable):

```tsx
import { DataTable } from '@/components/data-table';

export default function ItemsIndex({ items }: ItemsIndexProps) {
    const columns = [
        /* ... */
    ];

    return <DataTable columns={columns} data={items} />;
}
```

#### After (server-driven ServerDataTable):

```tsx
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { DataTableFacetedFilter } from '@/components/server-data-table-faceted-filter';

export default function ItemsIndex({ items }: ItemsIndexProps) {
    const columns: ColumnDef<Item>[] = [
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
            data={items}
            searchPlaceholder="Search items..."
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

### Step 4: Update Column Definitions

#### Make Columns Sortable:

```tsx
// Before (non-sortable)
{
    accessorKey: 'name',
    header: 'Name',
}

// After (sortable)
{
    accessorKey: 'name',
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
    ),
}
```

#### Handle Non-Sortable Columns:

```tsx
{
    accessorKey: 'managers',
    header: 'Managers',
    cell: ({ row }) => {/* render */},
    enableSorting: false, // Explicitly disable sorting
}
```

### Step 5: Add Filters

#### Status Filter:

```tsx
// In your page component
const statusOptions: FacetedFilterOption[] = [
    { label: 'Active', value: 'Active', icon: CheckCircle2 },
    { label: 'Inactive', value: 'Inactive', icon: XCircle },
];

<DataTableFacetedFilter
    filterKey="status"
    title="Status"
    options={statusOptions}
/>;
```

#### Date Range Filter:

```tsx
<>
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
```

#### Category Filter:

```tsx
const categoryOptions: FacetedFilterOption[] = [
    { label: 'Finance', value: 'finance' },
    { label: 'IT', value: 'it' },
    { label: 'HR', value: 'hr' },
];

<DataTableFacetedFilter
    filterKey="category"
    title="Category"
    options={categoryOptions}
/>;
```

## Common Migration Scenarios

### Scenario 1: Existing Client-Side Filters

#### Before:

```tsx
const [statusFilter, setStatusFilter] = useState<string>('all');
const filteredData = items.filter((item) => {
    if (statusFilter === 'active') return item.is_active;
    if (statusFilter === 'inactive') return !item.is_active;
    return true;
});

<DataTable columns={columns} data={filteredData} />;
```

#### After:

```tsx
// Remove all client-side filter state
// Backend handles filtering via URL parameters

<ServerDataTable
    columns={columns}
    data={items}
    filters={
        <DataTableFacetedFilter
            filterKey="status"
            title="Status"
            options={statusOptions}
        />
    }
/>
```

### Scenario 2: Existing Client-Side Search

#### Before:

```tsx
const [searchTerm, setSearchTerm] = useState('');
const searchedData = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

<Input
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search..."
/>
<DataTable columns={columns} data={searchedData} />
```

#### After:

```tsx
// Remove all client-side search state
// ServerDataTable has built-in search

<ServerDataTable
    columns={columns}
    data={items}
    searchPlaceholder="Search by name, code, or description..."
/>
```

### Scenario 3: Existing Client-Side Sorting

#### Before:

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

// Sorting handled by TanStack Table with getCoreRowModel
const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});
```

#### After:

```tsx
// Remove all client-side sorting state
// ServerDataTable handles sorting automatically

const columns: ColumnDef<Item>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
    },
];

<ServerDataTable columns={columns} data={items} />;
```

### Scenario 4: Existing Pagination

#### Before (PaginatedDataTable):

```tsx
import { PaginatedDataTable } from '@/components/paginated-data-table';

<PaginatedDataTable columns={columns} data={items} />;
```

#### After:

```tsx
import { ServerDataTable } from '@/components/server-data-table';

// Simply rename the component!
<ServerDataTable columns={columns} data={items} />;
```

**Note**: If using `PaginatedDataTable`, you're already 80% there! The main difference is ServerDataTable adds search and filtering capabilities.

## Migrating Custom Filters

### Create Custom Filter Backend

If you have unique filter logic:

```php
// app/Http/Filters/YourCustomFilter.php
<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class YourCustomFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // Your custom filter logic
        return $query->where($property, 'custom_logic', $value);
    }
}
```

Register in controller:

```php
use App\Http\Filters\YourCustomFilter;

'filters' => [
    AllowedFilter::custom('your_filter', new YourCustomFilter(), 'column_name'),
],
```

### Create Custom Filter Frontend

```tsx
// For simple dropdown
<DataTableFacetedFilter
    filterKey="your_filter"
    title="Your Filter"
    options={yourOptions}
/>;

// For custom UI, manage URL params directly
import { router } from '@inertiajs/react';

const handleCustomFilter = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('filter[your_filter]', value);
    params.set('page', '1');

    router.get(
        `${window.location.pathname}?${params.toString()}`,
        {},
        { preserveState: true, preserveScroll: true, replace: true },
    );
};
```

## Testing After Migration

### Checklist

- [ ] Table loads with data
- [ ] Search works and updates URL
- [ ] Each filter works correctly
- [ ] Sort ascending/descending works
- [ ] Pagination works (all buttons)
- [ ] Page size change works
- [ ] Multiple filters work together
- [ ] URL parameters are correct
- [ ] Browser back/forward navigation works
- [ ] Refreshing page preserves filters
- [ ] Column visibility toggle works
- [ ] Actions (edit/delete) still work

### Test URL Structure

After applying filters, verify URL looks like:

```
/items?search=test&filter[status]=Active&filter[category]=finance&sort=-created_at&page=2&per_page=20
```

## Common Issues & Solutions

### Issue: "Data is undefined"

**Solution**: Ensure controller returns paginated data from `buildDataTableQuery()`, not a plain collection.

### Issue: "Filter not working"

**Solution**:

1. Check filter key matches in frontend and backend
2. Verify AllowedFilter is registered in controller
3. Check browser network tab for correct query parameters

### Issue: "Sort not working"

**Solution**:

1. Add column to `sorts` array in controller
2. Ensure column uses `DataTableColumnHeader`
3. Check `enableSorting` is not `false`

### Issue: "Search returns no results"

**Solution**:

1. Verify `searchColumns` includes the fields you want to search
2. For relationship fields, use dot notation: `relation.field`
3. Ensure base query includes `with(['relation'])`

### Issue: "Performance is slow"

**Solution**:

1. Add database indexes on sorted/filtered columns
2. Use `with()` for eager loading relationships
3. Use `withCount()` instead of loading full relationships
4. Reduce number of `searchColumns`

### Issue: "TypeScript errors"

**Solution**:

1. Ensure you imported `PaginatedData` type
2. Define proper `ColumnDef<YourType>[]` type
3. Check all required props are passed to ServerDataTable

## Performance Comparison

### Before (Client-Side)

```
Loading 1000 records:
- Network: 500KB JSON payload
- Memory: ~50MB (all records in memory)
- First paint: 3-5 seconds
```

### After (Server-Driven)

```
Loading 1000 records (10 per page):
- Network: 20KB JSON payload
- Memory: ~2MB (only current page)
- First paint: <1 second
```

## Rollback Plan

If you need to rollback:

1. Keep the old component file temporarily
2. Revert controller changes
3. Change import back to old component
4. Test thoroughly before removing ServerDataTable

## Need Help?

Refer to:

- `docs/SERVER_DATATABLE_IMPLEMENTATION.md` - Full implementation guide
- `docs/SERVER_DATATABLE_QUICK_REFERENCE.md` - Quick reference
- `resources/js/pages/business-units/index.tsx` - Working example
- `app/Http/Controllers/BusinessUnitController.php` - Backend example

## Conclusion

Migration is straightforward:

1. Add `HasDataTable` trait to controller
2. Use `buildDataTableQuery()` with configuration
3. Change type from array to `PaginatedData<T>`
4. Replace component import and props
5. Use `DataTableColumnHeader` for sortable columns
6. Add filters using provided components

The new ServerDataTable provides better performance, UX, and maintainability!
