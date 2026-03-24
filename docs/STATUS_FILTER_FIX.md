# Status Filter Fix - Summary

## Problem

The status filter was not working correctly. The URL showed:

```
# Status Filter Fix - Summary

## Problem2. **`app/Http/Controllers/BusinessUnitController.php`**
   - Added `array_unique()` to remove duplicate filter values
   - Improved filter logic clarity

3. **`resources/js/components/ui/data-table.tsx`** (Critical fixes)
   - Fixed URLSearchParams deletion to remove ALL array parameter instances
   - **Removed double navigation bug**: FilterPopover now handles navigation directly
   - Callback `onServerSideFilterChange` now ONLY updates state, doesn't trigger navigation
   - This prevents filter values from accumulating in the URLus filter was not working correctly. The URL showed:
```

filter[status][0]=Active&filter[status][1]=Active&filter[status][2]=Inactive&filter[status][3]=Inactive...

```

Multiple issues were identified:
1. **Duplicate values** accumulating in the URL on each click
2. **Double navigation** causing values to be added instead of replaced
3. **Incorrect parameter deletion** in URLSearchParams
4. **Wrong array access** in `getCurrentFilters()` method
```

Multiple issues were identified:

1. **Duplicate values** in the URL (Active appeared twice)
2. **Incorrect parameter deletion** in URLSearchParams
3. **Wrong array access** in `getCurrentFilters()` method

## Root Causes

### Issue 1: getCurrentFilters() Method

**Before:**

```php
'status' => $request->input('filter.status', []),
```

This was using dot notation (`filter.status`) which doesn't work with Laravel's array parameters.

**After:**

```php
$filterData = $request->input('filter', []);
return [
    'status' => $filterData['status'] ?? [],
    // ...
];
```

Now correctly reads `filter[status][]` array parameters.

### Issue 2: URLSearchParams Not Deleting Array Parameters Properly

**Before:**

```javascript
params.delete(`filter[${columnId}]`);
params.delete(`filter[${columnId}][]`);
```

`URLSearchParams.delete()` only removes the first occurrence when there are multiple parameters with the same key.

**After:**

```javascript
// Remove all existing filter[columnId] parameters
const keysToDelete: string[] = [];
params.forEach((value, key) => {
    if (key === `filter[${columnId}]` || key === `filter[${columnId}][]`) {
        keysToDelete.push(key);
    }
});
keysToDelete.forEach(key => {
    // Delete all instances of this key
    while (params.has(key)) {
        params.delete(key);
    }
});
```

Now properly removes all array parameter instances before adding new ones.

### Issue 3: Double Navigation (Frontend)

**Problem**: The `FilterPopover` component was navigating to the new URL AND calling `onServerSideFilterChange`, which also triggered navigation. This caused the filter values to accumulate instead of being replaced.

**Before:**

```javascript
// In FilterPopover handleValueChange
router.get(`${window.location.pathname}?${params.toString()}`, ...);
onServerSideFilterChange(newFilterValue); // Triggers ANOTHER navigation!

// In DataTable component
onServerSideFilterChange={(values) => {
    setStatusFilter(values);
    navigateWithFilters({ status: values, page: 1 }); // Double navigation here!
}}
```

**After:**

```javascript
// In FilterPopover handleValueChange
router.get(`${window.location.pathname}?${params.toString()}`, ...);
if (onServerSideFilterChange) {
    onServerSideFilterChange(newFilterValue); // Just updates state now
}

// In DataTable component
onServerSideFilterChange={(values) => {
    setStatusFilter(values); // Only update state, no navigation
}}
```

Now there's only ONE navigation per filter change, preventing value accumulation.

### Issue 4: Filter Logic Improvement (Backend)

**Before:**

```php
if (is_array($value) && count($value) > 0) {
    $query->where(function ($q) use ($value) {
        if (in_array('Active', $value) && !in_array('Inactive', $value)) {
            $q->where('is_active', true);
        } elseif (in_array('Inactive', $value) && !in_array('Active', $value)) {
            $q->where('is_active', false);
        }
    });
}
```

Didn't handle duplicate values.

**After:**

```php
// Ensure we have an array and remove duplicates
$statuses = is_array($value) ? array_unique($value) : [$value];

if (count($statuses) > 0) {
    $hasActive = in_array('Active', $statuses);
    $hasInactive = in_array('Inactive', $statuses);

    // Only filter if not both selected (both = show all)
    if ($hasActive && !$hasInactive) {
        $query->where('is_active', true);
    } elseif ($hasInactive && !$hasActive) {
        $query->where('is_active', false);
    }
}
```

Now uses `array_unique()` to remove duplicates and has clearer logic.

## Files Modified

1. **`app/Http/Controllers/Concerns/HasDataTable.php`**
    - Fixed `getCurrentFilters()` to properly read `filter[key][]` array parameters

2. **`app/Http/Controllers/BusinessUnitController.php`**
    - Added `array_unique()` to remove duplicate filter values
    - Improved filter logic clarity

3. **`resources/js/components/ui/data-table.tsx`**
    - Fixed URLSearchParams deletion to remove ALL array parameter instances
    - **Removed double navigation**: FilterPopover now handles navigation directly
    - Callback only updates state, doesn't trigger navigation
    - Prevents duplicate parameters in URL## Testing

To verify the fix works:

1. **Navigate to Business Units page**: `/business-units`

2. **Test Status Filter**:
    - Click "Status" filter button
    - Check "Active" only → Should show only active units
    - Check "Inactive" only → Should show only inactive units
    - Check both → Should show all units
    - Uncheck all → Should show all units

3. **Verify URL**:
    - URL should not have duplicates
    - Should be: `filter[status][]=Active` or `filter[status][]=Inactive`
    - Not: `filter[status][0]=Active&filter[status][1]=Active`

4. **Test Persistence**:
    - Refresh page → Filters should remain
    - Navigate away and back → Filters should remain
    - Copy URL and open in new tab → Filters should work

## Expected Behavior

### URL Format (Correct)

```
# Single value
/business-units?filter[status][]=Active

# Multiple values (no duplicates)
/business-units?filter[status][]=Active&filter[status][]=Inactive

# With other filters
/business-units?search=test&filter[status][]=Active&sort=-name&page=1
```

### Filter Logic

- **Only "Active" selected**: Shows only `is_active = true`
- **Only "Inactive" selected**: Shows only `is_active = false`
- **Both selected**: Shows all (no filter applied)
- **None selected**: Shows all (no filter applied)

## Related Issues Fixed

These fixes also resolve:

- ✅ Duplicate filter values in URL
- ✅ Status filter state not persisting
- ✅ URL parameters accumulating on repeated clicks
- ✅ Filter values not being read correctly from request

## Prevention

To prevent similar issues in the future:

1. **Always use `$request->input('filter', [])` for filter arrays**
2. **Use `array_unique()` when processing array filter values**
3. **When manipulating URLSearchParams with arrays, iterate and delete all instances**
4. **Test filter combinations thoroughly** (none, one, multiple, all)

---

**Status**: ✅ **FIXED**

The status filter now works correctly with proper URL parameter handling and no duplicates!
