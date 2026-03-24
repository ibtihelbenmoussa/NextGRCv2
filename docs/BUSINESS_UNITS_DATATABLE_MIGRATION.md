# Business Units Page - DataTable Migration

## Summary

Successfully migrated the Business Units index page from `PaginatedDataTable` to the new generic `DataTable` component.

## Changes Made

### 1. **Imports Updated**

- ✅ Replaced `PaginatedDataTable` with `DataTable`
- ✅ Added `Badge` component for better status styling
- ✅ Added `DropdownMenu` components for row actions
- ✅ Added `FilterFn` and `Row` types from `@tanstack/react-table`
- ✅ Removed unused `Search` icon and `Input` component (now handled by DataTable)
- ✅ Removed `useEffect` hook (search is now client-side)

### 2. **Filter Functions Added**

```typescript
// Multi-column search across name, code, description, and managers
const multiColumnFilterFn: FilterFn<BusinessUnit>;

// Status filter for Active/Inactive
const statusFilterFn: FilterFn<BusinessUnit>;
```

### 3. **Row Actions Component**

Created a dedicated `BusinessUnitRowActions` component with a dropdown menu:

- View Details
- Edit
- Delete (with destructive styling)

### 4. **Column Definitions Enhanced**

- Added `size` property to all columns for consistent width
- Added `filterFn` to name column for multi-column search
- Added `filterFn` to status column for filtering
- Marked important columns with `enableHiding: false`
- Replaced inline status styling with `Badge` component
- Replaced inline action buttons with dropdown menu

### 5. **Component Simplification**

**Removed:**

- Manual search state management and useEffect
- Custom search input field
- Separate "New Business Unit" button in header

**Added:**

- Built-in search via `searchPlaceholder` and `searchColumnId`
- Status filter via `filters` prop
- "New Business Unit" button in table toolbar via `toolbarActions`
- Default sorting by name (ascending)

### 6. **Data Handling**

Changed from:

```typescript
<PaginatedDataTable columns={columns} data={businessUnits} />
```

To:

```typescript
<DataTable
    columns={columns}
    data={businessUnits.data} // Extract data array from paginated response
    searchPlaceholder="Search by name, code, description, or manager..."
    searchColumnId="name"
    emptyMessage="No business units found."
    filters={[
        {
            columnId: 'is_active',
            title: 'Status',
        },
    ]}
    toolbarActions={
        <Button asChild>
            <Link href="/business-units/create">
                <Plus className="mr-2 h-4 w-4" />
                New Business Unit
            </Link>
        </Button>
    }
    defaultSorting={[
        {
            id: 'name',
            desc: false,
        },
    ]}
/>
```

## Features Gained

### ✅ **Enhanced Search**

- Multi-column search across name, code, description, and managers
- Real-time filtering with clear button
- Visual search icon

### ✅ **Status Filtering**

- Filter by Active/Inactive status
- Shows count for each status
- Multiple selections supported

### ✅ **Column Management**

- Toggle column visibility
- Important columns (name, actions) cannot be hidden
- "View" dropdown in toolbar

### ✅ **Improved Row Actions**

- Clean dropdown menu instead of inline buttons
- "View Details" option added
- Better visual hierarchy

### ✅ **Better Pagination**

- Customizable page sizes (5, 10, 25, 50, 100)
- First/Last page buttons
- Page info display

### ✅ **Sorting**

- Click column headers to sort
- Visual sort indicators
- Default sort by name (ascending)

### ✅ **Better UX**

- Loading states built-in
- Empty state message
- Keyboard accessible
- ARIA labels for screen readers

## Note on Pagination

⚠️ **Important:** The DataTable component now uses **client-side pagination** on the data array (`businessUnits.data`). This means:

- All filtering, sorting, and pagination happens in the browser
- Works perfectly for datasets up to ~1000 rows
- For larger datasets, consider implementing server-side pagination

### To implement server-side pagination:

If you need server-side pagination in the future, you would:

1. Modify the DataTable component to accept pagination props from Laravel
2. Disable client-side pagination: `enablePagination={false}`
3. Add custom pagination controls that call Inertia router
4. Pass page params to Laravel backend

For now, the current implementation is simpler and works great for typical business unit counts.

## Migration Checklist for Other Pages

To migrate other pages (Macro Processes, Processes, Risks, Controls, etc.):

- [ ] Replace `PaginatedDataTable` import with `DataTable`
- [ ] Add `FilterFn` type imports if using custom filters
- [ ] Create multi-column filter functions if needed
- [ ] Create row actions component with dropdown menu
- [ ] Add `size` to all column definitions
- [ ] Add `filterFn` to searchable columns
- [ ] Mark important columns with `enableHiding: false`
- [ ] Change data prop from `data={items}` to `data={items.data}`
- [ ] Add search, filters, and toolbar actions props
- [ ] Remove manual search state/useEffect
- [ ] Test all features

## Testing Recommendations

Test the following functionality:

- ✅ Search across all columns (name, code, description, managers)
- ✅ Filter by status (Active/Inactive)
- ✅ Sort by any column
- ✅ Toggle column visibility
- ✅ Change page size
- ✅ Navigate pages
- ✅ Row actions (View, Edit, Delete)
- ✅ Delete confirmation dialog
- ✅ "New Business Unit" button in toolbar
