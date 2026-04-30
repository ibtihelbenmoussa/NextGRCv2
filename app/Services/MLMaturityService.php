<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLMaturityService
{
    private string $apiUrl;

    private const SCALE_TO_FLOAT = [
        0 => 0.0,
        1 => 0.25,
        2 => 0.5,
        3 => 0.75,
        4 => 1.0,
    ];

    public function __construct()
    {
        $this->apiUrl = config('services.ml.url', 'http://localhost:5000');
    }

    /**
     * Predict maturity level from answers.
     *
     * @param  array       $answers    [ question_id => int 0..4 ]
     * @param  Collection  $questions  Eloquent Collection of GapQuestion models (ordered)
     */
    public function predict(array $answers, Collection $questions): array
    {
        $count  = $questions->count();

        // Step 1 — convert all answers to floats
        $floats = $questions->map(function ($q) use ($answers) {
            $raw = isset($answers[$q->id]) ? (int) $answers[$q->id] : 0;
            return self::SCALE_TO_FLOAT[max(0, min(4, $raw))];
        })->values()->toArray();

        // Step 2 — build exactly 5 features for the ML model
        $payload = $this->buildMLPayload($floats, $count);

        Log::debug('MLMaturityService::predict payload', array_merge(
            $payload,
            ['_original_count' => $count]
        ));

        try {
            $response = Http::timeout(10)->post("{$this->apiUrl}/predict", $payload);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['maturity_level'], $data['weighted_score'])) {
                    return [
                        'maturity_level' => (int)   $data['maturity_level'],
                        'confidence'     => (float) ($data['confidence']    ?? 0),
                        'weighted_score' => (float)  $data['weighted_score'],
                        'probabilities'  =>           $data['probabilities'] ?? null,
                        'source'         => 'ml_model',
                    ];
                }

                Log::warning('ML predict: missing fields in response', ['data' => $data]);
            } else {
                Log::warning('ML predict non-2xx', ['status' => $response->status()]);
            }
        } catch (\Exception $e) {
            Log::warning('ML API unavailable: ' . $e->getMessage());
        }

        return $this->fallbackPredict($answers, $questions);
    }

    /**
     * Build exactly 5 ML features from N answers.
     *
     * Strategy per N:
     *   N < 5  → compute average of all answers, fill all 5 features with it.
     *            The model sees a consistent signal instead of zeros diluting
     *            the weighted score (q3 has weight 0.30 — a false 0 hurts a lot).
     *   N = 5  → perfect 1-to-1 mapping.
     *   N > 5  → round-robin distribution, average each bucket.
     *
     * Examples (N=2, both answers = 0.5):
     *   Before: q1=0.5, q2=0.0, q3=0.0, q4=0.0, q5=0.5  → weighted≈15%  ❌
     *   After:  q1=0.5, q2=0.5, q3=0.5, q4=0.5, q5=0.5  → weighted=50%  ✅
     */
    private function buildMLPayload(array $floats, int $count): array
{
    $payload = [];

    if ($count === 0) {
        for ($i = 1; $i <= 5; $i++) {
            $payload["q{$i}"] = 0.0;
        }

    } elseif ($count >= 5) {
        // N=5 → perfect 1-to-1 | N>5 → round-robin bucket average
        $buckets = [[], [], [], [], []];
        foreach ($floats as $i => $val) {
            $buckets[$i % 5][] = $val;
        }
        foreach ($buckets as $i => $bucket) {
            $payload['q' . ($i + 1)] = count($bucket)
                ? round(array_sum($bucket) / count($bucket), 4)
                : 0.0;
        }

    } else {
        // N < 5 — interpolate: spread actual answers across 5 positions
        // e.g. N=2 [0.25, 0.75] → [0.25, 0.25, 0.50, 0.75, 0.75]
        // e.g. N=3 [0.0, 0.5, 1.0] → [0.0, 0.25, 0.5, 0.75, 1.0]
        for ($i = 0; $i < 5; $i++) {
            // Map position i (0..4) back to float index in $floats
            $srcPos = $i * ($count - 1) / 4;   // e.g. i=2,count=2 → 0.5
            $lo     = (int) floor($srcPos);
            $hi     = (int) ceil($srcPos);
            $frac   = $srcPos - $lo;

            $lo = max(0, min($count - 1, $lo));
            $hi = max(0, min($count - 1, $hi));

            // Linear interpolation between the two nearest answers
            $val = $floats[$lo] + $frac * ($floats[$hi] - $floats[$lo]);

            $payload['q' . ($i + 1)] = round($val, 4);
        }
    }

    return $payload;
}

    /**
     * Call /analyze to get full roadmap from ML API.
     */
    public function analyze(array $payload): array
    {
        try {
            $response = Http::timeout(10)->post("{$this->apiUrl}/analyze", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('ML analyze non-2xx', ['status' => $response->status()]);
        } catch (\Exception $e) {
            Log::warning('ML analyze unavailable: ' . $e->getMessage());
        }

        return ['error' => 'ML API unavailable'];
    }

    /**
     * Rule-based fallback: simple average 0..4 → maturity level 1..5
     */
    private function fallbackPredict(array $answers, Collection $questions): array
    {
        $total = 0;
        $count = $questions->count();

        foreach ($questions as $question) {
            $total += (int) ($answers[$question->id] ?? 0);
        }

        $avg   = $count > 0 ? $total / $count : 0;
        $level = max(1, min(5, (int) ceil(($avg / 4) * 5)));

        return [
            'maturity_level' => $level,
            'confidence'     => null,
            'weighted_score' => round(($avg / 4) * 100, 2),
            'probabilities'  => null,
            'source'         => 'rule_based',
        ];
    }

    /**
     * Check if ML service is reachable.
     */
    public function isAvailable(): bool
    {
        try {
            return Http::timeout(3)->get("{$this->apiUrl}/health")->successful();
        } catch (\Exception) {
            return false;
        }
    }
}