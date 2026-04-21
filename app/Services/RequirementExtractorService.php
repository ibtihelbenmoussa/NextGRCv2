<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RequirementExtractorService
{
    public function extract(string $documentText, string $frameworkHint = ''): array
    {
        // Nettoyer le texte avant extraction
        $cleanedText = $this->cleanText($documentText);
        $truncated = mb_substr($cleanedText, 0, 60000);

        // 1. Groq — modèle puissant
        try {
            $result = $this->extractWithGroq($truncated, $frameworkHint);
            Log::info('RequirementExtractor: Groq used', ['count' => count($result)]);
            return $result;
        } catch (\Throwable $e) {
            Log::warning('Groq failed', ['error' => $e->getMessage()]);
        }

        // 2. Ollama local
        try {
            $result = $this->extractWithOllama($truncated, $frameworkHint);
            Log::info('RequirementExtractor: Ollama used', ['count' => count($result)]);
            return $result;
        } catch (\Throwable $e) {
            Log::warning('Ollama failed', ['error' => $e->getMessage()]);
        }

        // 3. Regex local (dernier recours)
        return $this->extractLocally($cleanedText, $frameworkHint);
    }

    /**
     * Nettoie le texte extrait du PDF
     */
    private function cleanText(string $text): string
    {
        // Supprimer les lignes de numéros parasites (pages 3, 26-27 du PDF)
        $text = preg_replace('/^[0-9\s\.]+\s*$/m', '', $text);
        
        // Supprimer les caractères de contrôle et spéciaux
        $text = preg_replace('/[\x00-\x1F\x7F-\x9F]/u', '', $text);
        
        // Supprimer les caractères répétés comme les lignes de tirets
        $text = preg_replace('/[-ÿ]{10,}/', '', $text);
        
        // Supprimer les lignes de copyright et licences
        $text = preg_replace('/Licensed to.*$/m', '', $text);
        $text = preg_replace('/© ISO\/IEC.*$/m', '', $text);
        
        // Nettoyer les espaces multiples
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Restaurer les sauts de ligne après les phrases
        $text = preg_replace('/([.!?])\s+(?=[A-ZÉÀÇÔÎ])/', "$1\n", $text);
        
        return trim($text);
    }

    private function extractWithGroq(string $text, string $hint): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.groq.key'),
            'Content-Type'  => 'application/json',
        ])->timeout(180)->post('https://api.groq.com/openai/v1/chat/completions', [
            'model'       => 'llama-3.3-70b-versatile',
            'temperature' => 0.1,
            'max_tokens'  => 8192,
            'messages'    => [
                [
                    'role'    => 'system',
                    'content' => $this->buildSystemPrompt(),
                ],
                [
                    'role'    => 'user',
                    'content' => $this->buildUserPrompt($text, $hint),
                ],
            ],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Groq error: ' . $response->status() . ' — ' . $response->body());
        }

        return $this->parseJson($response->json('choices.0.message.content', ''));
    }

    private function extractWithOllama(string $text, string $hint): array
    {
        $url   = config('services.ollama.url', 'http://localhost:11434');
        $model = config('services.ollama.model', 'llama3.2');

        Http::timeout(3)->get("{$url}/api/tags");

        $response = Http::timeout(180)->post("{$url}/api/generate", [
            'model'  => $model,
            'prompt' => $this->buildSystemPrompt() . "\n\n" . $this->buildUserPrompt($text, $hint),
            'stream' => false,
            'options' => ['temperature' => 0.1, 'num_predict' => 6000],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Ollama error: ' . $response->status());
        }

        return $this->parseJson($response->json('response', ''));
    }

    private function buildSystemPrompt(): string
    {
        return <<<'SYSTEM'
You are a senior GRC expert specialized in ISO 27001:2022 compliance requirements extraction.

## YOUR TASK
Extract EVERY compliance requirement from the ISO 27001:2022 document. A requirement is any statement containing "shall", "must", "doit", "doivent", "est tenu de", or an obligation.

## CRITICAL OUTPUT RULES
- Return ONLY a valid JSON array
- NO markdown, NO backticks, NO explanations before or after the JSON
- Start directly with [ and end with ]
- Extract 50-70 requirements for a full ISO 27001 document

## CODE FORMAT (CRITICAL - use these exact codes)
For Clauses 4-10:
- Clause 4.1 → "ISO-4.1" (Understand organization context)
- Clause 4.2 → "ISO-4.2" (Understand stakeholder needs)
- Clause 4.3 → "ISO-4.3" (Define ISMS scope)
- Clause 4.4 → "ISO-4.4" (ISMS establishment)
- Clause 5.1 → "ISO-5.1" (Leadership and commitment)
- Clause 5.2 → "ISO-5.2" (Policy)
- Clause 5.3 → "ISO-5.3" (Roles and responsibilities)
- Clause 6.1.1 → "ISO-6.1.1" (Risk management general)
- Clause 6.1.2 → "ISO-6.1.2" (Risk assessment)
- Clause 6.1.3 → "ISO-6.1.3" (Risk treatment)
- Clause 6.2 → "ISO-6.2" (Objectives)
- Clause 6.3 → "ISO-6.3" (Change planning)
- Clause 7.1 → "ISO-7.1" (Resources)
- Clause 7.2 → "ISO-7.2" (Competence)
- Clause 7.3 → "ISO-7.3" (Awareness)
- Clause 7.4 → "ISO-7.4" (Communication)
- Clause 7.5 → "ISO-7.5" (Documented information)
- Clause 8.1 → "ISO-8.1" (Operational planning)
- Clause 8.2 → "ISO-8.2" (Risk assessment execution)
- Clause 8.3 → "ISO-8.3" (Risk treatment execution)
- Clause 9.1 → "ISO-9.1" (Monitoring and measurement)
- Clause 9.2 → "ISO-9.2" (Internal audit)
- Clause 9.3 → "ISO-9.3" (Management review)
- Clause 10.1 → "ISO-10.1" (Continual improvement)
- Clause 10.2 → "ISO-10.2" (Nonconformity and corrective action)

For Annex A controls (use these codes):
- Section 5 (Organizational): ISO-A.5.1 to ISO-A.5.37
- Section 6 (People): ISO-A.6.1 to ISO-A.6.8
- Section 7 (Physical): ISO-A.7.1 to ISO-A.7.14
- Section 8 (Technological): ISO-A.8.1 to ISO-A.8.34

## TITLE FORMAT
Extract the core obligation in under 100 characters, action-oriented:
- GOOD: "Define and implement information security policies"
- GOOD: "Establish risk assessment criteria"
- BAD: "Regulatory requirement"
- BAD: "ISO requirement clause 5.2"

## DESCRIPTION FORMAT
Provide the complete requirement text explaining what must be done, why, and any specific conditions.

## TYPE MAPPING
- "regulatory" → Clause 4,5,6,9,10 (management system requirements)
- "operational" → Clause 7,8 (support and operation), Annex A sections 5,6,7
- "technical" → Annex A section 8 (technological controls)

## PRIORITY MAPPING
- "critical" → Clauses 4,5,6,9,10 (core ISMS clauses)
- "high" → Clauses 7,8 (support and operation), Annex A controls
- "medium" → Recommended controls
- "low" → Optional/advisory notes

## FREQUENCY MAPPING
- "continuous" → Clause 9.1 (monitoring), Clause 10.1 (continual improvement)
- "yearly" → Clause 9.2 (internal audit), Clause 9.3 (management review)
- "quarterly" → Risk assessment reviews
- "monthly" → Access reviews, monitoring activities
- "one_time" → Initial ISMS establishment, Statement of Applicability

## OUTPUT EXAMPLE
[
  {
    "code": "ISO-4.1",
    "title": "Understand organization and its context",
    "description": "The organization must determine external and internal issues relevant to its purpose and strategic direction that affect the ability to achieve intended outcome(s) of the information security management system.",
    "type": "regulatory",
    "priority": "critical",
    "frequency": "yearly",
    "compliance_level": "mandatory",
    "source_text": "L'organisation doit déterminer les enjeux externes et internes pertinents compte tenu de sa mission et qui ont une incidence sur sa capacité à obtenir le(s) résultat(s) attendu(s) de son système de management de la sécurité de l'information."
  },
  {
    "code": "ISO-A.5.1",
    "title": "Establish information security policies",
    "description": "Information security policy and topic-specific policies must be defined, approved by management, published, communicated, and acknowledged by relevant personnel and interested parties, and reviewed at planned intervals or when significant changes occur.",
    "type": "operational",
    "priority": "high",
    "frequency": "yearly",
    "compliance_level": "mandatory",
    "source_text": "Une politique de sécurité de l'information et des politiques spécifiques à une thématique doivent être définies, approuvées par la direction, publiées, communiquées et demandée en confirmation au personnel et aux parties intéressées concernés, ainsi que révisées à intervalles planifiés et si des changements significatifs ont lieu."
  }
]

## REMINDER
Return ONLY the JSON array. No other text.
SYSTEM;
    }

    private function buildUserPrompt(string $text, string $hint): string
    {
        $hintLine = $hint ? "Document type / Framework: {$hint}\n\n" : '';
        
        return $hintLine . "Extract ALL compliance requirements from this ISO 27001:2022 document.\n\n" . $text;
    }

    private function parseJson(string $content): array
    {
        // Nettoyer les backticks
        $content = preg_replace('/^```json\s*/i', '', trim($content));
        $content = preg_replace('/^```\s*/', '', $content);
        $content = preg_replace('/\s*```$/m', '', $content);
        $content = trim($content);

        // Extraire le tableau JSON
        if (!str_starts_with($content, '[')) {
            if (preg_match('/\[[\s\S]*\]/s', $content, $matches)) {
                $content = $matches[0];
            }
        }

        // Tenter le décodage direct
        $data = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            return $this->validateAndClean($data);
        }

        // Réparer les problèmes JSON courants
        $content = preg_replace('/,\s*]/', ']', $content);
        $content = preg_replace('/,\s*}/', '}', $content);
        $content = preg_replace('/([{,])\s*([a-zA-Z0-9_]+)\s*:/', '$1"$2":', $content);
        
        $data = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            return $this->validateAndClean($data);
        }

        Log::error('RequirementExtractor: JSON parse failed', [
            'error' => json_last_error_msg(),
            'preview' => mb_substr($content, 0, 500),
        ]);

        throw new \RuntimeException('Invalid JSON from AI: ' . json_last_error_msg());
    }

    private function validateAndClean(array $data): array
    {
        $validTypes = ['regulatory', 'technical', 'operational', 'contractual', 'internal'];
        $validPriorities = ['critical', 'high', 'medium', 'low'];
        $validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one_time', 'continuous'];
        $validLevels = ['mandatory', 'recommended', 'optional'];

        $cleaned = [];
        foreach ($data as $item) {
            if (!is_array($item)) continue;

            if (empty($item['code']) || empty($item['title'])) continue;

            // Améliorer les codes ISO manquants
            $code = strtoupper(trim($item['code'] ?? ''));
            if (str_starts_with($code, 'REQ-') && str_contains($item['description'] ?? '', 'ISO')) {
                // Tentative d'extraction du code ISO depuis la description
                if (preg_match('/[Cc]lause (\d+(?:\.\d+)?)/', $item['description'], $matches)) {
                    $code = 'ISO-' . $matches[1];
                } elseif (preg_match('/Annex A\.(\d+\.\d+)/', $item['description'], $matches)) {
                    $code = 'ISO-A.' . $matches[1];
                }
            }

            $cleaned[] = [
                'code' => substr($code, 0, 50),
                'title' => substr(trim($item['title'] ?? ''), 0, 100),
                'description' => trim($item['description'] ?? $item['title'] ?? ''),
                'type' => in_array($item['type'] ?? '', $validTypes) ? $item['type'] : 'regulatory',
                'priority' => in_array($item['priority'] ?? '', $validPriorities) ? $item['priority'] : 'high',
                'frequency' => in_array($item['frequency'] ?? '', $validFrequencies) ? $item['frequency'] : 'yearly',
                'compliance_level' => in_array($item['compliance_level'] ?? '', $validLevels) ? $item['compliance_level'] : 'mandatory',
                'source_text' => substr(trim($item['source_text'] ?? $item['description'] ?? ''), 0, 500),
            ];
        }

        if (empty($cleaned)) {
            throw new \RuntimeException('AI returned 0 valid requirements after validation');
        }

        return $cleaned;
    }

    private function extractLocally(string $text, string $frameworkHint): array
    {
        $requirements = [];
        $counter = 1;
        
        // Extraire les sections ISO spécifiques
        $clausePatterns = [
            '/(?:Clause|clause) (\d+(?:\.\d+(?:\.\d+)?)?)[:\s]+\"([^\"]+)\"/i',
            '/(\d+(?:\.\d+(?:\.\d+)?)?)\s+(\w+)\s+(?:shall|must|doit)/i',
            '/La direction doit faire preuve de leadership.*?(?=\.\.\.|\.\s+(?:L|D|E))/s',
            '/L\'organisation doit (?:déterminer|établir|mettre en œuvre|tenir à jour|améliorer).*?(?=\.)/i',
        ];

        $found = [];
        foreach ($clausePatterns as $pattern) {
            preg_match_all($pattern, $text, $matches);
            foreach ($matches[0] as $match) {
                $match = trim($match);
                if (strlen($match) < 30 || in_array($match, $found)) continue;
                $found[] = $match;

                $requirements[] = [
                    'code' => 'ISO-' . ($matches[1][0] ?? $counter),
                    'title' => $this->extractTitle($match),
                    'description' => $match,
                    'type' => $this->inferType($match),
                    'priority' => $this->inferPriority($match),
                    'frequency' => $this->inferFrequency($match),
                    'compliance_level' => 'mandatory',
                    'source_text' => $match,
                ];
                $counter++;
            }
        }

        return $requirements;
    }

    private function extractTitle(string $text): string
    {
        // Extraire l'action principale
        $patterns = [
            '/(?:doit|shall|must)\s+([^.!]+)/i',
            '/(?:déterminer|établir|mettre en œuvre|définir|identifier|évaluer|traiter|surveiller|améliorer)([^.!]+)/i',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $title = ucfirst(trim($matches[1]));
                if (strlen($title) > 10 && strlen($title) < 100) {
                    return $title;
                }
            }
        }
        
        return substr($text, 0, 80);
    }

    private function inferType(string $text): string
    {
        $textLower = strtolower($text);
        
        if (str_contains($textLower, 'annex a') || str_contains($textLower, 'mesure de sécurité')) {
            if (preg_match('/(firewall|encryption|password|access|network|backup|crypto)/i', $textLower)) {
                return 'technical';
            }
            return 'operational';
        }
        
        if (preg_match('/(leadership|policy|management review|internal audit|continual improvement)/i', $textLower)) {
            return 'regulatory';
        }
        
        if (preg_match('/(training|awareness|competence|discipline)/i', $textLower)) {
            return 'operational';
        }
        
        return 'regulatory';
    }

    private function inferPriority(string $text): string
    {
        $textLower = strtolower($text);
        
        if (preg_match('/(leadership|policy|clause 4|clause 5|clause 6|clause 9|clause 10)/i', $textLower)) {
            return 'critical';
        }
        
        if (preg_match('/(clause 7|clause 8|annex a|shall|must|doit|obligatoire)/i', $textLower)) {
            return 'high';
        }
        
        if (str_contains($textLower, 'recommended')) {
            return 'medium';
        }
        
        return 'high';
    }

    private function inferFrequency(string $text): string
    {
        $textLower = strtolower($text);
        
        if (preg_match('/(continual improvement|continuously|surveillance|monitoring)/i', $textLower)) {
            return 'continuous';
        }
        if (preg_match('/(internal audit|management review|reviewed|revisées|annuel)/i', $textLower)) {
            return 'yearly';
        }
        if (preg_match('/(quarterly|trimestriel)/i', $textLower)) {
            return 'quarterly';
        }
        if (preg_match('/(monthly|mensuel)/i', $textLower)) {
            return 'monthly';
        }
        if (preg_match('/(establish|initial|setup|établir|initial)/i', $textLower)) {
            return 'one_time';
        }
        
        return 'yearly';
    }
}