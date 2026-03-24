# Overview Controller Fix - Relationship Method Names

## Problem

The application was throwing a `BadMethodCallException`:

```
Call to undefined method App\Models\Organization::business_units()
```

## Root Cause

The controller was using **snake_case** (`business_units`) to reference Eloquent relationships, but Laravel models define relationships using **camelCase** (`businessUnits`).

## Solution

Updated `OverviewController.php` to use the correct camelCase method names:

### Changed From (Snake Case):

```php
Organization::with([
    'business_units' => function ($query) {
        $query->with([
            'macro_processes' => function ($query) {
                // ...
            }
        ]);
    },
])
```

### Changed To (Camel Case):

```php
Organization::with([
    'businessUnits' => function ($query) {
        $query->with([
            'macroProcesses' => function ($query) {
                // ...
            }
        ]);
    },
])
```

## Key Points

### Laravel Convention

- **Model Relationships**: Defined as camelCase methods

    ```php
    public function businessUnits(): HasMany
    public function macroProcesses(): HasMany
    ```

- **JSON Serialization**: Automatically converts to snake_case
    ```json
    {
      "business_units": [...],
      "macro_processes": [...]
    }
    ```

### In the Code

1. **Model Method Definition** (camelCase):

    ```php
    // app/Models/Organization.php
    public function businessUnits(): HasMany
    ```

2. **Controller Usage** (camelCase):

    ```php
    // app/Http/Controllers/OverviewController.php
    Organization::with('businessUnits')
    ```

3. **JSON Output** (snake_case - automatic):

    ```json
    {
      "id": 1,
      "name": "My Org",
      "business_units": [...]
    }
    ```

4. **Frontend TypeScript** (snake_case):
    ```typescript
    // resources/js/types/index.d.ts
    interface Organization {
        business_units?: BusinessUnit[];
    }
    ```

## Complete Fix Applied

Updated all relationship references in the controller:

| Old (Incorrect)                | New (Correct)                 |
| ------------------------------ | ----------------------------- |
| `business_units`               | `businessUnits`               |
| `macro_processes`              | `macroProcesses`              |
| `withCount('business_units')`  | `withCount('businessUnits')`  |
| `withCount('macro_processes')` | `withCount('macroProcesses')` |

## Testing

After this fix, the overview page should:

1. ✅ Load without errors
2. ✅ Display the organization tree structure
3. ✅ Show all relationships properly loaded
4. ✅ Display counts correctly

## Related Files

- `app/Http/Controllers/OverviewController.php` ✏️ Fixed
- `app/Models/Organization.php` ✓ Already correct
- `app/Models/BusinessUnit.php` ✓ Already correct
- `app/Models/MacroProcess.php` ✓ Already correct
- Frontend files use snake_case (correct for JSON)
