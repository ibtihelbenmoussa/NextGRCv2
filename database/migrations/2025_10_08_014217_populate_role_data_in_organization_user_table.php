<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update roles based on Spatie permissions
        // This migration attempts to populate the role column from existing Spatie permission assignments

        $organizationUsers = DB::table('organization_user')->get();

        foreach ($organizationUsers as $orgUser) {
            // Check if user has admin role in this organization
            $hasAdminRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('model_has_roles.model_id', $orgUser->user_id)
                ->where('roles.organization_id', $orgUser->organization_id)
                ->where('roles.name', 'Admin')
                ->exists();

            if ($hasAdminRole) {
                DB::table('organization_user')
                    ->where('organization_id', $orgUser->organization_id)
                    ->where('user_id', $orgUser->user_id)
                    ->update(['role' => 'admin']);
                continue;
            }

            // Check for Audit Chief role
            $hasAuditChiefRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('model_has_roles.model_id', $orgUser->user_id)
                ->where('roles.organization_id', $orgUser->organization_id)
                ->where('roles.name', 'Audit Chief')
                ->exists();

            if ($hasAuditChiefRole) {
                DB::table('organization_user')
                    ->where('organization_id', $orgUser->organization_id)
                    ->where('user_id', $orgUser->user_id)
                    ->update(['role' => 'audit_chief']);
                continue;
            }

            // Check for Auditor role
            $hasAuditorRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('model_has_roles.model_id', $orgUser->user_id)
                ->where('roles.organization_id', $orgUser->organization_id)
                ->where('roles.name', 'Auditor')
                ->exists();

            if ($hasAuditorRole) {
                DB::table('organization_user')
                    ->where('organization_id', $orgUser->organization_id)
                    ->where('user_id', $orgUser->user_id)
                    ->update(['role' => 'auditor']);
                continue;
            }

            // Check for Manager role
            $hasManagerRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('model_has_roles.model_id', $orgUser->user_id)
                ->where('roles.organization_id', $orgUser->organization_id)
                ->where('roles.name', 'Manager')
                ->exists();

            if ($hasManagerRole) {
                DB::table('organization_user')
                    ->where('organization_id', $orgUser->organization_id)
                    ->where('user_id', $orgUser->user_id)
                    ->update(['role' => 'manager']);
                continue;
            }

            // Default to 'user' role (already set by default in previous migration)
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset all roles to default 'user'
        DB::table('organization_user')->update(['role' => 'user']);
    }
};
