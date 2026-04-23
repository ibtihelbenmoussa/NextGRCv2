<?php

namespace App\Services;

use App\Models\Requirement;

class GapAssessmentService
{
    // Valeurs des réponses
    private const ANSWER_VALUES = [
        'YES'     => 1.0,
        'PARTIAL' => 0.5,
        'NO'      => 0.0,
    ];

    public function calculate(Requirement $requirement, array $answers): array
    {
        $questions = $requirement->gapQuestions()->orderBy('order')->get();

        if ($questions->isEmpty()) {
            return ['score' => 0, 'maturity_level' => 1, 'gate_capped' => false];
        }

        // Gate check : Q1 (order=1) = NO → cap Level 1
        $firstQuestion = $questions->first();
        $firstAnswer   = $answers[$firstQuestion->id] ?? 'NO';

        $gateCap = null;
        if ($firstAnswer === 'NO') {
            $gateCap = 1;
        } elseif ($firstAnswer === 'PARTIAL') {
            $gateCap = 2;
        }

        // Calcul weighted score
        $total        = 0;
        $totalWeights = 0;

        foreach ($questions as $q) {
            $rawAnswer   = $answers[$q->id] ?? 'NO';
            $answerValue = self::ANSWER_VALUES[$rawAnswer] ?? 0.0;

            $total        += $answerValue * $q->weight;
            $totalWeights += $q->weight;
        }

        $score = $totalWeights > 0
            ? round(($total / $totalWeights) * 100, 2)
            : 0;

        $rawLevel   = $this->mapLevel($score);
        $finalLevel = $gateCap ? min($rawLevel, $gateCap) : $rawLevel;

        return [
            'score'         => $score,
            'maturity_level'=> $finalLevel,
            'raw_level'     => $rawLevel,
            'gate_capped'   => $gateCap !== null,
            'gate_cap'      => $gateCap,
        ];
    }

    private function mapLevel(float $score): int
    {
        if ($score < 20) return 1;
        if ($score < 40) return 2;
        if ($score < 60) return 3;
        if ($score < 80) return 4;
        return 5;
    }

    public function generateQuestionsViaAI(Requirement $requirement): array
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

    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'x-api-key'         => config('services.anthropic.key'),
        'anthropic-version' => '2023-06-01',
        'Content-Type'      => 'application/json',
    ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
        'model'      => 'claude-opus-4-6',
        'max_tokens' => 1000,
        'messages'   => [
            ['role' => 'user', 'content' => $prompt]
        ],
    ]);

    if (!$response->successful()) {
        throw new \RuntimeException('AI question generation failed: ' . $response->status());
    }

    $content = $response->json('content.0.text', '');

    // Clean JSON
    $content = preg_replace('/^```json\s*/i', '', trim($content));
    $content = preg_replace('/\s*```$/m', '', $content);
    $content = trim($content);

    $questions = json_decode($content, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($questions)) {
        throw new \RuntimeException('Invalid JSON from AI: ' . json_last_error_msg());
    }

    // Validate structure
    $valid = [];
    $dimensions = ['Existence', 'Formalization', 'Enforcement', 'Measurement', 'Optimization'];
    $weights    = [0.10, 0.20, 0.30, 0.20, 0.20];

    foreach ($questions as $i => $q) {
        if (empty($q['text'])) continue;
        $valid[] = [
            'order'     => $i + 1,
            'text'      => substr(trim($q['text']), 0, 500),
            'dimension' => $dimensions[$i] ?? 'General',
            'weight'    => $weights[$i] ?? 0.20,
        ];
    }

    if (count($valid) < 3) {
        throw new \RuntimeException('AI returned too few valid questions');
    }

    return $valid;
}
}