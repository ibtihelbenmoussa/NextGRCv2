<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserRoleAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Assigning Spatie roles to users...');

        // Get role assignments from cache (set by OrganizationSeeder)
        $roleAssignments = cache()->get('seeder_role_assignments', []);

        if (empty($roleAssignments)) {
            $this->command->error('No role assignments found in cache!');
            return;
        }

        foreach ($roleAssignments as $organizationId => $userRoles) {
            $organization = Organization::find($organizationId);

            if (!$organization) {
                $this->command->warn("  ⚠ Organization ID {$organizationId} not found");
                continue;
            }

            $this->command->info("  Processing: {$organization->name}");

            // Set the organization context
            setPermissionsTeamId($organization->id);

            foreach ($userRoles as $userId => $roleName) {
                $user = User::find($userId);

                if (!$user) {
                    $this->command->warn("    ⚠ User ID {$userId} not found");
                    continue;
                }

                // Remove any existing roles for this user in this organization
                $user->roles()->where('organization_id', $organization->id)->detach();

                // Assign the new role
                $user->assignRole($roleName);

                $this->command->info("    ✓ {$user->email} → {$roleName}");
            }
        }

        // Reset the team ID context
        setPermissionsTeamId(null);

        // Clear the cache
        cache()->forget('seeder_role_assignments');

        $this->command->newLine();
        $this->command->info('✅ User role assignments completed!');
    }
}
