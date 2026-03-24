# Organization Selection Feature Implementation

## Overview

Implemented a complete organization selection system that allows users to select which organization they want to work with after logging in. The system supports multi-tenancy where users can belong to multiple organizations.

## What Was Implemented

### 1. Database Changes

- **Migration**: Added `current_organization_id` column to `users` table
    - Tracks which organization the user is currently working in
    - Nullable foreign key to organizations table
    - File: `database/migrations/2025_10_07_224258_add_current_organization_id_to_users_table.php`

### 2. Backend Changes

#### User Model Updates (`app/Models/User.php`)

- Added `current_organization_id` to fillable fields
- Added `currentOrganization()` relationship method
- Added `setCurrentOrganization($organizationId)` method to switch organizations
- Validates user belongs to organization before switching

#### Organization Controller (`app/Http/Controllers/OrganizationController.php`)

- **Updated `index()`**: Now only shows organizations the user belongs to
- **Updated `show()`**: Verifies user has access to the organization before viewing
- **Added `selectPage()`**: Displays organization selection page
- **Added `select()`**: Handles organization switching with validation

#### Middleware (`app/Http/Middleware/EnsureUserHasOrganization.php`)

- Automatically redirects users to organization selection if they haven't selected one
- Auto-selects if user only belongs to one organization
- Skips check for organization selection routes
- Registered in `bootstrap/app.php` as web middleware

#### Inertia Middleware (`app/Http/Middleware/HandleInertiaRequests.php`)

- Shares `currentOrganization` with all pages
- Loads user's organizations list for switcher component
- Makes organization context available globally

### 3. Frontend Changes

#### TypeScript Types (`resources/js/types/index.d.ts`)

- Added `currentOrganization: Organization | null` to `SharedData` interface
- Added `current_organization_id` and `current_organization` to `User` interface

#### OrganizationSwitcher Component (`resources/js/components/organization-switcher.tsx`)

- Dropdown component in sidebar header
- Shows current organization name and code
- Lists all user's organizations
- Allows switching between organizations
- Includes link to manage organizations

#### Organization Selection Page (`resources/js/pages/organizations/select.tsx`)

- Full-screen selection page for first-time login
- Grid layout showing all available organizations
- Visual cards with organization info
- Handles case where user has no organizations

#### Sidebar Integration (`resources/js/components/app-sidebar.tsx`)

- Added `OrganizationSwitcher` component to sidebar header
- Appears below the logo/app name

### 4. Routes (`routes/web.php`)

- `GET /organizations/select` - Organization selection page
- `POST /organizations/{organization}/select` - Switch to selected organization

## User Flow

### First Time Login

1. User logs in successfully
2. Middleware checks if `current_organization_id` is set
3. If user has only 1 organization → Auto-select it
4. If user has multiple organizations → Redirect to `/organizations/select`
5. User selects an organization
6. Redirected to dashboard with organization context

### Subsequent Logins

1. User logs in
2. Middleware finds existing `current_organization_id`
3. User proceeds directly to dashboard
4. Can switch organizations using sidebar dropdown

### Switching Organizations

1. Click organization name in sidebar
2. Dropdown shows all available organizations
3. Select different organization
4. Page refreshes with new organization context
5. All data now scoped to selected organization

## Data Scoping

### Current Implementation

- Organizations index: Shows only user's organizations
- Organizations show: Verifies user access before displaying
- Current organization available globally via `usePage<SharedData>().props.currentOrganization`

### Future Implementations

Controllers for Business Units, Processes, Risks, Controls, etc. should:

```php
$user = $request->user();
$currentOrgId = $user->current_organization_id;

// Scope queries by organization
$businessUnits = BusinessUnit::where('organization_id', $currentOrgId)->get();
```

## Testing

### Test Users (from seeder)

All users have password: `password`

1. **Admin (Multi-org)**
    - Email: `admin@example.com`
    - Has access to all 3 organizations
    - Will see selection page on first login

2. **Test User (Multi-org)**
    - Email: `test@example.com`
    - Has access to all 3 organizations
    - Default: TechStart Inc

3. **Audit Chief**
    - Email: `chief@acme.com`
    - ACME Corporation only
    - Auto-selected on login

4. **Auditor**
    - Email: `auditor1@acme.com`
    - ACME Corporation only
    - Auto-selected on login

### Test Scenarios

#### Scenario 1: Multi-org User First Login

1. Login as `admin@example.com` / `password`
2. Should be redirected to organization selection page
3. See all 3 organizations: ACME, Global Finance, TechStart
4. Select one → Redirected to dashboard
5. Organization name appears in sidebar
6. Logout and login again → Goes directly to dashboard

#### Scenario 2: Single-org User

1. Login as `chief@acme.com` / `password`
2. Auto-selected to ACME Corporation
3. Goes directly to dashboard
4. No organization selection needed

#### Scenario 3: Switching Organizations

1. Login as `admin@example.com`
2. Click organization dropdown in sidebar
3. See all available organizations with current one checked
4. Select different organization
5. Page refreshes with new context

## Security

- Users can only see and select organizations they belong to
- Organization access verified before viewing details
- Middleware prevents accessing app without organization context
- All organization-related queries should be scoped by user's current organization

## Next Steps

To complete the multi-tenancy implementation:

1. **Create controllers for GRC entities** (if not exist):
    - BusinessUnitController
    - ProcessController
    - RiskController
    - ControlController
    - AuditMissionController
2. **Scope all queries by current organization**:

    ```php
    $currentOrgId = $request->user()->current_organization_id;
    Model::where('organization_id', $currentOrgId)->get();
    ```

3. **Add organization check to authorization policies**:

    ```php
    public function view(User $user, Model $model)
    {
        return $user->current_organization_id === $model->organization_id;
    }
    ```

4. **Update navigation** to show organization-specific counts and data

5. **Dashboard** should display stats for current organization only

## Files Modified/Created

### Created

- `database/migrations/2025_10_07_224258_add_current_organization_id_to_users_table.php`
- `app/Http/Middleware/EnsureUserHasOrganization.php`
- `resources/js/components/organization-switcher.tsx`
- `resources/js/pages/organizations/select.tsx`
- `ORGANIZATION_SELECTION.md` (this file)

### Modified

- `app/Models/User.php` - Added organization methods
- `app/Http/Controllers/OrganizationController.php` - Added selection logic
- `app/Http/Middleware/HandleInertiaRequests.php` - Share current org
- `bootstrap/app.php` - Register middleware
- `routes/web.php` - Add selection routes
- `resources/js/types/index.d.ts` - TypeScript types
- `resources/js/components/app-sidebar.tsx` - Add switcher component

## Development Server

The app is now running at: http://localhost:8000

Try logging in with any of the test accounts to see the organization selection feature in action!
