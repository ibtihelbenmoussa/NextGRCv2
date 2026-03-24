<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all unique role names with their counts
        $roleGroups = DB::table('roles')
            ->select('name', 'guard_name')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('name', 'guard_name')
            ->having('count', '>', 1)
            ->get();

        foreach ($roleGroups as $group) {
            // Get all roles with this name and guard
            $duplicateRoles = DB::table('roles')
                ->where('name', $group->name)
                ->where('guard_name', $group->guard_name)
                ->orderBy('id', 'asc')
                ->get();

            if ($duplicateRoles->count() <= 1) {
                continue;
            }

            // Keep the first role (oldest), set its organization_id to null (global)
            $keepRole = $duplicateRoles->first();
            DB::table('roles')
                ->where('id', $keepRole->id)
                ->update(['organization_id' => null]);

            // Get IDs of roles to merge (all except the first one)
            $mergeRoleIds = $duplicateRoles->skip(1)->pluck('id')->toArray();

            // Migrate role_has_permissions: move permissions to the kept role
            $existingPermissions = DB::table('role_has_permissions')
                ->where('role_id', $keepRole->id)
                ->pluck('permission_id')
                ->toArray();

            $permissionsToMigrate = DB::table('role_has_permissions')
                ->whereIn('role_id', $mergeRoleIds)
                ->whereNotIn('permission_id', $existingPermissions)
                ->get();

            foreach ($permissionsToMigrate as $permission) {
                DB::table('role_has_permissions')->insert([
                    'role_id' => $keepRole->id,
                    'permission_id' => $permission->permission_id,
                ]);
            }

            // Migrate model_has_roles: reassign users to the kept role
            $usersWithRole = DB::table('model_has_roles')
                ->whereIn('role_id', $mergeRoleIds)
                ->get();

            foreach ($usersWithRole as $userRole) {
                // Check if user already has this role assigned
                $exists = DB::table('model_has_roles')
                    ->where('role_id', $keepRole->id)
                    ->where('model_type', $userRole->model_type)
                    ->where('model_id', $userRole->model_id)
                    ->exists();

                if (!$exists) {
                    // Remove organization_id constraint by updating to null or keeping the org context
                    DB::table('model_has_roles')->insert([
                        'role_id' => $keepRole->id,
                        'model_type' => $userRole->model_type,
                        'model_id' => $userRole->model_id,
                        'organization_id' => $userRole->organization_id ?? null,
                    ]);
                }
            }

            // Delete old role assignments
            DB::table('model_has_roles')->whereIn('role_id', $mergeRoleIds)->delete();

            // Delete old role permissions
            DB::table('role_has_permissions')->whereIn('role_id', $mergeRoleIds)->delete();

            // Delete duplicate roles
            DB::table('roles')->whereIn('id', $mergeRoleIds)->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this migration as we've lost the organization context
        // Roles have been merged and the original organization assignments are not recoverable
    }
};
