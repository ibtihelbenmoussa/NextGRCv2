<?php

namespace App\Services;

use App\Models\Requirement;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GapAssessmentService
{
    private const ANSWER_VALUES = [
        'YES'     => 1.0,
        'PARTIAL' => 0.5,
        'NO'      => 0.0,
    ];

    private const ML_URL = 'http://localhost:5000';

    // ─── Scoring ──────────────────────────────────────────────────────────────

    public function calculate(Requirement $requirement, array $answers): array
    {
        $questions = $requirement->gapQuestions()->orderBy('order')->get();

        if ($questions->isEmpty()) {
            return [
                'score'          => 0,
                'maturity_level' => 1,
                'raw_level'      => 1,
                'gate_capped'    => false,
                'gate_cap'       => null,
                'source'         => 'rule_based',
            ];
        }

        // Gate check — Q1 determines ceiling
        $firstQuestion = $questions->first();
        $firstAnswer   = $answers[$firstQuestion->id] ?? 'NO';

        $gateCap = match($firstAnswer) {
            'NO'      => 1,
            'PARTIAL' => 2,
            default   => null,
        };

        // Weighted score
        $total        = 0;
        $totalWeights = 0;
        foreach ($questions as $q) {
            $val           = self::ANSWER_VALUES[$answers[$q->id] ?? 'NO'] ?? 0.0;
            $total        += $val * $q->weight;
            $totalWeights += $q->weight;
        }
        $score = $totalWeights > 0 ? round(($total / $totalWeights) * 100, 2) : 0;

        // Try ML model first
        $mlResult = $this->callMLPredict($answers, $questions);

        $rawLevel   = $mlResult ? $mlResult['maturity_level'] : $this->mapLevel($score);
        $finalLevel = $gateCap  ? min($rawLevel, $gateCap)    : $rawLevel;

        return [
            'score'          => $mlResult['weighted_score'] ?? $score,
            'maturity_level' => $finalLevel,
            'raw_level'      => $rawLevel,
            'gate_capped'    => $gateCap !== null,
            'gate_cap'       => $gateCap,
            'confidence'     => $mlResult['confidence']    ?? null,
            'probabilities'  => $mlResult['probabilities'] ?? null,
            'source'         => $mlResult ? 'ml_model' : 'rule_based',
        ];
    }

    // ─── ML Predict ───────────────────────────────────────────────────────────

    private function callMLPredict(array $answers, $questions): ?array
    {
        try {
            $values  = ['YES' => 1.0, 'PARTIAL' => 0.5, 'NO' => 0.0];
            $payload = [];

            foreach ($questions as $i => $question) {
                $answer = $answers[$question->id] ?? 'NO';
                $payload['q' . ($i + 1)] = $values[$answer] ?? 0.0;
            }

            $response = Http::timeout(5)
                ->post(self::ML_URL . '/predict', $payload);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::warning('ML predict unavailable: ' . $e->getMessage());
        }

        return null;
    }

    // ─── ML Question Generation ───────────────────────────────────────────────

    /**
     * Try ML service first, fallback to Anthropic API, then generic questions.
     */
    public function generateQuestionsViaAI(Requirement $requirement): array
    {
        // 1. Try ML service (local, no internet)
        $mlQuestions = $this->generateQuestionsViaML($requirement);
        if ($mlQuestions !== null) {
            Log::info("Questions generated via ML for {$requirement->code}");
            return $mlQuestions;
        }

        // 2. Fallback: Anthropic API
        try {
            $apiQuestions = $this->generateQuestionsViaAnthropic($requirement);
            Log::info("Questions generated via Anthropic API for {$requirement->code}");
            return $apiQuestions;
        } catch (\Exception $e) {
            Log::warning("Anthropic API failed: " . $e->getMessage());
        }

        // 3. Last resort: generic questions
        Log::warning("Using generic questions for {$requirement->code}");
        return $this->genericQuestions($requirement->title);
    }

    private function generateQuestionsViaML(Requirement $requirement): ?array
    {
        try {
            $response = Http::timeout(5)->post(self::ML_URL . '/generate', [
                'code'        => $requirement->code,
                'title'       => $requirement->title,
                'description' => $requirement->description ?? '',
            ]);

            if ($response->successful()) {
                $data      = $response->json();
                $questions = $data['questions'] ?? [];

                if (count($questions) >= 3) {
                    return $questions;
                }
            }
        } catch (\Exception $e) {
            Log::warning('ML generate unavailable: ' . $e->getMessage());
        }

        return null;
    }

    private function generateQuestionsViaAnthropic(Requirement $requirement): array
    {
        $prompt = "You are an ISO 27001:2022 compliance expert.

Generate exactly 5 gap assessment questions for this requirement:
Code: {$requirement->code}
Title: {$requirement->title}
Description: " . ($requirement->description ?? 'No description provided') . "

The 5 questions must follow CMMI maturity levels:
- Q1 (Existence, weight 0.10): Does this control/process exist at all?
- Q2 (Formalization, weight 0.20): Is it formally documented and approved?
- Q3 (Enforcement, weight 0.30): Is it actively enforced with controls?
- Q4 (Measurement, weight 0.20): Are metrics tracked and reviewed?
- Q5 (Optimization, weight 0.20): Is it continuously improved?

Make each question SPECIFIC to the requirement above.
Return ONLY a valid JSON array, no markdown, no explanation:
[
  {\"order\":1,\"text\":\"...\",\"dimension\":\"Existence\",\"weight\":0.10},
  {\"order\":2,\"text\":\"...\",\"dimension\":\"Formalization\",\"weight\":0.20},
  {\"order\":3,\"text\":\"...\",\"dimension\":\"Enforcement\",\"weight\":0.30},
  {\"order\":4,\"text\":\"...\",\"dimension\":\"Measurement\",\"weight\":0.20},
  {\"order\":5,\"text\":\"...\",\"dimension\":\"Optimization\",\"weight\":0.20}
]";

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'Content-Type'      => 'application/json',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-opus-4-6',
            'max_tokens' => 1000,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Anthropic API failed: ' . $response->status());
        }

        $content = $response->json('content.0.text', '');
        $content = preg_replace('/^```json\s*/i', '', trim($content));
        $content = preg_replace('/\s*```$/m', '', $content);
        $questions = json_decode(trim($content), true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($questions)) {
            throw new \RuntimeException('Invalid JSON from Anthropic');
        }

        $valid      = [];
        $dimensions = ['Existence', 'Formalization', 'Enforcement', 'Measurement', 'Optimization'];
        $weights    = [0.10, 0.20, 0.30, 0.20, 0.20];

        foreach ($questions as $i => $q) {
            if (empty($q['text'])) continue;
            $valid[] = [
                'order'     => $i + 1,
                'text'      => substr(trim($q['text']), 0, 500),
                'dimension' => $dimensions[$i] ?? 'General',
                'weight'    => $weights[$i]    ?? 0.20,
            ];
        }

        if (count($valid) < 3) {
            throw new \RuntimeException('Too few valid questions from Anthropic');
        }

        return $valid;
    }

    private function genericQuestions(string $title): array
    {
        return [
            ['order'=>1,'dimension'=>'Existence',    'weight'=>0.10,'text'=>"Does a formal process or policy exist for \"{$title}\"?"],
            ['order'=>2,'dimension'=>'Formalization','weight'=>0.20,'text'=>"Is \"{$title}\" formally documented, approved by management, and communicated?"],
            ['order'=>3,'dimension'=>'Enforcement',  'weight'=>0.30,'text'=>"Are controls actively enforced to ensure compliance with \"{$title}\"?"],
            ['order'=>4,'dimension'=>'Measurement',  'weight'=>0.20,'text'=>"Are metrics tracked and reviewed periodically for \"{$title}\"?"],
            ['order'=>5,'dimension'=>'Optimization', 'weight'=>0.20,'text'=>"Is \"{$title}\" continuously reviewed and improved based on incidents or audits?"],
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function mapLevel(float $score): int
    {
        if ($score < 20) return 1;
        if ($score < 40) return 2;
        if ($score < 60) return 3;
        if ($score < 80) return 4;
        return 5;
    }
}