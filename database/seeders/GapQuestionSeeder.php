<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GapQuestion;
use App\Models\Requirement;

class GapQuestionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [

            // ── ISO 4.1 ──────────────────────────────────────────────────────
            'ISO-4.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Has the organization identified its internal and external context relevant to information security?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the organizational context formally documented and reviewed regularly?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are stakeholder needs and expectations actively integrated into ISMS decisions?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is context analysis measured against defined KPIs or objectives?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the context analysis process continuously improved through feedback loops?'],
            ],

            // ── ISO 4.2 ──────────────────────────────────────────────────────
            'ISO-4.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Has the organization identified all relevant interested parties for the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Are the needs and expectations of interested parties formally documented?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are stakeholder requirements actively addressed within ISMS processes?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is stakeholder satisfaction measured and reported periodically?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are stakeholder requirements reviewed and the ISMS updated accordingly?'],
            ],

            // ── ISO 4.3 ──────────────────────────────────────────────────────
            'ISO-4.3' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Has the scope of the ISMS been defined?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the ISMS scope formally documented and approved?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Is the scope actively enforced with clear boundaries and inclusions?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is the scope reviewed periodically to ensure it remains appropriate?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the scope updated based on changes in context or stakeholder requirements?'],
            ],

            // ── ISO 5.1 ──────────────────────────────────────────────────────
            'ISO-5.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does an information security policy exist at the organizational level?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the information security policy formally approved by top management and communicated?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Is the policy actively enforced with controls and compliance checks?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are policy compliance metrics tracked and reported to management?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the information security policy reviewed and updated at planned intervals?'],
            ],

            // ── ISO 5.2 ──────────────────────────────────────────────────────
            'ISO-5.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Has an information security policy been established by top management?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Does the policy include objectives and commitment to continual improvement?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Is the policy communicated and available to all relevant parties?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is policy awareness measured across the organization?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the policy regularly reviewed for continued suitability?'],
            ],

            // ── ISO 6.1 ──────────────────────────────────────────────────────
            'ISO-6.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a risk assessment process exist for information security?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the risk assessment process formally documented with defined criteria?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are risk assessments performed at planned intervals and when changes occur?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are risk levels measured and prioritized using defined criteria?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the risk assessment process continuously improved based on results?'],
            ],

            // ── ISO 6.2 ──────────────────────────────────────────────────────
            'ISO-6.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Are information security objectives defined for relevant functions?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Are objectives documented, measurable, and communicated?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are plans in place to achieve defined security objectives?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is progress toward objectives monitored and evaluated?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are objectives updated to reflect changes in the organization or risk landscape?'],
            ],

            // ── ISO 7.1 ──────────────────────────────────────────────────────
            'ISO-7.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Has the organization identified resources needed for the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Are resource requirements formally documented and approved?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are adequate resources actively allocated and maintained for the ISMS?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is resource adequacy periodically reviewed and measured?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are resource allocations improved based on ISMS performance results?'],
            ],

            // ── ISO 7.2 ──────────────────────────────────────────────────────
            'ISO-7.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Are competency requirements defined for persons working on information security?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Are competency requirements documented and linked to roles?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are competency gaps identified and addressed through training or hiring?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is the effectiveness of training and competency development measured?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are competency frameworks continuously updated based on evolving threats?'],
            ],

            // ── ISO 8.1 ──────────────────────────────────────────────────────
            'ISO-8.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a formal password security policy exist in your organization?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the password policy documented, approved by management, and communicated to all users?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are technical controls enforced to ensure compliance with the password policy (complexity, expiry, MFA)?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are password compliance metrics tracked and reviewed periodically?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the password policy continuously reviewed and improved based on incidents or audit findings?'],
            ],

            // ── ISO 9.1 ──────────────────────────────────────────────────────
            'ISO-9.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a monitoring and measurement process exist for the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Are monitoring methods and metrics formally defined and documented?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are monitoring and measurement activities performed at planned intervals?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are results analyzed and used to evaluate ISMS performance?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are monitoring approaches improved based on analysis of results?'],
            ],

            // ── ISO 9.2 ──────────────────────────────────────────────────────
            'ISO-9.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does an internal audit program exist for the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the audit program formally documented with scope, frequency, and methods?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are internal audits conducted at planned intervals by competent auditors?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are audit findings tracked and used to measure ISMS conformance?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the audit program continuously improved based on findings and risks?'],
            ],

            // ── ISO 9.3 ──────────────────────────────────────────────────────
            'ISO-9.3' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a management review process exist for the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the management review formally scheduled and documented?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are management reviews conducted at planned intervals with required inputs?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are review outputs documented and tracked for implementation?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are management review processes improved based on ISMS performance trends?'],
            ],

            // ── ISO 10.1 ─────────────────────────────────────────────────────
            'ISO-10.1' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a process exist for continual improvement of the ISMS?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the continual improvement process formally defined and documented?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are improvement actions actively implemented and tracked?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Is the effectiveness of improvement actions measured?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Are improvement processes themselves reviewed and enhanced over time?'],
            ],

            // ── ISO 10.2 ─────────────────────────────────────────────────────
            'ISO-10.2' => [
                ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>'Does a corrective action process exist for handling nonconformities?'],
                ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>'Is the corrective action process formally documented and communicated?'],
                ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>'Are root cause analyses performed for all identified nonconformities?'],
                ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>'Are corrective actions tracked with measurable effectiveness criteria?'],
                ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>'Is the corrective action process continuously reviewed and improved?'],
            ],
        ];

        $seeded  = 0;
        $skipped = 0;

        foreach ($questions as $code => $qs) {
            $requirement = Requirement::where('code', $code)->first();

            if (!$requirement) {
                $this->command->warn("  ⚠ Requirement [{$code}] not found — skipped");
                $skipped++;
                continue;
            }

            foreach ($qs as $q) {
                GapQuestion::firstOrCreate(
                    ['requirement_id' => $requirement->id, 'order' => $q['order']],
                    [
                        'text'      => $q['text'],
                        'dimension' => $q['dimension'],
                        'weight'    => $q['weight'],
                    ]
                );
            }

            $this->command->info("  ✓ {$code} — 5 questions seeded");
            $seeded++;
        }

        $this->command->info("\n  Total: {$seeded} requirements seeded, {$skipped} skipped");
    }
}