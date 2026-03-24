<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');
        $this->command->newLine();

        // Seed in dependency order
        $this->call([
            OrganizationSeeder::class,          // Creates organizations and users
            RolesPermissionsSeeder::class,      // Creates permissions and roles per org
            UserRoleAssignmentSeeder::class,    // Assigns Spatie roles to users
            OrganizationalStructureSeeder::class,
            //RiskControlSeeder::class,
            //RiskConfigurationSeeder::class,     // Creates risk configurations
            //AuditSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->newLine();
        $this->command->info('📧 Login credentials:');
        $this->command->info('   Admin: admin@example.com / password');
        $this->command->info('   Audit Chief (ACME): chief@acme.com / password');
        $this->command->info('   Auditor (ACME): auditor1@acme.com / password');
        $this->command->info('   Test User: test@example.com / password');
    }
}
