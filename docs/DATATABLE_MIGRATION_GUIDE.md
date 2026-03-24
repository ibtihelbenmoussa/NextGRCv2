# Migration Guide: Converting Existing DataTables to Spatie Query Builder

This guide shows you how to convert existing DataTable implementations to use the new Spatie Query Builder system.

## Before (Old Pattern)

### Controller (Old Way)

```php
public function index(Request $request)
{
    $search = $request->input('search');
    $status = $request->input('status');
    $dateFrom = $request->input('date_from');
    $dateTo = $request->input('date_to');
    $sortColumn = $request->input('sort_column', 'name');
    $sortDirection = $request->input('sort_direction', 'asc');
    $perPage = $request->input('per_page', 10);

    $query = Model::query();

    // Apply search
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // Apply status filter
    if ($status && is_array($status) && count($status) > 0) {
        $query->where(function ($q) use ($status) {
            if (in_array('Active', $status) && !in_array('Inactive', $status)) {
                $q->where('is_active', true);
            } elseif (in_array('Inactive', $status) && !in_array('Active', $status)) {
                $q->where('is_active', false);
            }
        });
    }

    // Apply date range
    if ($dateFrom) {
        $query->whereDate('updated_at', '>=', $dateFrom);
    }
    if ($dateTo) {
        $query->whereDate('updated_at', '<=', $dateTo);
    }

    // Apply sorting
    $allowedSortColumns = ['name', 'code', 'updated_at'];
    if (in_array($sortColumn, $allowedSortColumns)) {
        $query->orderBy($sortColumn, $sortDirection);
    }

    $data = $query->paginate($perPage)->withQueryString();

    return inertia('module/index', [
        'data' => $data,
        'filters' => [
            'search' => $search,
            'status' => $status,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'sort_column' => $sortColumn,
            'sort_direction' => $sortDirection,
            'per_page' => $perPage,
        ],
    ]);
}
```

### Frontend (Old Way)

```tsx
<DataTable
    columns={columns}
    data={data.data}
    serverSide={true}
    paginationData={data}
    currentFilters={filters}
    // ... other props
/>
```

**Problems with old pattern:**

- ❌ Lots of boilerplate code
- ❌ Manual URL parameter handling
- ❌ Inconsistent parameter naming
- ❌ Hard to maintain
- ❌ Repeated code across controllers
- ❌ No standard format

---

## After (New Pattern with Spatie Query Builder)

### Step 1: Update Controller

```php
use App\Http\Controllers\Concerns\HasDataTable;

class YourController extends Controller
{
    use HasDataTable;  // ← Add this trait

    public function index(Request $request)
    {
        // Replace all the manual query building with:
        $data = $this->buildDataTableQuery(Model::class, [
            'searchColumns' => ['name', 'code', 'description'],
            'filters' => [
                [
                    'name' => 'status',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        if (is_array($value) && count($value) > 0) {
                            $query->where(function ($q) use ($value) {
                                if (in_array('Active', $value) && !in_array('Inactive', $value)) {
                                    $q->where('is_active', true);
                                } elseif (in_array('Inactive', $value) && !in_array('Active', $value)) {
                                    $q->where('is_active', false);
                                }
                            });
                        }
                    },
                ],
                [
                    'name' => 'date_from',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        $query->whereDate('updated_at', '>=', $value);
                    },
                ],
                [
                    'name' => 'date_to',
                    'type' => 'callback',
                    'callback' => function ($query, $value) {
                        $query->whereDate('updated_at', '<=', $value);
                    },
                ],
            ],
            'sorts' => ['name', 'code', 'updated_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return inertia('module/index', [
            'data' => $data,
            'filters' => $this->getCurrentFilters(),  // ← Use helper method
        ]);
    }
}
```

**Benefits:**

- ✅ Much shorter and cleaner
- ✅ Standard URL parameter format
- ✅ Reusable configuration
- ✅ Type-safe
- ✅ Easy to test

---

## Real World Example: Step-by-Step Migration

### Example: Users DataTable

#### BEFORE

```php
public function index(Request $request)
{
    $search = $request->input('search');
    $role = $request->input('role');
    $verified = $request->input('verified');
    $sortColumn = $request->input('sort_column', 'name');
    $sortDirection = $request->input('sort_direction', 'asc');
    $perPage = $request->input('per_page', 10);

    $query = User::with('roles');

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    if ($role) {
        $query->whereHas('roles', function ($q) use ($role) {
            $q->where('name', $role);
        });
    }

    if ($verified !== null) {
        $query->where('email_verified_at', $verified ? '!=' : '=', null);
    }

    $query->orderBy($sortColumn, $sortDirection);

    $users = $query->paginate($perPage)->withQueryString();

    return inertia('users/index', [
        'users' => $users,
        'filters' => compact('search', 'role', 'verified', 'sortColumn', 'sortDirection', 'perPage'),
    ]);
}
```

#### AFTER

