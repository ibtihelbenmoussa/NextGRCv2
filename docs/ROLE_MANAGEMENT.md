# Role Management System

## Overview

NextGRC uses **two role systems** that work together:

1. **Organization User Roles** (`organization_user.role`) - Legacy simple role field
2. **Spatie Permission System** (`model_has_roles`) - Full role-permission framework

Both systems are kept in sync to ensure consistency across the application.

## Role Mapping

| Simple Role (organization_user) | Spatie Role Name | Description                |
| ------------------------------- | ---------------- | -------------------------- |
| `admin`                         | Admin            | Full system administrator  |
| `audit_chief`                   | Audit Chief      | Lead auditor for missions  |
| `auditor`                       | Auditor          | Audit team member          |
| `manager`                       | Manager          | Department/process manager |
| `user` or `viewer`              | Viewer           | Read-only access           |

## Synchronization

### Initial Sync

To sync existing roles from `organization_user` to Spatie Permission system:

```bash
php artisan roles:sync --force
```

This command:

- Reads all `organization_user` relationships
- Maps simple roles to Spatie role names
- Assigns users to proper roles in `model_has_roles` table
- Respects organization context (multi-tenancy)

### Automatic Sync

When creating or updating users via `UserController`:

- Spatie roles are assigned first
- The primary role is converted to simple role format
- `organization_user.role` is updated automatically

## Helper Methods

### User Model

```php
// Convert between role formats
User::spatieRoleToSimpleRole('Admin') // Returns: 'admin'
User::simpleRoleToSpatieRole('audit_chief') // Returns: 'Audit Chief'

// Sync organization_user.role based on Spatie roles
$user->syncOrganizationUserRole($organizationId);
```

## Role Assignment Priority

When a user has multiple roles in an organization, the highest priority role is used for `organization_user.role`:

1. Admin (highest)
2. Audit Chief
3. Manager
4. Auditor
5. Viewer (lowest)

## Multi-Tenancy

All role operations must set the organization context:

```php
setPermissionsTeamId($organizationId);

// Now role operations are scoped to this organization
$user->assignRole('Auditor');
$user->hasRole('Admin'); // Only checks in current organization
```

## Querying Roles

### Count users per role (organization-specific)

```php
$roles = Role::where('organization_id', $orgId)
    ->withCount(['users' => function ($query) use ($orgId) {
        $query->where('model_has_roles.organization_id', $orgId);
    }])
    ->get();
```

### Load user's roles in specific organization

```php
$role->load([
    'users' => function ($query) use ($orgId) {
        $query->where('model_has_roles.organization_id', $orgId);
    }
]);
```

## Important Notes

1. **Always set organization context** before role operations
2. **Both systems must stay in sync** - use provided helper methods
3. **Role filtering** must include `model_has_roles.organization_id` in queries
4. **The `organization_user.role` field** stores the PRIMARY role only
5. **Spatie system** allows multiple roles per organization per user

## Troubleshooting

### Users showing 0 count on roles page?

Run the sync command:

```bash
php artisan roles:sync --force
```

### Roles not showing correctly?

Check if organization context is set:

```php
// Before any role operation
setPermissionsTeamId($organizationId);
```

### Role assignments not persisting?

Ensure both systems are updated:

```php
// Set context
setPermissionsTeamId($orgId);

// Assign Spatie role
$user->assignRole('Auditor');

// Sync to organization_user table
$user->syncOrganizationUserRole($orgId);
```
