<?php

namespace Database\Seeders;

use App\Models\BusinessUnit;
use App\Models\MacroProcess;
use App\Models\Organization;
use App\Models\Process;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrganizationalStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organizations = Organization::where('is_active', true)->get();

        if ($organizations->isEmpty()) {
            $this->command->error('No organizations found. Please run OrganizationSeeder first.');
            return;
        }

        $faker = \Faker\Factory::create();

        foreach ($organizations as $org) {
            $this->command->info("Seeding structure for: {$org->name}");

            // Get random users from this organization to act as managers
            $managers = $org->users()->inRandomOrder()->limit(2)->get();

            $this->seedOrganizationStructure($org, $managers, $faker);
        }

        $this->command->info('Organizational structure seeded successfully for ' . $organizations->count() . ' organizations!');
    }

    private function seedOrganizationStructure(Organization $org, $managers, $faker): void
    {
        $manager1 = $managers->get(0);
        $manager2 = $managers->get(1);

        $buNames = ['Information Technology', 'Finance & Accounting', 'Operations', 'Human Resources', 'Sales & Marketing'];
        $buCount = $faker->numberBetween(2, 4);

        foreach (array_slice($buNames, 0, $buCount) as $index => $buName) {
            $code = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $buName), 0, 3));

            $bu = BusinessUnit::create([
                'organization_id' => $org->id,
                'name' => $buName,
                'code' => $code . '-' . $org->id,
                'description' => $faker->catchPhrase(),
                'is_active' => true,
            ]);

            // Attach managers to business unit (both managers)
            if ($manager1) {
                $bu->managers()->attach($manager1->id);
            }
            if ($manager2) {
                $bu->managers()->attach($manager2->id);
            }

            // Create 2-3 macro processes per BU
            $mpCount = $faker->numberBetween(2, 3);
            for ($i = 0; $i < $mpCount; $i++) {
                $mp = MacroProcess::create([
                    'business_unit_id' => $bu->id,
                    'name' => $faker->words(2, true) . ' Management',
                    'code' => strtoupper($code . '-MP' . ($i + 1)),
                    'description' => $faker->sentence(),
                    'is_active' => true,
                ]);

                // Attach managers to macro process
                if ($index === 0 && $manager1) {
                    $mp->managers()->attach($manager1->id);
                } elseif ($manager2) {
                    $mp->managers()->attach($manager2->id);
                }

                // Create 2-4 processes per macro process
                $processCount = $faker->numberBetween(2, 4);
                for ($j = 0; $j < $processCount; $j++) {
                    $process = Process::create([
                        'macro_process_id' => $mp->id,
                        'name' => $faker->words(3, true),
                        'code' => strtoupper($code . '-P' . ($i + 1) . ($j + 1)),
                        'description' => $faker->sentence(),
                        'objectives' => $faker->sentence(),
                        'is_active' => true,
                    ]);

                    // Attach managers to process
                    if ($index === 0 && $manager1) {
                        $process->managers()->attach($manager1->id);
                    } elseif ($manager2) {
                        $process->managers()->attach($manager2->id);
                    }
                }
            }
        }
    }

    private function seedAcmeStructure(Organization $org, ?User $itManager, ?User $financeManager): void
    {
        // Business Unit: Information Technology
        $itBU = BusinessUnit::create([
            'organization_id' => $org->id,
            'name' => 'Information Technology',
            'code' => 'IT',
            'description' => 'Manages all IT infrastructure and systems',
            'is_active' => true,
        ]);
        if ($itManager) {
            $itBU->managers()->attach($itManager->id);
        }

        // Macro Process: IT Operations
        $itOps = MacroProcess::create([
            'business_unit_id' => $itBU->id,
            'name' => 'IT Operations',
            'code' => 'IT-OPS',
            'description' => 'Daily operations and maintenance of IT systems',
            'is_active' => true,
        ]);
        if ($itManager) {
            $itOps->managers()->attach($itManager->id);
        }

        $sysMonProcess = Process::create([
            'macro_process_id' => $itOps->id,
            'name' => 'System Monitoring',
            'code' => 'SYS-MON',
            'description' => 'Monitor system health and performance',
            'objectives' => 'Ensure 99.9% system uptime and quick incident response',
            'is_active' => true,
        ]);
        if ($itManager) {
            $sysMonProcess->managers()->attach($itManager->id);
        }

        $backupProcess = Process::create([
            'macro_process_id' => $itOps->id,
            'name' => 'Backup & Recovery',
            'code' => 'BAK-REC',
            'description' => 'Regular backups and disaster recovery procedures',
            'objectives' => 'Maintain data integrity and enable quick recovery',
            'is_active' => true,
        ]);
        if ($itManager) {
            $backupProcess->managers()->attach($itManager->id);
        }

        // Macro Process: Cybersecurity
        $cyberSec = MacroProcess::create([
            'business_unit_id' => $itBU->id,
            'name' => 'Cybersecurity',
            'code' => 'CYBER',
            'description' => 'Information security and cyber defense',
            'is_active' => true,
        ]);
        if ($itManager) {
            $cyberSec->managers()->attach($itManager->id);
        }

        $accessMgmtProcess = Process::create([
            'macro_process_id' => $cyberSec->id,
            'name' => 'Access Management',
            'code' => 'ACC-MGT',
            'description' => 'User access provisioning and deprovisioning',
            'objectives' => 'Ensure proper access controls and least privilege',
            'is_active' => true,
        ]);
        if ($itManager) {
            $accessMgmtProcess->managers()->attach($itManager->id);
        }

        $vulMgmtProcess = Process::create([
            'macro_process_id' => $cyberSec->id,
            'name' => 'Vulnerability Management',
            'code' => 'VUL-MGT',
            'description' => 'Identify and remediate security vulnerabilities',
            'objectives' => 'Minimize security risks through proactive vulnerability management',
            'is_active' => true,
        ]);
        if ($itManager) {
            $vulMgmtProcess->managers()->attach($itManager->id);
        }

        // Business Unit: Finance
        $financeBU = BusinessUnit::create([
            'organization_id' => $org->id,
            'name' => 'Finance & Accounting',
            'code' => 'FIN',
            'description' => 'Financial management and accounting operations',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $financeBU->managers()->attach($financeManager->id);
        }

        // Macro Process: Financial Reporting
        $finReporting = MacroProcess::create([
            'business_unit_id' => $financeBU->id,
            'name' => 'Financial Reporting',
            'code' => 'FIN-REP',
            'description' => 'Preparation of financial statements and reports',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $finReporting->managers()->attach($financeManager->id);
        }

        $monthEndProcess = Process::create([
            'macro_process_id' => $finReporting->id,
            'name' => 'Month-End Close',
            'code' => 'MEC',
            'description' => 'Monthly financial close procedures',
            'objectives' => 'Accurate and timely monthly financial reporting',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $monthEndProcess->managers()->attach($financeManager->id);
        }

        $finStmtProcess = Process::create([
            'macro_process_id' => $finReporting->id,
            'name' => 'Financial Statement Preparation',
            'code' => 'FIN-STMT',
            'description' => 'Prepare quarterly and annual financial statements',
            'objectives' => 'Ensure compliance with accounting standards',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $finStmtProcess->managers()->attach($financeManager->id);
        }

        // Macro Process: Accounts Payable
        $accountsPayable = MacroProcess::create([
            'business_unit_id' => $financeBU->id,
            'name' => 'Accounts Payable',
            'code' => 'AP',
            'description' => 'Vendor payment processing',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $accountsPayable->managers()->attach($financeManager->id);
        }

        $invProcProcess = Process::create([
            'macro_process_id' => $accountsPayable->id,
            'name' => 'Invoice Processing',
            'code' => 'INV-PROC',
            'description' => 'Process and approve vendor invoices',
            'objectives' => 'Timely and accurate payment to vendors',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $invProcProcess->managers()->attach($financeManager->id);
        }

        $payAuthProcess = Process::create([
            'macro_process_id' => $accountsPayable->id,
            'name' => 'Payment Authorization',
            'code' => 'PAY-AUTH',
            'description' => 'Authorize and execute payments',
            'objectives' => 'Ensure proper payment controls and fraud prevention',
            'is_active' => true,
        ]);
        if ($financeManager) {
            $payAuthProcess->managers()->attach($financeManager->id);
        }

        // Business Unit: Operations
        $opsBU = BusinessUnit::create([
            'organization_id' => $org->id,
            'name' => 'Operations',
            'code' => 'OPS',
            'description' => 'Core business operations',
            'is_active' => true,
        ]);

        $procurement = MacroProcess::create([
            'business_unit_id' => $opsBU->id,
            'name' => 'Procurement',
            'code' => 'PROC',
            'description' => 'Purchasing and vendor management',
            'is_active' => true,
        ]);

        $poMgmtProcess = Process::create([
            'macro_process_id' => $procurement->id,
            'name' => 'Purchase Order Management',
            'code' => 'PO-MGT',
            'description' => 'Create and manage purchase orders',
            'objectives' => 'Efficient procurement with proper approvals',
            'is_active' => true,
        ]);
    }

    private function seedGlobalFinanceStructure(Organization $org): void
    {
        // Business Unit: Risk Management
        $riskBU = BusinessUnit::create([
            'organization_id' => $org->id,
            'name' => 'Risk Management',
            'code' => 'RISK',
            'description' => 'Enterprise risk management',
            'is_active' => true,
        ]);

        $riskAssessment = MacroProcess::create([
            'business_unit_id' => $riskBU->id,
            'name' => 'Risk Assessment',
            'code' => 'RISK-ASSESS',
            'description' => 'Identify and assess organizational risks',
            'is_active' => true,
        ]);

        $riskIdProcess = Process::create([
            'macro_process_id' => $riskAssessment->id,
            'name' => 'Risk Identification',
            'code' => 'RISK-ID',
            'description' => 'Identify potential risks across the organization',
            'objectives' => 'Comprehensive risk identification',
            'is_active' => true,
        ]);

        // Business Unit: Compliance
        $complianceBU = BusinessUnit::create([
            'organization_id' => $org->id,
            'name' => 'Compliance',
            'code' => 'COMP',
            'description' => 'Regulatory compliance and controls',
            'is_active' => true,
        ]);

        $regulatory = MacroProcess::create([
            'business_unit_id' => $complianceBU->id,
            'name' => 'Regulatory Compliance',
            'code' => 'REG-COMP',
            'description' => 'Ensure compliance with regulations',
            'is_active' => true,
        ]);

        $compMonProcess = Process::create([
            'macro_process_id' => $regulatory->id,
            'name' => 'Compliance Monitoring',
            'code' => 'COMP-MON',
            'description' => 'Monitor compliance with regulations',
            'objectives' => 'Maintain regulatory compliance',
            'is_active' => true,
        ]);
    }
}
