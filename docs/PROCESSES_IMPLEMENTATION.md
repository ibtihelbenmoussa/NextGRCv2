# Processes Management Implementation

## Overview

This document describes the implementation of the Processes management feature, following the same UI patterns as Macro Processes. The implementation includes full CRUD operations with pagination, search, and filtering capabilities.

## Frontend Implementation

### Created Pages

#### 1. Index Page (`resources/js/pages/processes/index.tsx`)

**Features:**

- Paginated data table with 10 items per page
- Real-time search functionality (300ms debounce)
- Search across: name, code, macro process, description, objectives, and managers
- Stats cards showing:
    - Total processes count
    - Active processes count
    - Total associated risks count
- Table columns:
    - Name (clickable link to detail page)
    - Code
    - Macro Process (clickable link)
    - Business Unit (read-only)
    - Managers (comma-separated list)
    - Risks count
    - Status (Active/Inactive badge)
    - Last Updated date
    - Actions (Edit and Delete buttons)
- Delete confirmation dialog
- Responsive design with Tailwind CSS

#### 2. Create Page (`resources/js/pages/processes/create.tsx`)

**Features:**

- Form to create new processes
- Fields:
    - **Macro Process** (required) - Select dropdown with business unit info
    - **Name** (required) - Text input
    - **Code** (required) - Text input with unique validation
    - **Description** (optional) - Textarea
    - **Objectives** (optional) - Textarea
    - **Managers** (optional) - Multi-select component
    - **Active Status** - Toggle switch (default: true)
- Pre-selection support via `macro_process_id` query parameter
- Form validation with error messages
- Cancel and Submit buttons
- Breadcrumb navigation

#### 3. Edit Page (`resources/js/pages/processes/edit.tsx`)

**Features:**

- Form to update existing processes
- Same fields as create page
- Pre-populated with current process data
- Includes inactive macro processes in dropdown if currently selected
- Multi-select managers with current selections
- Back button to return to detail page
- Form validation

#### 4. Show Page (`resources/js/pages/processes/show.tsx`)

**Features:**

- Process header with icon and name
- Code display
- Description and objectives sections
- Status badges:
    - Active/Inactive status
    - Macro Process
    - Business Unit
    - Managers
- Stats cards:
    - Associated risks count
    - Status
    - Managers count
    - Parent macro process
- Risks section:
    - Grid display of associated risks
    - Risk cards showing:
        - Risk name and code
        - Category
        - Inherent score with color coding
    - Add Risk button (with process pre-selection)
    - Empty state with call-to-action
- Edit and Delete buttons
- Responsive grid layout

## Backend Implementation

### Updated Controller (`app/Http/Controllers/ProcessController.php`)

#### Index Method Updates

**Changes:**

- Added pagination support (10 items per page)
- Implemented search functionality across:
    - Process name
    - Process code
    - Process description
    - Process objectives
    - Manager names
    - Macro process names
- Separated stats calculation from paginated data
- Stats calculated from all processes (not just current page)
- Added filters array to response

**Response Structure:**

```php
[
    'processes' => PaginatedData,
    'stats' => [
        'total' => int,
        'active' => int,
        'risks' => int,
    ],
    'filters' => [
        'search' => string|null,
    ],
]
```

#### Create Method Updates

**Changes:**

- Changed variable name from `$owners` to `$managers` for consistency
- Added support for `selectedMacroProcessId` query parameter
- Loads macro processes with their business units for better display

**Response Structure:**

```php
[
    'macroProcesses' => Collection<MacroProcess>,
    'managers' => Collection<User>,
    'selectedMacroProcessId' => int|null,
]
```

#### Edit Method Updates

**Changes:**

- Changed variable name from `$owners` to `$managers`
- Added logic to include inactive macro processes if currently selected
- Ensures seamless editing without losing data

## Domain Model Integration

### Hierarchy

```
Organization
  └── Business Unit
      └── Macro Process
          └── Process (THIS LEVEL)
              └── Risks
                  └── Controls
```

### Key Relationships

**Process Model:**

- `belongsTo` MacroProcess
- `belongsToMany` User (managers via `process_manager` pivot)
- `belongsToMany` Risk (via `process_risk` pivot)

### Database Tables

**processes:**

- id
- macro_process_id (foreign key)
- name
- code (unique)
- description (nullable)
- objectives (nullable)
- is_active (boolean, default: true)
- created_at
- updated_at
- deleted_at (soft deletes)

**process_manager (pivot):**

- process_id
- user_id
- timestamps

**process_risk (pivot):**

- process_id
- risk_id
- timestamps

## Routes

All routes are already registered in `routes/web.php`:

```php
Route::resource('processes', App\Http\Controllers\ProcessController::class);
```

This creates the following routes:

- GET `/processes` - Index (list all)
- GET `/processes/create` - Create form
- POST `/processes` - Store
- GET `/processes/{process}` - Show
- GET `/processes/{process}/edit` - Edit form
- PUT/PATCH `/processes/{process}` - Update
- DELETE `/processes/{process}` - Delete

## TypeScript Types

The `Process` interface is already defined in `resources/js/types/index.d.ts`:

```typescript
export interface Process {
    id: number;
    macro_process_id: number;
    name: string;
    code: string;
    description?: string;
    objectives?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    macro_process?: MacroProcess;
    managers?: User[];
    risks?: Risk[];
    risks_count?: number;
}
```

## UI Components Used

- `PaginatedDataTable` - For the index page table
- `StatCard` - For displaying statistics
- `EntityCard` - For displaying risks in the show page
- `MultiSelect` - For selecting multiple managers
- `AlertDialog` - For delete confirmation
- Standard form components: Input, Textarea, Select, Switch, Button, Label
- Badge - For status indicators
- Lucide React icons

## Features Implemented

✅ Full CRUD operations (Create, Read, Update, Delete)
✅ Pagination with query string preservation
✅ Real-time search with debouncing
✅ Multi-field search (name, code, description, objectives, managers, macro process)
✅ Stats cards showing aggregated data
✅ Responsive design
✅ Delete confirmation dialog
✅ Form validation with error display
✅ Pre-selection support (macro_process_id parameter)
✅ Breadcrumb navigation
✅ Associated risks display
✅ Empty states with call-to-action
✅ Manager multi-select
✅ Status toggle (active/inactive)
✅ Organization-based access control

## Integration Points

### From Macro Processes

- Create Process button on macro process show page links to `/processes/create?macro_process_id={id}`
- Process cards on macro process show page link to `/processes/{id}`

### To Risks

- Add Risk button on process show page links to `/risks/create?process_id={id}`
- Risk cards on process show page link to `/risks/{id}`

## Testing Recommendations

1. **CRUD Operations:**
    - Create a new process with all fields
    - Create a process with only required fields
    - Update process details
    - Delete a process

2. **Search Functionality:**
    - Search by process name
    - Search by code
    - Search by manager name
    - Search by macro process name

3. **Pagination:**
    - Navigate through pages
    - Verify search persists across pages
    - Check page count with different data sizes

4. **Relationships:**
    - Create process from macro process page
    - Add risks to a process
    - Assign multiple managers
    - Verify organization-based filtering

5. **Validation:**
    - Try to create process without required fields
    - Try duplicate code
    - Test invalid macro process selection

## Notes

- The implementation follows the exact same patterns as Macro Processes for consistency
- Multi-tenancy is enforced - users only see processes from their current organization
- Soft deletes are enabled on the Process model
- The objectives field is unique to processes (not present in macro processes)
- Search functionality includes the objectives field
- All managers must belong to the current organization
- Macro processes must be active to appear in the create/edit dropdowns (unless currently selected)
