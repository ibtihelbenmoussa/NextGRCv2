# Spatie Query Builder DataTable - Quick Reference

## URL Parameter Formats

### Search

```
?search=john
```

### Filters (Array)

```
?filter[status][]=Active&filter[status][]=Inactive
```

### Filters (Single Value)

```
?filter[email]=gmail.com
?filter[date_from]=2024-01-01
?filter[date_to]=2024-12-31
```

### Sorting

```
?sort=name           # Ascending
?sort=-name          # Descending
?sort=name,-email    # Multiple
```

### Pagination

```
?page=2&per_page=25
```

### Combined

```
?search=john&filter[status][]=Active&sort=-created_at&page=1&per_page=15
```

---

## Backend: Controller Setup

### Option 1: Using HasDataTable Trait (Recommended)

```php
use App\Http\Controllers\Concerns\HasDataTable;

class UserController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $users = $this->buildDataTableQuery(User::class, [
            'searchColumns' => ['name', 'email'],
            'filters' => [
                'name',  // Partial match
                ['name' => 'email', 'type' => 'exact'],  // Exact match
                ['name' => 'status', 'type' => 'callback', 'callback' => function($q, $v) {
                    // Custom filter logic
                }],
            ],
            'sorts' => ['name', 'email', 'created_at'],
            'defaultSort' => 'name',
            'perPage' => 15,
        ]);

        return inertia('users/index', [
            'users' => $users,
            'filters' => $this->getCurrentFilters(),
        ]);
    }
}
```

### Option 2: Direct Spatie Query Builder

```php
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

$users = QueryBuilder::for(User::class)
    ->allowedFilters([
        'name',  // Partial match
        AllowedFilter::exact('email'),
        AllowedFilter::scope('active'),
    ])
    ->allowedSorts(['name', 'email'])
    ->defaultSort('name')
    ->paginate(10)
    ->appends(request()->query());
```

---

## Frontend: DataTable Component

### Basic Usage

```tsx
<DataTable
    columns={columns}
    data={users.data}
    serverSide={true}
    paginationData={{
        current_page: users.current_page,
        per_page: users.per_page,
        total: users.total,
        last_page: users.last_page,
        from: users.from,
        to: users.to,
    }}
    currentFilters={filters}
    searchPlaceholder="Search users..."
    searchColumnId="name"
    filters={[{ columnId: 'status', title: 'Status' }]}
    dateRangeFilter={{
        dateColumnId: 'created_at',
        label: 'Created Date',
    }}
/>
```

---

## Common Filter Types

### Partial Match (Default)

```php
'name'  // LIKE '%value%'
```

### Exact Match

```php
['name' => 'email', 'type' => 'exact']
AllowedFilter::exact('email')
```

### Scope Filter

```php
['name' => 'active', 'type' => 'scope']
AllowedFilter::scope('active')

// In Model:
public function scopeActive($query) {
    return $query->where('is_active', true);
}
```

### Callback Filter

```php
['name' => 'price_range', 'type' => 'callback', 'callback' => function($q, $v) {
    [$min, $max] = explode(',', $v);
    $q->whereBetween('price', [$min, $max]);
}]
```

### Date Range

```php
['name' => 'date_from', 'type' => 'callback', 'callback' => function($q, $v) {
    $q->whereDate('created_at', '>=', $v);
}],
['name' => 'date_to', 'type' => 'callback', 'callback' => function($q, $v) {
    $q->whereDate('created_at', '<=', $v);
}]
```

### Status Array Filter

```php
['name' => 'status', 'type' => 'callback', 'callback' => function($q, $value) {
    if (is_array($value) && count($value) > 0) {
        $q->whereIn('status', $value);
    }
}]
```

---

## Column Definitions

```tsx
const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
            <Link href={`/users/${row.original.id}`}>{row.original.name}</Link>
        ),
    },
    {
        id: 'status',
        accessorFn: (row) => (row.is_active ? 'Active' : 'Inactive'),
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
];
```

---

## Troubleshooting

| Issue                  | Solution                                                       |
| ---------------------- | -------------------------------------------------------------- |
| Filters not working    | Check URL format: `filter[key][]=value` or `filter[key]=value` |
| Sorting not applied    | Ensure column is in `allowedSorts`                             |
| Search returns nothing | Verify `searchColumns` includes correct database columns       |
| Pagination broken      | Ensure `serverSide={true}` and `paginationData` prop is set    |
| State not preserved    | Pass `currentFilters` prop to DataTable component              |

---

## Performance Tips

1. **Index frequently filtered columns**

    ```sql
    CREATE INDEX idx_users_status ON users(status);
    ```

2. **Use eager loading for relationships**

    ```php
    ->with(['company', 'roles'])
    ```

3. **Limit searchable columns**

    ```php
    'searchColumns' => ['name', 'email']  // Don't search all columns
    ```

4. **Use scopes for complex queries**

    ```php
    // Better
    AllowedFilter::scope('active')

    // Instead of
    AllowedFilter::callback('active', function($q) { ... })
    ```

---

## Files Reference

- **Backend Trait**: `app/Http/Controllers/Concerns/HasDataTable.php`
- **Frontend Component**: `resources/js/components/ui/data-table.tsx`
- **Type Definitions**: `resources/js/types/datatable.d.ts`
- **Example Controller**: `app/Http/Controllers/DataTableExamplesController.php`
- **Full Documentation**: `SPATIE_QUERY_BUILDER_DATATABLE.md`
- **Working Example**: `app/Http/Controllers/BusinessUnitController.php` + `resources/js/pages/business-units/index.tsx`
