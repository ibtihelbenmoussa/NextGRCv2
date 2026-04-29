<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLMaturityService
{
    private string $apiUrl;

    public function __construct()
    {
        $this->apiUrl = config('services.ml.url', 'http://localhost:5000');
    }

    /**
     * Convertir les answers YES/PARTIAL/NO → valeurs numériques
     * et appeler le ML model
     */
    public function predict(array $answers, array $questions): array
    {
        $values = ['YES' => 1.0, 'PARTIAL' => 0.5, 'NO' => 0.0];

        // Construire le payload q1..q5
        $payload = [];
        foreach ($questions as $i => $question) {
            $answer = $answers[$question->id] ?? 'NO';
            $payload['q' . ($i + 1)] = $values[$answer] ?? 0.0;
        }

        try {
            $response = Http::timeout(10)
                ->post("{$this->apiUrl}/predict", $payload);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'maturity_level' => $data['maturity_level'],
                    'confidence'     => $data['confidence'],
                    'weighted_score' => $data['weighted_score'],
                    'probabilities'  => $data['probabilities'],
                    'source'         => 'ml_model',
                ];
            }

        } catch (\Exception $e) {
            Log::warning('ML API unavailable, falling back to rule-based: ' . $e->getMessage());
        }

        // Fallback → rule-based si ML indisponible
        return ['source' => 'rule_based', 'maturity_level' => null];
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(3)->get("{$this->apiUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}