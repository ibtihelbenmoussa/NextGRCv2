# DataTable with Spatie Query Builder Integration

This guide explains how to use the enhanced DataTable component with Spatie Laravel Query Builder for server-side filtering, sorting, searching, and pagination.

## Installation

First, ensure Spatie Laravel Query Builder is installed:

```bash
composer require spatie/laravel-query-builder
```

## Backend Implementation

### 1. Using the HasDataTable Trait

The `HasDataTable` trait provides a convenient method to build queries with Spatie Query Builder:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $users = $this->buildDataTableQuery(User::class, [
            // Columns to search across (supports relationships with dot notation)
            'searchColumns' => ['name', 'email', 'company.name'],

            // Define filters
            'filters' => [
                // Simple partial match filter
                'name',
                'email',

                // Exact match filter
                [
                    'name' => 'role',
                    'type' => 'exact',
                ],

                // Custom callback filter
                [
                    'name' => 'status',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        if (is_array($value) && in_array('active', $value)) {
                            $query->where('is_active', true);
                        }
                    },
                ],

                // Date range filters
                [
                    'name' => 'date_from',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        $query->whereDate('created_at', '>=', $value);
                    },
                ],
                [
                    'name' => 'date_to',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        $query->whereDate('created_at', '<=', $value);
                    },
                ],

                // Scope filter
                [
                    'name' => 'verified',
                    'type' => 'scope',
                ],

                // Filter with default value
                [
                    'name' => 'type',
                    'type' => 'exact',
                    'default' => 'standard',
                ],

                // Nullable filter
                [
                    'name' => 'manager_id',
                    'type' => 'exact',
                    'nullable' => true,
                ],
            ],

            // Define sortable columns
            'sorts' => [
                'name',
                'email',
                'created_at',

                // Sort with column alias
                [
                    'name' => 'company_name',
                    'column' => 'companies.name',
                ],
            ],

            // Default sort
            'defaultSort' => 'name', // or ['-created_at'] for descending

            // Allowed includes (eager loading)
            'includes' => ['company', 'roles', 'permissions'],

            // Items per page (can be overridden by request)
            'perPage' => 15,

            // Apply scopes
            'scopes' => [
                'withTrashed', // Simple scope
                'whereType' => ['admin'], // Scope with parameters
            ],
        ]);

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $this->getCurrentFilters(),
        ]);
    }
}
```

### 2. Manual Spatie Query Builder Usage

For more control, you can use Spatie Query Builder directly:

```php
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;

public function index(Request $request)
{
    $users = QueryBuilder::for(User::class)
        ->allowedFilters([
            // Partial match (default)
            'name',

            // Exact match
            AllowedFilter::exact('email'),

            // Scope filter
            AllowedFilter::scope('active'),

            // Custom callback filter
            AllowedFilter::callback('has_posts', function ($query, $value) {
                $query->whereHas('posts');
            }),

            // Relationship filter
            AllowedFilter::exact('company_id', 'company.id'),
        ])
        ->allowedSorts([
            'name',
            'email',
            'created_at',

            // Custom sort
            AllowedSort::field('company_name', 'companies.name'),
        ])
        ->allowedIncludes(['company', 'posts'])
        ->defaultSort('name')
        ->paginate($request->input('per_page', 10))
        ->appends($request->query());

    return Inertia::render('users/index', [
        'users' => $users,
        'filters' => [
            'search' => $request->input('search'),
            'status' => $request->input('filter.status', []),
            'date_from' => $request->input('filter.date_from'),
            'date_to' => $request->input('filter.date_to'),
            'sort_column' => ltrim($request->input('sort', ''), '-'),
            'sort_direction' => str_starts_with($request->input('sort', ''), '-') ? 'desc' : 'asc',
            'per_page' => $request->input('per_page', 10),
        ],
    ]);
}
```

## Frontend Implementation

### Basic Usage

```tsx
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'created_at',
        header: 'Created',
    },
];