```php
use App\Http\Controllers\Concerns\HasDataTable;

public function index(Request $request)
{
    $baseQuery = User::with('roles');

    $users = $this->buildDataTableQuery($baseQuery, [
        'searchColumns' => ['name', 'email'],
        'filters' => [
            [
                'name' => 'role',
                'type' => 'callback',
                'callback' => function ($query, $value) {
                    $query->whereHas('roles', function ($q) use ($value) {
                        $q->where('name', $value);
                    });
                },
            ],
            [
                'name' => 'verified',
                'type' => 'callback',
                'callback' => function ($query, $value) {
                    $query->where('email_verified_at', $value ? '!=' : '=', null);
                },
            ],
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
```

**Lines of code:** 40+ → 25 (38% reduction!)

---

## URL Parameter Changes

### Before (Old Format)

```
/users?search=john&status[]=Active&status[]=Pending&sort_column=name&sort_direction=desc&page=2&per_page=25
```

### After (Spatie Format)

```
/users?search=john&filter[status][]=Active&filter[status][]=Pending&sort=-name&page=2&per_page=25
```

**Key Changes:**

- `status[]` → `filter[status][]`
- `sort_column` + `sort_direction` → `sort` (with `-` prefix for desc)
- Date filters: `date_from` → `filter[date_from]`

---

## Frontend Changes

### No changes needed if already using currentFilters prop!

Your existing DataTable component automatically handles the new format:

```tsx
<DataTable
    columns={columns}
    data={users.data}
    serverSide={true}
    paginationData={users}
    currentFilters={filters} // ← This is all you need!
    // ... rest of props
/>
```

The component internally converts to Spatie format.

---

## Migration Checklist

For each DataTable, follow these steps:

### Backend

- [ ] Add `use HasDataTable;` to controller
- [ ] Replace manual query building with `buildDataTableQuery()`
- [ ] Define `searchColumns` array
- [ ] Convert filters to new format
- [ ] Define `sorts` array
- [ ] Set `defaultSort`
- [ ] Replace filters array with `$this->getCurrentFilters()`
- [ ] Test all filters work

### Frontend

- [ ] Verify `currentFilters` prop is passed
- [ ] Test search functionality
- [ ] Test each filter
- [ ] Test sorting (asc/desc)
- [ ] Test pagination
- [ ] Test date range filters

### Testing

- [ ] Search returns correct results
- [ ] Single value filters work
- [ ] Array/multi-value filters work
- [ ] Date range filters work
- [ ] Sorting works in both directions
- [ ] Pagination maintains filters
- [ ] URL can be bookmarked/shared
- [ ] Browser back/forward works

---

## Common Migration Patterns

### Pattern 1: Simple String Filter

```php
// Before
if ($status) {
    $query->where('status', $status);
}

// After
'filters' => ['status']  // Uses partial match by default
// OR
'filters' => [['name' => 'status', 'type' => 'exact']]  // Exact match
```

### Pattern 2: Array Filter

```php
// Before
if ($categories && is_array($categories)) {
    $query->whereIn('category_id', $categories);
}

// After
'filters' => [
    ['name' => 'categories', 'type' => 'callback', 'callback' => function($q, $v) {
        $q->whereIn('category_id', is_array($v) ? $v : [$v]);
    }]
]
```

### Pattern 3: Relationship Filter

```php
// Before
if ($companyName) {
    $query->whereHas('company', function($q) use ($companyName) {
        $q->where('name', 'like', "%{$companyName}%");
    });
}

// After
'searchColumns' => ['name', 'email', 'company.name']
// The trait handles the relationship automatically!
```

### Pattern 4: Boolean Filter

```php
// Before
if ($active !== null) {
    $query->where('is_active', $active);
}

// After
'filters' => [['name' => 'active', 'type' => 'exact', 'column' => 'is_active']]
```

### Pattern 5: Date Range

```php
// Before
if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);

// After
'filters' => [
    ['name' => 'date_from', 'type' => 'callback',
     'callback' => fn($q, $v) => $q->whereDate('created_at', '>=', $v)],
    ['name' => 'date_to', 'type' => 'callback',
     'callback' => fn($q, $v) => $q->whereDate('created_at', '<=', $v)],
]
```

---

## Troubleshooting Migration Issues

### Issue: Filters not working after migration

**Solution:** Check URL parameter format. Should be `filter[key]=value` or `filter[key][]=value`

### Issue: Sorting not working

**Solution:** Ensure column is in `sorts` array and defaultSorting prop uses correct format

### Issue: Search returns no results

**Solution:** Verify `searchColumns` includes correct database column names

### Issue: Pagination loses filters

**Solution:** Make sure `currentFilters` prop is passed to DataTable component

### Issue: Relationship filters fail

**Solution:** For relationship columns in search, use dot notation: `'company.name'`

---

## Performance Considerations

After migration:

1. **Add Database Indexes**

    ```sql
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_status ON users(status);
    ```

2. **Eager Load Relationships**

    ```php
    $baseQuery = User::with(['company', 'roles']);
    ```

3. **Limit Searchable Columns**
    ```php
    'searchColumns' => ['name', 'email']  // Don't add all columns
    ```

---

## Summary

**Before:** Manual, repetitive, error-prone
**After:** Clean, maintainable, standardized

✅ Less code
✅ Standard format
✅ Reusable
✅ Type-safe
✅ Easier to test
✅ Better performance

**Start migrating your DataTables today!** 🚀
