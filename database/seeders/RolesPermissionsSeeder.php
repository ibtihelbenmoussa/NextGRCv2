<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Organization;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create global roles (not per organization)
        $roles = [
            'Admin',
            'Audit Chief',
            'Auditor',
            'Manager',
            'Viewer',
        ];

        // Default GRC permissions categorized by module
        $defaultPermissions = [
            // Users Management
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign-roles',

            // Organizations Management
            'organizations.view',
            'organizations.edit',
            'organizations.manage-users',

            // Audit Universe - Business Units
            'business-units.view',
            'business-units.create',
            'business-units.edit',
            'business-units.delete',

            // Audit Universe - Macro Processes
            'macro-processes.view',
            'macro-processes.create',
            'macro-processes.edit',
            'macro-processes.delete',

            // Audit Universe - Processes
            'processes.view',
            'processes.create',
            'processes.edit',
            'processes.delete',

            // Risks Management
            'risks.view',
            'risks.create',
            'risks.edit',
            'risks.delete',

            // Risk Matrix Configuration (Legacy)
            'view_risk_matrix',
            'manage_risk_matrix',
            
            // Risk Configuration (ORM)
            'view risk configurations',
            'manage risk configurations',

            // Controls Management
            'controls.view',
            'controls.create',
            'controls.edit',
            'controls.delete',

            // Planning & Audit Missions
            'plannings.view',
            'plannings.create',
            'plannings.edit',
            'plannings.delete',

            'audit-missions.view',
            'audit-missions.create',
            'audit-missions.edit',
            'audit-missions.delete',
            'audit-missions.manage-team',
            'audit-missions.change-status',

            // Audit Mission - Planification Phase
            'audit-missions.manage-risks',
            'audit-missions.manage-documents',
            'audit-missions.manage-interviews',

            // Audit Mission - Testing Phase
            'tests.view',
            'tests.create',
            'tests.edit',
            'tests.delete',
            'tests.review', // For Audit Chief to review tests

            // Audit Mission - Management Comments
            'management-comments.view',
            'management-comments.create',
            'management-comments.edit',

            // Reports
            'reports.view',
            'reports.create',
            'reports.edit',
            'reports.delete',
            'reports.export',

            // Roles & Permissions
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.assign',

            'permissions.view',
            'permissions.create',
            'permissions.delete',
        ];

        // Default roles with their permission sets
        $defaultRoles = [
            'Admin' => [
                'description' => 'Full system access with all permissions',
                'permissions' => $defaultPermissions,
            ],
            'Audit Chief' => [
                'description' => 'Lead auditor with team management and review capabilities',
                'permissions' => [
                    'users.view',
                    'organizations.view',
                    'business-units.view',
                    'macro-processes.view',
                    'processes.view',
                    'risks.view',
                    'risks.create',
                    'risks.edit',
                    'view_risk_matrix',
                    'view risk configurations',
                    'manage risk configurations',
                    'controls.view',
                    'controls.create',
                    'controls.edit',
                    'plannings.view',
                    'plannings.create',
                    'plannings.edit',
                    'audit-missions.view',
                    'audit-missions.create',
                    'audit-missions.edit',
                    'audit-missions.manage-team',
                    'audit-missions.change-status',
                    'audit-missions.manage-risks',
                    'audit-missions.manage-documents',
                    'audit-missions.manage-interviews',
                    'tests.view',
                    'tests.create',
                    'tests.edit',
                    'tests.delete',
                    'tests.review',
                    'management-comments.view',
                    'management-comments.create',
                    'reports.view',
                    'reports.create',
                    'reports.edit',
                    'reports.export',
                ],
            ],
            'Auditor' => [
                'description' => 'Audit team member with testing and documentation capabilities',
                'permissions' => [
                    'users.view',
                    'organizations.view',
                    'business-units.view',
                    'macro-processes.view',
                    'processes.view',
                    'risks.view',
                    'view risk configurations',
                    'controls.view',
                    'plannings.view',
                    'audit-missions.view',
                    'audit-missions.manage-documents',
                    'audit-missions.manage-interviews',
                    'tests.view',
                    'tests.create',
                    'tests.edit',
                    'management-comments.view',
                    'reports.view',
                ],
            ],
            'Manager' => [
                'description' => 'Management with comment and review capabilities',
                'permissions' => [
                    'users.view',
                    'organizations.view',
                    'business-units.view',
                    'macro-processes.view',
                    'processes.view',
                    'risks.view',
                    'view risk configurations',
                    'controls.view',
                    'audit-missions.view',
                    'tests.view',
                    'management-comments.view',
                    'management-comments.create',
                    'management-comments.edit',
                    'reports.view',
                ],
            ],
            'Viewer' => [
                'description' => 'Read-only access to audit information',
                'permissions' => [
                    'users.view',
                    'organizations.view',
                    'business-units.view',
                    'macro-processes.view',
                    'processes.view',
                    'risks.view',
                    'view risk configurations',
                    'controls.view',
                    'plannings.view',
                    'audit-missions.view',
                    'tests.view',
                    'management-comments.view',
                    'reports.view',
                ],
            ],
        ];

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $this->command->info("Creating permissions...");
        $createdPermissions = [];
        foreach ($defaultPermissions as $permissionName) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
            $createdPermissions[$permissionName] = $permission;
        }

        $this->command->info("  ✓ Created/found " . count($createdPermissions) . " permissions\n");

        // Create global roles and assign permissions
        $this->command->info("Creating global roles...");
        foreach ($defaultRoles as $roleName => $roleData) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            // Assign permissions
            $rolePermissions = [];
            foreach ($roleData['permissions'] as $permissionName) {
                if (isset($createdPermissions[$permissionName])) {
                    $rolePermissions[] = $createdPermissions[$permissionName];
                }
            }

            $role->syncPermissions($rolePermissions);

            $this->command->info("  ✓ {$roleName} ({$role->permissions->count()} permissions)");
        }

        $this->command->newLine();
        $this->command->info('✅ Roles and permissions seeded successfully!');
    }
}
