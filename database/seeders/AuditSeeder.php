<?php

namespace Database\Seeders;

use App\Enums\AuditMissionStatus;
use App\Enums\TestReviewStatus;
use App\Enums\TestResult;
use App\Models\AuditMission;
use App\Models\Control;
use App\Models\Interview;
use App\Models\ManagementComment;
use App\Models\Organization;
use App\Models\Planning;
use App\Models\Report;
use App\Models\RequestedDocument;
use App\Models\Risk;
use App\Models\Test;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditSeeder extends Seeder
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
            $this->command->info("Seeding audit data for: {$org->name}");

            $this->seedOrganizationAudits($org, $faker);
        }

        $this->command->info('Audit data seeded successfully for ' . $organizations->count() . ' organizations!');
    }

    private function seedOrganizationAudits(Organization $org, $faker): void
    {
        // Get users from this organization
        $auditChiefs = $org->users()->wherePivot('role', 'audit_chief')->get();
        $auditors = $org->users()->wherePivot('role', 'auditor')->get();
        $managers = $org->users()->wherePivot('role', 'manager')->get();

        // Skip if no audit chiefs
        if ($auditChiefs->isEmpty()) {
            return;
        }

        $auditChief = $auditChiefs->first();
        $auditor1 = $auditors->get(0);
        $auditor2 = $auditors->get(1);
        $manager = $managers->first();

        // Get risks and controls for this organization
        $risks = Risk::where('organization_id', $org->id)->get();
        $controls = Control::where('organization_id', $org->id)->get();

        if ($risks->isEmpty() || $controls->isEmpty()) {
            return;
        }

        // Create 1-2 plannings
        $planningCount = $faker->numberBetween(1, 2);

        for ($p = 0; $p < $planningCount; $p++) {
            $year = 2024 + $p;
            $planning = Planning::create([
                'organization_id' => $org->id,
                'code' => 'PLAN-' . $year . '-' . $org->id,
                'name' => "$year Annual Audit Plan",
                'year' => $year,
                'description' => $faker->sentence(),
                'start_date' => "$year-01-01",
                'end_date' => "$year-12-31",
                'is_active' => $p === 0,
            ]);

            // Create 2-4 audit missions per planning
            $missionCount = $faker->numberBetween(2, 4);

            for ($m = 0; $m < $missionCount; $m++) {
                $startMonth = $faker->numberBetween(1, 10);
                $status = $faker->randomElement([
                    AuditMissionStatus::PLANNED,
                    AuditMissionStatus::IN_PROGRESS,
                    AuditMissionStatus::CLOSED,
                ]);

                $mission = AuditMission::create([
                    'planning_id' => $planning->id,
                    'code' => 'AUD-' . $year . '-' . str_pad($m + 1, 3, '0', STR_PAD_LEFT) . '-' . $org->id,
                    'name' => $faker->words(4, true) . ' Audit',
                    'objectives' => $faker->sentence(),
                    'scope' => $faker->paragraph(),
                    'start_date' => "$year-" . str_pad($startMonth, 2, '0', STR_PAD_LEFT) . '-01',
                    'end_date' => "$year-" . str_pad($startMonth + 2, 2, '0', STR_PAD_LEFT) . '-01',
                    'status' => $status,
                    'audit_chief_id' => $auditChief->id,
                ]);

                // Attach auditors
                if ($auditor1) $mission->auditors()->attach($auditor1->id);
                if ($auditor2) $mission->auditors()->attach($auditor2->id);

                // Attach some risks
                $missionRisks = $risks->random(min($faker->numberBetween(2, 4), $risks->count()));

                // Create requested documents
                foreach (range(1, $faker->numberBetween(2, 4)) as $i) {
                    RequestedDocument::create([
                        'audit_mission_id' => $mission->id,
                        'name' => $faker->words(3, true),
                        'description' => $faker->sentence(),
                        'requested_date' => $faker->dateTimeBetween('-30 days', 'now'),
                        'received_date' => $faker->boolean(60) ? $faker->dateTimeBetween('-15 days', 'now') : null,
                        'status' => $faker->randomElement(['requested', 'received', 'not_available']),
                    ]);
                }

                // Create interviews
                foreach (range(1, $faker->numberBetween(1, 3)) as $i) {
                    // Get a random user from the organization to interview
                    $interviewee = $org->users()->inRandomOrder()->first();
                    if ($interviewee) {
                        Interview::create([
                            'audit_mission_id' => $mission->id,
                            'interviewee_id' => $interviewee->id,
                            'title' => $faker->words(4, true),
                            'purpose' => $faker->sentence(),
                            'scheduled_at' => $faker->dateTimeBetween('now', '+30 days'),
                            'conducted_at' => $faker->boolean(40) ? $faker->dateTimeBetween('-15 days', 'now') : null,
                            'location' => $faker->randomElement(['Conference Room A', 'Office', 'Virtual', 'Meeting Room B']),
                            'notes' => $faker->paragraph(),
                            'status' => $faker->randomElement(['scheduled', 'conducted', 'cancelled']),
                        ]);
                    }
                }

                // Create tests if status is in progress or closed
                if ($status !== AuditMissionStatus::PLANNED) {
                    $testCount = $faker->numberBetween(3, 6);

                    foreach (range(1, $testCount) as $i) {
                        $control = $controls->random();
                        $testRisk = $control->risks->first() ?? $missionRisks->random();

                        $test = Test::create([
                            'audit_mission_id' => $mission->id,
                            'control_id' => $control->id,
                            'risk_id' => $testRisk->id,
                            'name' => $faker->words(4, true),
                            'objective' => $faker->sentence(),
                            'test_procedure' => $faker->paragraph(),
                            'sample_description' => $faker->sentence(),
                            'sample_size' => $faker->numberBetween(10, 50),
                            'test_result' => $faker->randomElement([
                                TestResult::EFFECTIVE->value,
                                TestResult::INEFFECTIVE->value,
                                TestResult::PARTIALLY_EFFECTIVE->value,
                            ]),
                            'findings' => $faker->paragraph(),
                            'recommendations' => $faker->sentence(),
                            'review_status' => $status === AuditMissionStatus::CLOSED
                                ? TestReviewStatus::ACCEPTED->value
                                : $faker->randomElement([
                                    TestReviewStatus::PENDING->value,
                                    TestReviewStatus::ACCEPTED->value,
                                    TestReviewStatus::REJECTED->value,
                                ]),
                            'performed_by' => $auditor1?->id,
                            'test_date' => $faker->dateTimeBetween('-30 days', 'now'),
                        ]);
                    }
                }

                // Create management comments if closed
                if ($status === AuditMissionStatus::CLOSED && $manager) {
                    ManagementComment::create([
                        'audit_mission_id' => $mission->id,
                        'finding' => $faker->paragraph(),
                        'management_response' => $faker->paragraph(),
                        'action_plan' => $faker->paragraph(),
                        'responsible_user_id' => $manager->id,
                        'target_date' => $faker->dateTimeBetween('+30 days', '+90 days'),
                        'status' => $faker->randomElement(['pending', 'agreed', 'disagreed', 'implemented']),
                        'submitted_by' => $manager->id,
                        'submitted_at' => $faker->dateTimeBetween('-15 days', 'now'),
                    ]);
                }

                // Create report if closed
                if ($status === AuditMissionStatus::CLOSED) {
                    Report::create([
                        'audit_mission_id' => $mission->id,
                        'title' => $mission->name . ' - Final Report',
                        'executive_summary' => $faker->paragraph(),
                        'findings' => $faker->paragraphs(3, true),
                        'recommendations' => $faker->paragraphs(2, true),
                        'conclusion' => $faker->paragraph(),
                    ]);
                }
            }
        }
    }

    private function seedAcmeAudits(Organization $org): void
    {
        $auditChief = User::where('email', 'chief@acme.com')->first();
        $auditor1 = User::where('email', 'auditor1@acme.com')->first();
        $auditor2 = User::where('email', 'auditor2@acme.com')->first();
        $itManager = User::where('email', 'manager.it@acme.com')->first();
        $financeManager = User::where('email', 'manager.finance@acme.com')->first();

        // Planning: 2025 Audit Plan
        $planning2025 = Planning::create([
            'organization_id' => $org->id,
            'name' => '2025 Internal Audit Plan',
            'code' => 'PLAN-2025',
            'description' => 'Annual internal audit plan for 2025',
            'year' => 2025,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'is_active' => true,
        ]);

        // Audit Mission: IT Controls Audit (Closed)
        $itAudit = AuditMission::create([
            'planning_id' => $planning2025->id,
            'name' => 'IT General Controls Audit',
            'code' => 'AUD-2025-001',
            'description' => 'Assessment of IT general controls including access management and system monitoring',
            'objectives' => 'Evaluate the effectiveness of IT controls to ensure data security and system reliability',
            'scope' => 'IT Operations and Cybersecurity processes',
            'start_date' => '2025-01-15',
            'end_date' => '2025-03-15',
            'status' => AuditMissionStatus::CLOSED,
            'audit_chief_id' => $auditChief?->id,
        ]);

        // Assign auditors
        $itAudit->auditors()->attach($auditor1?->id, ['role' => 'auditor']);
        $itAudit->auditors()->attach($auditor2?->id, ['role' => 'auditor']);

        // Requested Documents
        RequestedDocument::create([
            'audit_mission_id' => $itAudit->id,
            'name' => 'User Access List',
            'description' => 'Complete list of active users and their access rights',
            'status' => 'received',
            'requested_date' => '2025-01-20',
            'received_date' => '2025-01-25',
            'requested_from_user_id' => $itManager?->id,
        ]);

        RequestedDocument::create([
            'audit_mission_id' => $itAudit->id,
            'name' => 'System Monitoring Logs',
            'description' => 'Last 3 months of system monitoring logs and alerts',
            'status' => 'received',
            'requested_date' => '2025-01-20',
            'received_date' => '2025-01-27',
            'requested_from_user_id' => $itManager?->id,
        ]);

        // Interviews
        Interview::create([
            'audit_mission_id' => $itAudit->id,
            'interviewee_id' => $itManager?->id,
            'title' => 'IT Operations Overview',
            'purpose' => 'Understand IT operations processes and control environment',
            'scheduled_at' => '2025-02-01 10:00:00',
            'conducted_at' => '2025-02-01 10:00:00',
            'location' => 'Conference Room A',
            'notes' => 'Discussed IT operations, access management procedures, and system monitoring protocols.',
            'status' => 'conducted',
        ]);

        // Tests
        $accessControl = Control::where('code', 'CTRL-001')->first();
        $passwordControl = Control::where('code', 'CTRL-002')->first();
        $monitoringControl = Control::where('code', 'CTRL-003')->first();
        $dataBreachRisk = Risk::where('code', 'RISK-001')->first();
        $downtimeRisk = Risk::where('code', 'RISK-002')->first();

        $test1 = Test::create([
            'audit_mission_id' => $itAudit->id,
            'control_id' => $accessControl?->id,
            'risk_id' => $dataBreachRisk?->id,
            'name' => 'User Access Review Test',
            'objective' => 'Verify that quarterly user access reviews are performed',
            'test_procedure' => 'Review last 4 quarters of access review documentation. Verify completeness and timeliness.',
            'sample_description' => 'All user access reviews from Q1-Q4 2024',
            'sample_size' => 4,
            'test_result' => TestResult::EFFECTIVE->value,
            'findings' => 'All quarterly reviews were completed on time with appropriate documentation.',
            'recommendations' => null,
            'review_status' => TestReviewStatus::ACCEPTED,
            'review_comments' => 'Test is thorough and conclusion is appropriate.',
            'reviewed_by' => $auditChief?->id,
            'reviewed_at' => '2025-02-15 14:00:00',
            'performed_by' => $auditor1?->id,
            'test_date' => '2025-02-10',
        ]);

        $test2 = Test::create([
            'audit_mission_id' => $itAudit->id,
            'control_id' => $passwordControl?->id,
            'risk_id' => $dataBreachRisk?->id,
            'name' => 'Password Policy Enforcement Test',
            'objective' => 'Verify that password policy is properly configured and enforced',
            'test_procedure' => 'Attempt to create accounts with weak passwords. Review system configuration.',
            'sample_description' => 'Test sample of 10 password creation attempts',
            'sample_size' => 10,
            'test_result' => TestResult::PARTIALLY_EFFECTIVE->value,
            'findings' => 'Password policy is configured correctly, but found 3 legacy accounts with weak passwords that were not forced to update.',
            'recommendations' => 'Implement one-time password reset for all legacy accounts not meeting current policy.',
            'review_status' => TestReviewStatus::ACCEPTED,
            'review_comments' => 'Agreed. Management action plan obtained.',
            'reviewed_by' => $auditChief?->id,
            'reviewed_at' => '2025-02-16 10:00:00',
            'performed_by' => $auditor1?->id,
            'test_date' => '2025-02-12',
        ]);

        $test3 = Test::create([
            'audit_mission_id' => $itAudit->id,
            'control_id' => $monitoringControl?->id,
            'risk_id' => $downtimeRisk?->id,
            'name' => 'System Monitoring Effectiveness Test',
            'objective' => 'Assess the effectiveness of automated system monitoring',
            'test_procedure' => 'Review monitoring alerts for last 3 months. Verify response times to incidents.',
            'sample_description' => 'Sample of 15 monitoring alerts from the last quarter',
            'sample_size' => 15,
            'test_result' => TestResult::EFFECTIVE->value,
            'findings' => 'Monitoring system is functioning well. All critical alerts were responded to within SLA.',
            'recommendations' => null,
            'review_status' => TestReviewStatus::ACCEPTED,
            'reviewed_by' => $auditChief?->id,
            'reviewed_at' => '2025-02-20 11:00:00',
            'performed_by' => $auditor2?->id,
            'test_date' => '2025-02-18',
        ]);

        // Management Comments
        ManagementComment::create([
            'audit_mission_id' => $itAudit->id,
            'test_id' => $test2->id,
            'finding' => 'Legacy accounts with weak passwords not meeting current policy',
            'management_response' => 'We agree with the finding. We will implement a forced password reset for all legacy accounts.',
            'action_plan' => 'IT team will identify all legacy accounts and force password reset within 30 days.',
            'responsible_user_id' => $itManager?->id,
            'target_date' => '2025-03-30',
            'status' => 'agreed',
            'submitted_by' => $itManager?->id,
            'submitted_at' => '2025-02-25 15:00:00',
        ]);

        // Report
        Report::create([
            'audit_mission_id' => $itAudit->id,
            'title' => 'IT General Controls Audit Report',
            'report_type' => 'final',
            'executive_summary' => 'Overall, IT general controls are operating effectively with minor improvement opportunities.',
            'introduction' => 'This audit assessed the effectiveness of IT general controls...',
            'scope_and_methodology' => 'The audit covered IT Operations and Cybersecurity processes...',
            'findings' => '1. User access reviews are effective\n2. Password policy needs enforcement for legacy accounts\n3. System monitoring is effective',
            'recommendations' => '1. Force password reset for legacy accounts\n2. Consider automated password policy compliance monitoring',
            'conclusion' => 'IT controls are generally effective. Management has agreed to address identified issues.',
            'status' => 'issued',
            'prepared_by' => $auditor1?->id,
            'reviewed_by' => $auditChief?->id,
            'approved_by' => $auditChief?->id,
            'issue_date' => '2025-03-15',
        ]);

        // Audit Mission: Finance Controls Audit (In Progress)
        $financeAudit = AuditMission::create([
            'planning_id' => $planning2025->id,
            'name' => 'Financial Controls Review',
            'code' => 'AUD-2025-002',
            'description' => 'Review of key financial controls in the month-end close and accounts payable processes',
            'objectives' => 'Ensure financial controls are designed and operating effectively',
            'scope' => 'Month-End Close, Invoice Processing, and Payment Authorization',
            'start_date' => '2025-04-01',
            'end_date' => '2025-06-30',
            'status' => AuditMissionStatus::IN_PROGRESS,
            'audit_chief_id' => $auditChief?->id,
        ]);

        $financeAudit->auditors()->attach($auditor1?->id, ['role' => 'auditor']);

        // Requested Documents (In Progress)
        RequestedDocument::create([
            'audit_mission_id' => $financeAudit->id,
            'name' => 'Bank Reconciliations',
            'description' => 'Bank reconciliations for last 6 months',
            'status' => 'received',
            'requested_date' => '2025-04-05',
            'received_date' => '2025-04-12',
            'requested_from_user_id' => $financeManager?->id,
        ]);

        RequestedDocument::create([
            'audit_mission_id' => $financeAudit->id,
            'name' => 'Payment Authorization Records',
            'description' => 'Sample of payment authorizations from Q1 2025',
            'status' => 'requested',
            'requested_date' => '2025-04-05',
            'requested_from_user_id' => $financeManager?->id,
        ]);

        // Interview (Scheduled)
        Interview::create([
            'audit_mission_id' => $financeAudit->id,
            'interviewee_id' => $financeManager?->id,
            'title' => 'Financial Controls Discussion',
            'purpose' => 'Discuss financial control environment and key controls',
            'scheduled_at' => '2025-05-15 14:00:00',
            'location' => 'Finance Department',
            'status' => 'scheduled',
        ]);

        // Test (Pending Review)
        $reconciliationControl = Control::where('code', 'CTRL-005')->first();
        $misstatementRisk = Risk::where('code', 'RISK-003')->first();

        Test::create([
            'audit_mission_id' => $financeAudit->id,
            'control_id' => $reconciliationControl?->id,
            'risk_id' => $misstatementRisk?->id,
            'name' => 'Bank Reconciliation Review',
            'objective' => 'Verify that bank reconciliations are performed monthly and reviewed',
            'test_procedure' => 'Review 6 months of bank reconciliations for completeness, accuracy, and timely review.',
            'sample_description' => 'Bank reconciliations for Jan-Jun 2025',
            'sample_size' => 6,
            'test_result' => TestResult::EFFECTIVE->value,
            'findings' => 'All reconciliations completed timely with appropriate review and approval.',
            'recommendations' => null,
            'review_status' => TestReviewStatus::PENDING,
            'performed_by' => $auditor1?->id,
            'test_date' => '2025-05-10',
        ]);

        // Audit Mission: Cybersecurity Assessment (Planned)
        AuditMission::create([
            'planning_id' => $planning2025->id,
            'name' => 'Cybersecurity Assessment',
            'code' => 'AUD-2025-003',
            'description' => 'Comprehensive assessment of cybersecurity controls and practices',
            'objectives' => 'Evaluate cybersecurity posture and identify improvement opportunities',
            'scope' => 'Vulnerability Management, Incident Response, Security Awareness',
            'start_date' => '2025-07-01',
            'end_date' => '2025-09-30',
            'status' => AuditMissionStatus::PLANNED,
            'audit_chief_id' => $auditChief?->id,
        ]);
    }

    private function seedGlobalFinanceAudits(Organization $org): void
    {
        $auditChief = User::where('email', 'chief@globalfinance.com')->first();
        $auditor = User::where('email', 'auditor1@globalfinance.com')->first();

        // Planning: 2025 Audit Plan
        $planning2025 = Planning::create([
            'organization_id' => $org->id,
            'name' => '2025 Risk & Compliance Audit Plan',
            'code' => 'GFG-PLAN-2025',
            'description' => 'Annual audit plan focusing on regulatory compliance',
            'year' => 2025,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'is_active' => true,
        ]);

        // Audit Mission: Regulatory Compliance Audit
        $complianceAudit = AuditMission::create([
            'planning_id' => $planning2025->id,
            'name' => 'Regulatory Compliance Audit',
            'code' => 'GFG-AUD-2025-001',
            'description' => 'Assessment of compliance with financial regulations',
            'objectives' => 'Ensure compliance with applicable financial regulations',
            'scope' => 'Compliance monitoring and regulatory reporting',
            'start_date' => '2025-03-01',
            'end_date' => '2025-05-31',
            'status' => AuditMissionStatus::IN_PROGRESS,
            'audit_chief_id' => $auditChief?->id,
        ]);

        if ($auditor) {
            $complianceAudit->auditors()->attach($auditor->id, ['role' => 'auditor']);
        }
    }
}
