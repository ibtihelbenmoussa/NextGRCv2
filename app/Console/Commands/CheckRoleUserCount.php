<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckRoleUserCount extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:role-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check role user counts in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking model_has_roles table...');

        // Get all entries
        $allEntries = DB::table('model_has_roles')
            ->select('role_id', 'model_id', 'organization_id')
            ->orderBy('role_id')
            ->orderBy('model_id')
            ->get();

        $this->info('Total entries in model_has_roles: ' . $allEntries->count());

        // Group by role
        $grouped = $allEntries->groupBy('role_id');

        foreach ($grouped as $roleId => $entries) {
            $role = DB::table('roles')->where('id', $roleId)->first();
            $this->info("\nRole ID: {$roleId} - Name: " . ($role->name ?? 'Unknown'));
            $this->info("  Total entries: " . $entries->count());
            $this->info("  Distinct users: " . $entries->unique('model_id')->count());

            // Show details
            foreach ($entries as $entry) {
                $this->line("    User ID: {$entry->model_id}, Org ID: {$entry->organization_id}");
            }
        }

        // Total unique users across all roles
        $totalUniqueUsers = $allEntries->unique('model_id')->count();
        $this->info("\n=== Summary ===");
        $this->info("Total unique users across all roles: {$totalUniqueUsers}");

        return Command::SUCCESS;
    }
}
