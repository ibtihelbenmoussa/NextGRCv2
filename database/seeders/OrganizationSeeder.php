<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create();

        // Organization types for realistic names
        $orgTypes = ['Corporation', 'Group', 'Inc', 'Ltd', 'Holdings', 'Partners', 'Enterprises', 'Solutions', 'Industries', 'International'];
        $industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Energy', 'Retail', 'Consulting', 'Logistics', 'Real Estate', 'Telecom'];

        // Create 20 organizations with Faker
        $organizations = [];
        for ($i = 0; $i < 20; $i++) {
            $companyName = $faker->company();
            $code = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $companyName), 0, 4));

            // Make sure code is unique by appending number if needed
            $originalCode = $code;
            $counter = 1;
            while (Organization::where('code', $code)->exists()) {
                $code = $originalCode . $counter;
                $counter++;
            }

            $org = Organization::create([
                'name' => $companyName,
                'code' => $code,
                'description' => $faker->catchPhrase() . ' specializing in ' . $faker->randomElement($industries),
                'email' => $faker->unique()->companyEmail(),
                'phone' => $faker->phoneNumber(),
                'address' => $faker->streetAddress() . ', ' . $faker->city() . ', ' . $faker->stateAbbr() . ' ' . $faker->postcode(),
                'is_active' => $faker->boolean(90), // 90% active
            ]);

            $organizations[] = $org;
        }

        // Keep the first 3 organizations for consistent seeding
        $acmeOrg = $organizations[0];
        $globalOrg = $organizations[1];
        $techOrg = $organizations[2];

        // Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'IT',
                'job_title' => 'System Administrator',
            ]
        );

        $auditChief1 = User::firstOrCreate(
            ['email' => 'chief@acme.com'],
            [
                'name' => 'Sarah Johnson',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Internal Audit',
                'job_title' => 'Chief Auditor',
            ]
        );

        $auditChief2 = User::firstOrCreate(
            ['email' => 'chief@globalfinance.com'],
            [
                'name' => 'Michael Chen',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Risk & Compliance',
                'job_title' => 'Head of Internal Audit',
            ]
        );

        $auditor1 = User::firstOrCreate(
            ['email' => 'auditor1@acme.com'],
            [
                'name' => 'Emily Davis',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Internal Audit',
                'job_title' => 'Senior Auditor',
            ]
        );

        $auditor2 = User::firstOrCreate(
            ['email' => 'auditor2@acme.com'],
            [
                'name' => 'James Wilson',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Internal Audit',
                'job_title' => 'Auditor',
            ]
        );

        $auditor3 = User::firstOrCreate(
            ['email' => 'auditor1@globalfinance.com'],
            [
                'name' => 'Lisa Anderson',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Risk & Compliance',
                'job_title' => 'IT Auditor',
            ]
        );

        $manager1 = User::firstOrCreate(
            ['email' => 'manager.it@acme.com'],
            [
                'name' => 'Robert Martinez',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Information Technology',
                'job_title' => 'IT Manager',
            ]
        );

        $manager2 = User::firstOrCreate(
            ['email' => 'manager.finance@acme.com'],
            [
                'name' => 'Jennifer Lee',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Finance',
                'job_title' => 'Finance Director',
            ]
        );

        $user1 = User::firstOrCreate(
            ['email' => 'user@acme.com'],
            [
                'name' => 'David Brown',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Operations',
                'job_title' => 'Operations Manager',
            ]
        );

        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department' => 'Testing',
                'job_title' => 'Test User',
            ]
        );

        // Attach admin user to ALL organizations
        $roleAssignments = [];
        foreach ($organizations as $index => $org) {
            $isDefault = ($index === 0); // First organization is default for admin
            $org->users()->attach($admin, ['role' => 'admin', 'is_default' => $isDefault]);

            $roleAssignments[$org->id] = [
                $admin->id => 'Admin',
            ];
        }

        // Attach users to first organization (ACME)
        $acmeOrg->users()->attach($auditChief1, ['role' => 'audit_chief', 'is_default' => true]);
        $acmeOrg->users()->attach($auditor1, ['role' => 'auditor', 'is_default' => true]);
        $acmeOrg->users()->attach($auditor2, ['role' => 'auditor', 'is_default' => true]);
        $acmeOrg->users()->attach($manager1, ['role' => 'manager', 'is_default' => true]);
        $acmeOrg->users()->attach($manager2, ['role' => 'manager', 'is_default' => true]);
        $acmeOrg->users()->attach($user1, ['role' => 'user', 'is_default' => true]);
        $acmeOrg->users()->attach($testUser, ['role' => 'admin', 'is_default' => false]);

        $roleAssignments[$acmeOrg->id][$auditChief1->id] = 'Audit Chief';
        $roleAssignments[$acmeOrg->id][$auditor1->id] = 'Auditor';
        $roleAssignments[$acmeOrg->id][$auditor2->id] = 'Auditor';
        $roleAssignments[$acmeOrg->id][$manager1->id] = 'Manager';
        $roleAssignments[$acmeOrg->id][$manager2->id] = 'Manager';
        $roleAssignments[$acmeOrg->id][$user1->id] = 'Viewer';
        $roleAssignments[$acmeOrg->id][$testUser->id] = 'Admin';

        // Attach users to second organization (Global Finance)
        $globalOrg->users()->attach($auditChief2, ['role' => 'audit_chief', 'is_default' => true]);
        $globalOrg->users()->attach($auditor3, ['role' => 'auditor', 'is_default' => true]);
        $globalOrg->users()->attach($testUser, ['role' => 'auditor', 'is_default' => false]);

        $roleAssignments[$globalOrg->id][$auditChief2->id] = 'Audit Chief';
        $roleAssignments[$globalOrg->id][$auditor3->id] = 'Auditor';
        $roleAssignments[$globalOrg->id][$testUser->id] = 'Auditor';

        // Attach test user to third organization
        $techOrg->users()->attach($testUser, ['role' => 'user', 'is_default' => true]);
        $roleAssignments[$techOrg->id][$testUser->id] = 'Viewer';

        // Store in cache for UserRoleAssignmentSeeder to use
        cache()->put('seeder_role_assignments', $roleAssignments, now()->addHour());

        $this->command->info('Organizations and Users seeded successfully!');
        $this->command->info('- ' . count($organizations) . ' Organizations created');
        $this->command->info('- 10 Users created');
        $this->command->info('- Users attached to organizations with roles');
    }
}