export default function UsersIndex({ users, filters }) {
    return (
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
            filters={[
                {
                    columnId: 'status',
                    title: 'Status',
                },
                {
                    columnId: 'role',
                    title: 'Role',
                },
            ]}
            dateRangeFilter={{
                dateColumnId: 'created_at',
                label: 'Created Date',
            }}
            defaultSorting={
                filters.sort_column
                    ? [
                          {
                              id: filters.sort_column,
                              desc: filters.sort_direction === 'desc',
                          },
                      ]
                    : []
            }
        />
    );
}
```

### Advanced Features

```tsx
<DataTable
    columns={columns}
    data={users.data}
    serverSide={true}
    paginationData={paginationData}
    currentFilters={filters}
    // Search configuration
    searchPlaceholder="Search by name, email..."
    searchColumnId="name"
    enableGlobalFilter={true}
    // Filter configuration
    filters={[
        {
            columnId: 'status',
            title: 'Status',
        },
        {
            columnId: 'role',
            title: 'Role',
        },
    ]}
    // Date range filter
    dateRangeFilter={{
        dateColumnId: 'created_at',
        label: 'Registration Date',
    }}
    // Sorting configuration
    enableSorting={true}
    defaultSorting={[{ id: 'name', desc: false }]}
    // Pagination configuration
    enablePagination={true}
    initialPageSize={15}
    pageSizeOptions={[10, 15, 25, 50, 100]}
    // Row selection
    enableRowSelection={true}
    // Column visibility
    enableColumnVisibility={true}
    // Bulk actions
    actions={[
        {
            id: 'delete',
            label: 'Delete Selected',
            icon: <TrashIcon />,
            variant: 'destructive',
            requireConfirmation: true,
            onAction: (selectedRows) => {
                // Handle bulk delete
            },
        },
    ]}
    // Toolbar actions
    toolbarActions={
        <Button asChild>
            <Link href="/users/create">
                <Plus className="mr-2 h-4 w-4" />
                New User
            </Link>
        </Button>
    }
    // Loading state
    isLoading={false}
    // Empty state message
    emptyMessage="No users found."
/>
```

## Query Parameter Format

Spatie Query Builder uses the following URL parameter formats:

### Search

```
GET /users?search=john
```

### Filters

```
GET /users?filter[status][]=Active&filter[status][]=Pending
GET /users?filter[email]=gmail.com
GET /users?filter[date_from]=2024-01-01&filter[date_to]=2024-12-31
```

### Sorting

```
GET /users?sort=name          # Ascending
GET /users?sort=-name         # Descending
GET /users?sort=name,-email   # Multiple sorts
```

### Pagination

```
GET /users?page=2&per_page=25
```

### Includes (Eager Loading)

```
GET /users?include=company,posts
```

### Combined Example

```
GET /users?search=john&filter[status][]=Active&sort=-created_at&page=1&per_page=15&include=company
```

## Filter Types

### Partial Match (Default)

```php
'name' // Searches with LIKE '%value%'
```

### Exact Match

```php
[
    'name' => 'email',
    'type' => 'exact',
]
```

### Scope Filter

```php
[
    'name' => 'active',
    'type' => 'scope',
]
```

Use with a scope in your model:

```php
public function scopeActive($query)
{
    return $query->where('is_active', true);
}
```

### Callback Filter

```php
[
    'name' => 'salary_range',
    'type' => 'callback',
    'callback' => function ($query, $value) {
        [$min, $max] = explode(',', $value);
        $query->whereBetween('salary', [$min, $max]);
    },
]
```

### Trashed Filter

```php
[
    'name' => 'trashed',
    'type' => 'trashed',
]
```

Use with soft deletes:

```
GET /users?filter[trashed]=with    # Include trashed
GET /users?filter[trashed]=only    # Only trashed
GET /users?filter[trashed]=without # Exclude trashed (default)
```

## Best Practices

1. **Always use serverSide mode** for large datasets
2. **Pass currentFilters** to maintain filter state across requests
3. **Use searchColumns** for multi-column search instead of individual filters
4. **Leverage scopes** for complex, reusable query logic
5. **Use defaultSort** to ensure consistent ordering
6. **Validate filter inputs** in your controller
7. **Index database columns** that are frequently filtered or sorted
8. **Use eager loading** (includes) to prevent N+1 queries
9. **Keep filter callbacks simple** - complex logic belongs in model scopes
10. **Test with large datasets** to ensure performance

## Troubleshooting

### Filters not working

- Ensure filter parameter format is correct: `filter[status][]=Active`
- Check that filters are defined in `allowedFilters`
- Verify filter callback logic

### Sorting not working

- Ensure sort columns are in `allowedSorts`
- Check that database column exists
- Verify sort parameter format: `sort=name` or `sort=-name`

### Search not working

- Verify `searchColumns` includes the correct column names
- For relationship columns, use dot notation: `'company.name'`
- Ensure columns exist in database

### Pagination issues

- Verify `paginationData` prop structure matches expected format
- Check that `serverSide={true}` is set
- Ensure `per_page` parameter is being sent correctly

## Example: Complete Implementation

See `app/Http/Controllers/BusinessUnitController.php` and `resources/js/pages/business-units/index.tsx` for a complete working example.
