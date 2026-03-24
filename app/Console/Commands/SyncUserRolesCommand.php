<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class SyncUserRolesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:sync {--force : Force sync even if roles exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync user roles from organization_user table to Spatie Permission system';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting role synchronization...');
        $this->newLine();

        // Role name mapping from organization_user.role to Spatie role names
        $roleMapping = [
            'admin' => 'Admin',
            'audit_chief' => 'Audit Chief',
            'auditor' => 'Auditor',
            'manager' => 'Manager',
            'user' => 'Viewer',
            'viewer' => 'Viewer',
        ];

        $totalSynced = 0;
        $totalSkipped = 0;
        $errors = 0;

        // Get all organization-user relationships
        $orgUsers = DB::table('organization_user')
            ->select('organization_id', 'user_id', 'role')
            ->get();

        $this->info("Found {$orgUsers->count()} organization-user relationships to process");
        $this->newLine();

        foreach ($orgUsers as $orgUser) {
            $organization = Organization::find($orgUser->organization_id);
            $user = User::find($orgUser->user_id);

            if (!$organization || !$user) {
                $this->warn("  ⚠ Skipping: Organization {$orgUser->organization_id} or User {$orgUser->user_id} not found");
                $errors++;
                continue;
            }

            // Map the role name
            $simpleRole = strtolower($orgUser->role);
            $spatieRoleName = $roleMapping[$simpleRole] ?? null;

            if (!$spatieRoleName) {
                $this->warn("  ⚠ Unknown role '{$orgUser->role}' for user {$user->email} in {$organization->name}");
                $errors++;
                continue;
            }

            // Set organization context for Spatie Permission
            setPermissionsTeamId($organization->id);

            // Check if role exists for this organization
            $role = Role::where('name', $spatieRoleName)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$role) {
                $this->warn("  ⚠ Role '{$spatieRoleName}' not found in organization {$organization->name}");
                $errors++;
                continue;
            }

            // Check if user already has this role in this organization
            $hasRole = DB::table('model_has_roles')
                ->where('role_id', $role->id)
                ->where('model_type', 'App\\Models\\User')
                ->where('model_id', $user->id)
                ->where('organization_id', $organization->id)
                ->exists();

            if ($hasRole && !$this->option('force')) {
                $this->line("  → {$user->email} already has {$spatieRoleName} in {$organization->name}");
                $totalSkipped++;
                continue;
            }

            // Remove existing roles for this user in this organization if force flag is set
            if ($this->option('force')) {
                DB::table('model_has_roles')
                    ->where('model_type', 'App\\Models\\User')
                    ->where('model_id', $user->id)
                    ->where('organization_id', $organization->id)
                    ->delete();
            }

            // Assign the role
            try {
                $user->assignRole($role);
                $this->info("  ✓ {$user->email} → {$spatieRoleName} in {$organization->name}");
                $totalSynced++;
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to assign {$spatieRoleName} to {$user->email}: {$e->getMessage()}");
                $errors++;
            }
        }

        // Reset organization context
        setPermissionsTeamId(null);

        $this->newLine();
        $this->info('=' . str_repeat('=', 50));
        $this->info("✅ Synchronization complete!");
        $this->info("  • Synced: {$totalSynced}");
        $this->info("  • Skipped: {$totalSkipped}");
        $this->info("  • Errors: {$errors}");
        $this->info('=' . str_repeat('=', 50));

        return self::SUCCESS;
    }
}
