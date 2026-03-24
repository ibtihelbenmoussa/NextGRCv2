# GRC Platform - Database Schema Summary

## ✅ Fixed Multi-Tenancy Architecture

### User-Organization Relationship (Many-to-Many)

Users can now belong to **multiple organizations** with different roles in each:

**Pivot Table: `organization_user`**

- `organization_id` - Foreign key to organizations
- `user_id` - Foreign key to users
- `role` - User's role in this organization (admin, audit_chief, auditor, user)
- `is_default` - Marks the user's default/primary organization
- **Unique constraint** on (organization_id, user_id)

## Organization Scoping

### Direct Organization Relationships

These entities directly belong to an organization via `organization_id`:

- ✅ **Organizations** - Root entity
- ✅ **Business Units** - organization_id + unique code per organization
- ✅ **Risks** - organization_id + unique code globally
- ✅ **Controls** - organization_id + unique code globally
- ✅ **Plannings** - organization_id + unique code globally

### Inherited Organization Relationships

These entities inherit organization through hierarchical relationships:

**Through Business Unit:**

- ✅ **Macro Processes** → Business Unit → Organization
- ✅ **Processes** → Macro Process → Business Unit → Organization

**Through Planning:**

- ✅ **Audit Missions** → Planning → Organization
- ✅ **Requested Documents** → Audit Mission → Planning → Organization
- ✅ **Interviews** → Audit Mission → Planning → Organization
- ✅ **Tests** → Audit Mission → Planning → Organization
- ✅ **Management Comments** → Audit Mission → Planning → Organization
- ✅ **Reports** → Audit Mission → Planning → Organization

## Updated Model Methods

### User Model

**Organization Management:**

- `organizations()` - BelongsToMany relationship
- `defaultOrganization()` - Get user's primary organization
- `belongsToOrganization($id)` - Check membership
- `roleInOrganization($id)` - Get user's role in specific org

**Role Checking:**

- `isAdminIn($orgId)` - Check admin status in specific org
- `isAuditChiefIn($orgId)` - Check audit chief status in specific org
- `isAuditorIn($orgId)` - Check auditor status in specific org
- `isAdmin()` - Check if admin in ANY organization
- `isAuditChief()` - Check if audit chief in ANY organization
- `isAuditor()` - Check if auditor in ANY organization

### Organization Model

**User Management:**

- `users()` - BelongsToMany relationship with pivot data (role, is_default)

### Models with Organization Accessors

These models have helper methods to access organization:

- **MacroProcess** - `organization()` and `getOrganizationIdAttribute()`
- **Process** - `organization()` and `getOrganizationIdAttribute()`
- **AuditMission** - `organization()` and `getOrganizationIdAttribute()`

## Database Integrity

### Cascade Rules

- **Organizations deleted** → All related entities cascade delete
- **Business Units deleted** → Macro Processes → Processes cascade delete
- **Plannings deleted** → Audit Missions → All audit entities cascade delete
- **User deleted from org** → Pivot entry removed (many-to-many preserved)

### Unique Constraints

- Organizations: `code` unique globally
- Business Units: `(organization_id, code)` unique per organization
- Macro Processes: `(business_unit_id, code)` unique per BU
- Processes: `(macro_process_id, code)` unique per macro process
- Audit Missions: `(planning_id, code)` unique per planning
- Risks: `code` unique globally
- Controls: `code` unique globally

## Benefits of This Architecture

1. **Flexible User Management**: Users can work across multiple organizations
2. **Role Segmentation**: Different roles in different organizations (auditor in Org A, admin in Org B)
3. **Data Isolation**: Organization data properly scoped and protected
4. **Hierarchical Clarity**: Organization flows naturally through relationships
5. **Audit Trail**: Pivot table tracks when users joined organizations
6. **Default Organization**: Users can have a primary organization for UI/UX

## Next Steps for Implementation

1. **Global Scopes**: Add global scopes to automatically filter by organization
2. **Middleware**: Create middleware to set current organization context
3. **Policies**: Implement authorization policies checking organization membership
4. **Seeders**: Create seeders with multi-org test data
5. **UI**: Add organization selector for users with multiple organizations
6. **API**: Ensure all endpoints scope by organization_id from authenticated user
