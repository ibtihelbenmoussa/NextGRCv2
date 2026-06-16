<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $defaultPermissions = [
            // Users Management
            'users.view', 'users.create', 'users.edit',
            'users.delete', 'users.assign-roles',

            // Organizations Management
            'organizations.view', 'organizations.edit',
            'organizations.manage-users',

            // Audit Universe
            'business-units.view', 'business-units.create',
            'business-units.edit', 'business-units.delete',

            'macro-processes.view', 'macro-processes.create',
            'macro-processes.edit', 'macro-processes.delete',

            'processes.view', 'processes.create',
            'processes.edit', 'processes.delete',

            // Risks
            'risks.view', 'risks.create', 'risks.edit', 'risks.delete',
            'view_risk_matrix', 'manage_risk_matrix',
            'view risk configurations', 'manage risk configurations',

            // Controls
            'controls.view', 'controls.create',
            'controls.edit', 'controls.delete',

            // Planning & Audit Missions
            'plannings.view', 'plannings.create',
            'plannings.edit', 'plannings.delete',

            'audit-missions.view', 'audit-missions.create',
            'audit-missions.edit', 'audit-missions.delete',
            'audit-missions.manage-team', 'audit-missions.change-status',
            'audit-missions.manage-risks', 'audit-missions.manage-documents',
            'audit-missions.manage-interviews',

            // Tests
            'tests.view', 'tests.create', 'tests.edit',
            'tests.delete', 'tests.review',

            // Management Comments
            'management-comments.view', 'management-comments.create',
            'management-comments.edit',

            // Reports
            'reports.view', 'reports.create', 'reports.edit',
            'reports.delete', 'reports.export',

            // Roles & Permissions
            'roles.view', 'roles.create', 'roles.edit',
            'roles.delete', 'roles.assign',
            'permissions.view', 'permissions.create', 'permissions.delete',

            // ── NextGRCv2 modules ──────────────────────────

            // Frameworks
            'frameworks.view', 'frameworks.create',
            'frameworks.update', 'frameworks.delete',

            // Requirements
            'requirements.view', 'requirements.create',
            'requirements.update', 'requirements.delete',

            // Gap Assessments
            'gap-assessments.view', 'gap-assessments.create',
            'gap-assessments.update', 'gap-assessments.delete',

            // Gap Results
            'gap-results.view',

            // Action Plans
            'action-plans.view', 'action-plans.create',
            'action-plans.update', 'action-plans.delete',
            'action-plans.view-all', 'action-plans.assign',

            // Documents
            'documents.view', 'documents.create',
            'documents.update', 'documents.delete',

            // BPMN
            'bpmn.view', 'bpmn.create',
            'bpmn.update', 'bpmn.delete',

            // Overview
            'overview.view',
        ];

        // ── Create all permissions ─────────────────────────
        $this->command->info('Creating permissions...');
        $createdPermissions = [];
        foreach ($defaultPermissions as $permName) {
            $createdPermissions[$permName] = Permission::firstOrCreate([
                'name'       => $permName,
                'guard_name' => 'web',
            ]);
        }
        $this->command->info('  ✓ ' . count($createdPermissions) . " permissions\n");

        // ── Roles + permissions ────────────────────────────
        $defaultRoles = [

            'Viewer' => [
                'users.view',
                'organizations.view',
                'business-units.view', 'macro-processes.view', 'processes.view',
                'risks.view', 'view_risk_matrix', 'view risk configurations',
                'controls.view', 'plannings.view',
                'audit-missions.view', 'tests.view',
                'management-comments.view', 'reports.view',
                // GRC
                'frameworks.view', 'requirements.view',
                'gap-assessments.view', 'gap-results.view',
                'action-plans.view', 'documents.view',
                'bpmn.view', 'overview.view',
            ],

            'Auditor' => [
                'users.view', 'organizations.view',
                'business-units.view', 'macro-processes.view', 'processes.view',
                'risks.view', 'view risk configurations',
                'controls.view', 'plannings.view',
                'audit-missions.view',
                'audit-missions.manage-documents', 'audit-missions.manage-interviews',
                'tests.view', 'tests.create', 'tests.edit',
                'management-comments.view', 'reports.view',
                // GRC
                'frameworks.view', 'requirements.view',
                'gap-assessments.view', 'gap-assessments.create',
                'gap-assessments.update', 'gap-assessments.delete',
                'gap-results.view',
                'action-plans.view', 'action-plans.update',
                'documents.view', 'documents.create', 'documents.update',
                'bpmn.view', 'overview.view',
            ],

            'Audit Chief' => [
                'users.view', 'organizations.view',
                'business-units.view', 'macro-processes.view', 'processes.view',
                'risks.view', 'risks.create', 'risks.edit',
                'view_risk_matrix', 'view risk configurations', 'manage risk configurations',
                'controls.view', 'controls.create', 'controls.edit',
                'plannings.view', 'plannings.create', 'plannings.edit',
                'audit-missions.view', 'audit-missions.create', 'audit-missions.edit',
                'audit-missions.manage-team', 'audit-missions.change-status',
                'audit-missions.manage-risks', 'audit-missions.manage-documents',
                'audit-missions.manage-interviews',
                'tests.view', 'tests.create', 'tests.edit',
                'tests.delete', 'tests.review',
                'management-comments.view', 'management-comments.create',
                'reports.view', 'reports.create', 'reports.edit', 'reports.export',
                // GRC
                'frameworks.view', 'requirements.view',
                'gap-assessments.view', 'gap-assessments.create',
                'gap-assessments.update', 'gap-assessments.delete',
                'gap-results.view',
                'action-plans.view', 'action-plans.create',
                'action-plans.update', 'action-plans.delete',
                'action-plans.view-all', 'action-plans.assign',
                'documents.view', 'documents.create',
                'documents.update', 'documents.delete',
                'bpmn.view', 'overview.view',
            ],

            'Manager' => [
                'users.view', 'organizations.view',
                'business-units.view', 'macro-processes.view', 'processes.view',
                'risks.view', 'view risk configurations',
                'controls.view',
                'audit-missions.view', 'tests.view',
                'management-comments.view', 'management-comments.create',
                'management-comments.edit', 'reports.view',
                // GRC
                'frameworks.view', 'frameworks.create',
                'frameworks.update', 'frameworks.delete',
                'requirements.view', 'requirements.create',
                'requirements.update', 'requirements.delete',
                'gap-assessments.view', 'gap-assessments.create',
                'gap-assessments.update', 'gap-assessments.delete',
                'gap-results.view',
                'action-plans.view', 'action-plans.create',
                'action-plans.update', 'action-plans.delete',
                'action-plans.view-all', 'action-plans.assign',
                'documents.view', 'documents.create',
                'documents.update', 'documents.delete',
                'business-units.create', 'business-units.edit', 'business-units.delete',
                'macro-processes.create', 'macro-processes.edit', 'macro-processes.delete',
                'processes.create', 'processes.edit', 'processes.delete',
                'bpmn.view', 'bpmn.create', 'bpmn.update', 'bpmn.delete',
                'overview.view',
            ],

            'Admin' => $defaultPermissions,
        ];

        // ── Sync roles ─────────────────────────────────────
        $this->command->info('Creating roles...');
        foreach ($defaultRoles as $roleName => $permissions) {
            $role = Role::firstOrCreate([
                'name'       => $roleName,
                'guard_name' => 'web',
            ]);

            $permsToSync = array_filter(
                array_map(
                    fn($p) => $createdPermissions[$p] ?? null,
                    $permissions
                )
            );

            $role->syncPermissions($permsToSync);
            $this->command->info("  ✓ {$roleName} ({$role->permissions->count()} permissions)");
        }

        $this->command->newLine();
        $this->command->info('✅ Done!');
    }
}