<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Requirement;
use App\Models\GapQuestion;

class GapQuestionSeeder extends Seeder
{
    /**
     * Questions par code de requirement.
     * Chaque requirement a 5 questions couvrant les 5 dimensions CMMI.
     */
    private array $questionBank = [

        // ── ISO 4.1 ──────────────────────────────────────────────────────────
        'ISO-4.1' => [
            ['text' => 'Has the organization identified its internal and external context?',              'dimension' => 'Existence',     'weight' => 0.10, 'order' => 1],
            ['text' => 'Is the context analysis formally documented and approved?',                       'dimension' => 'Formalization',  'weight' => 0.20, 'order' => 2],
            ['text' => 'Is context analysis actively used to define ISMS scope and decisions?',           'dimension' => 'Enforcement',    'weight' => 0.30, 'order' => 3],
            ['text' => 'Are context changes tracked and measured against defined criteria?',              'dimension' => 'Measurement',    'weight' => 0.20, 'order' => 4],
            ['text' => 'Is the context analysis reviewed and improved at least annually?',               'dimension' => 'Optimization',   'weight' => 0.20, 'order' => 5],
        ],

        // ── ISO 4.2 ──────────────────────────────────────────────────────────
        'ISO-4.2' => [
            ['text' => 'Has the organization identified its relevant interested parties?',               'dimension' => 'Existence',     'weight' => 0.10, 'order' => 1],
            ['text' => 'Are the needs and expectations of interested parties documented?',               'dimension' => 'Formalization',  'weight' => 0.20, 'order' => 2],
            ['text' => 'Are stakeholder requirements actively integrated into ISMS processes?',          'dimension' => 'Enforcement',    'weight' => 0.30, 'order' => 3],
            ['text' => 'Is stakeholder satisfaction measured through defined KPIs?',                     'dimension' => 'Measurement',    'weight' => 0.20, 'order' => 4],
            ['text' => 'Are stakeholder requirements reviewed regularly and ISMS updated accordingly?',  'dimension' => 'Optimization',   'weight' => 0.20, 'order' => 5],
        ],

        // ── ISO 5.1 ──────────────────────────────────────────────────────────
        'ISO-5.1' => [
            ['text' => 'Is there evidence of leadership commitment to information security?',            'dimension' => 'Existence',     'weight' => 0.10, 'order' => 1],
            ['text' => 'Has leadership formally approved the information security policy?',              'dimension' => 'Formalization',  'weight' => 0.20, 'order' => 2],
            ['text' => 'Does leadership actively participate in ISMS governance and reviews?',           'dimension' => 'Enforcement',    'weight' => 0.30, 'order' => 3],
            ['text' => 'Are leadership ISMS responsibilities measured against performance indicators?',  'dimension' => 'Measurement',    'weight' => 0.20, 'order' => 4],
            ['text' => 'Does leadership drive continual improvement of the ISMS?',                      'dimension' => 'Optimization',   'weight' => 0.20, 'order' => 5],
        ],

        // ── ISO 8.1 ──────────────────────────────────────────────────────────
        'ISO-8.1' => [
            ['text' => 'Does a password/access control policy exist (even informally)?',                'dimension' => 'Existence',     'weight' => 0.10, 'order' => 1],
            ['text' => 'Is the policy written, approved, and communicated to all users?',               'dimension' => 'Formalization',  'weight' => 0.20, 'order' => 2],
            ['text' => 'Is compliance with the policy actively enforced through technical controls?',   'dimension' => 'Enforcement',    'weight' => 0.30, 'order' => 3],
            ['text' => 'Are access control metrics tracked and reviewed periodically?',                 'dimension' => 'Measurement',    'weight' => 0.20, 'order' => 4],
            ['text' => 'Is the policy reviewed and improved based on incidents or audits?',             'dimension' => 'Optimization',   'weight' => 0.20, 'order' => 5],
        ],

        // ── ISO 10.2 ─────────────────────────────────────────────────────────
        'ISO-10.2' => [
            ['text' => 'Does a corrective action process exist for non-conformities?',                  'dimension' => 'Existence',     'weight' => 0.10, 'order' => 1],
            ['text' => 'Is the corrective action process formally documented?',                         'dimension' => 'Formalization',  'weight' => 0.20, 'order' => 2],
            ['text' => 'Are root cause analyses performed for all non-conformities?',                   'dimension' => 'Enforcement',    'weight' => 0.30, 'order' => 3],
            ['text' => 'Are corrective actions tracked with measurable effectiveness criteria?',        'dimension' => 'Measurement',    'weight' => 0.20, 'order' => 4],
            ['text' => 'Is the corrective action process continuously reviewed and improved?',          'dimension' => 'Optimization',   'weight' => 0.20, 'order' => 5],
        ],
    ];

    public function run(): void
    {
        $seeded  = 0;
        $skipped = 0;

        foreach ($this->questionBank as $code => $questions) {
            $requirement = Requirement::where('code', $code)->first();

            if (!$requirement) {
                $this->command->warn("  Requirement [{$code}] not found — skipped");
                $skipped++;
                continue;
            }

            // Éviter les doublons si on re-run le seeder
            GapQuestion::where('requirement_id', $requirement->id)->delete();

            foreach ($questions as $q) {
                GapQuestion::create([
                    'requirement_id' => $requirement->id,
                    'text'           => $q['text'],
                    'dimension'      => $q['dimension'],
                    'weight'         => $q['weight'],
                    'order'          => $q['order'],
                ]);
            }

            $this->command->info("  ✓ {$code} — " . count($questions) . ' questions seeded');
            $seeded++;
        }

        $this->command->info("\n  Total: {$seeded} requirements seeded, {$skipped} skipped");
    }
}