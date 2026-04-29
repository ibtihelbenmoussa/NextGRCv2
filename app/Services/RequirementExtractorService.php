<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RequirementExtractorService
{
    private const CHUNK_DELAY      = 12;
    private const INTER_PASS_DELAY = 30;
    private const MAX_WAIT_SECONDS = 60;

    private const MODEL_CHAIN = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it',
        'mixtral-8x7b-32768',
    ];

    public function extract(string $documentText, string $frameworkHint = ''): array
    {
        set_time_limit(0);

        $hasAnnexA = str_contains($documentText, 'Annexe A')
            || str_contains($documentText, 'Annex A')
            || (str_contains($documentText, '5.1') && str_contains($documentText, 'Mesure de sécurité'));

        Log::info('RequirementExtractor: start', [
            'chars'     => strlen($documentText),
            'hasAnnexA' => $hasAnnexA,
        ]);

        if ($hasAnnexA) {
            return $this->extractInTwoPasses($documentText, $frameworkHint);
        }

        return $this->extractSinglePass($documentText, $frameworkHint);
    }

    // ── 2 passes ──────────────────────────────────────────────────────────────

    private function extractInTwoPasses(string $text, string $hint): array
    {
        $annexePos = null;
        $markers   = ['Annexe A', 'Annex A', 'ANNEXE A', 'Tableau A.1', '5.1 Politiques de sécurité', 'A.5.1'];

        foreach ($markers as $marker) {
            $pos = mb_strpos($text, $marker);
            if ($pos !== false) {
                $annexePos = $pos;
                Log::info('Annexe A marker found', ['marker' => $marker, 'pos' => $pos]);
                break;
            }
        }

        if ($annexePos === null || $annexePos < 500) {
            Log::warning('No Annexe A split found, using single pass');
            return $this->extractSinglePass($text, $hint);
        }

        $mainClauses = mb_substr($text, 0, $annexePos);
        $annexeA     = mb_substr($text, $annexePos);

        Log::info('Split done', ['main_chars' => strlen($mainClauses), 'annexe_chars' => strlen($annexeA)]);

        $results = [];

        // Passe 1 : clauses 4-10
        $mainChunks = $this->chunkText($mainClauses, 8000);
        Log::info('Main chunks', ['count' => count($mainChunks)]);

        foreach ($mainChunks as $i => $chunk) {
            try {
                $pass    = $this->callWithModelRotation($chunk, $hint, 'clauses');
                $results = array_merge($results, $pass);
                Log::info("Main chunk {$i} OK", ['count' => count($pass)]);
            } catch (\Throwable $e) {
                Log::error("Main chunk {$i} failed", ['error' => $e->getMessage()]);
            }

            if ($i < count($mainChunks) - 1) {
                $this->throttledSleep(self::CHUNK_DELAY);
            }
        }

        Log::info('Inter-pass delay before Annexe A', ['seconds' => self::INTER_PASS_DELAY]);
        $this->throttledSleep(self::INTER_PASS_DELAY);

        // Passe 2 : Annexe A
        $annexeChunks = $this->chunkText($annexeA, 12000);
        Log::info('Annexe chunks', ['count' => count($annexeChunks)]);

        foreach ($annexeChunks as $i => $chunk) {
            try {
                $pass    = $this->callWithModelRotation($chunk, $hint, 'annex');
                $results = array_merge($results, $pass);
                Log::info("Annex chunk {$i} OK", ['count' => count($pass)]);
            } catch (\Throwable $e) {
                Log::error("Annex chunk {$i} failed", ['error' => $e->getMessage()]);
            }

            if ($i < count($annexeChunks) - 1) {
                $this->throttledSleep(self::CHUNK_DELAY);
            }
        }

        $final = $this->deduplicateByCode($results);
        Log::info('Two-pass complete', ['total' => count($final)]);

        return $final;
    }

    // ── Model rotation ────────────────────────────────────────────────────────

    private function callWithModelRotation(string $text, string $hint, string $mode): array
    {
        $systemPrompt  = match ($mode) {
            'clauses' => $this->buildClausesPrompt(),
            'annex'   => $this->buildAnnexPrompt(),
            default   => $this->buildSystemPrompt(),
        };

        $truncatedText = mb_substr($text, 0, 6000);
        $lastError     = null;

        foreach (self::MODEL_CHAIN as $modelIndex => $model) {
            Log::info("Trying model [{$modelIndex}]: {$model}", ['mode' => $mode]);

            try {
                $result = $this->callGroqModel($model, $truncatedText, $hint, $systemPrompt);
                Log::info("Model {$model} succeeded");
                return $result;

            } catch (RateLimitLongWaitException $e) {
                Log::warning("Model {$model} rate-limited with long wait ({$e->getWaitSeconds()}s), switching model");
                $lastError = $e;
                continue;

            } catch (RateLimitShortWaitException $e) {
                Log::warning("Model {$model} rate-limited, waiting {$e->getWaitSeconds()}s then retrying");
                $this->throttledSleep($e->getWaitSeconds());

                try {
                    $result = $this->callGroqModel($model, $truncatedText, $hint, $systemPrompt);
                    Log::info("Model {$model} succeeded after wait");
                    return $result;
                } catch (\Throwable $retryError) {
                    Log::warning("Model {$model} failed after wait, switching model", ['error' => $retryError->getMessage()]);
                    $lastError = $retryError;
                    continue;
                }

            } catch (\Throwable $e) {
                Log::warning("Model {$model} failed", ['error' => $e->getMessage()]);
                $lastError = $e;
                continue;
            }
        }

        Log::error('All Groq models exhausted, falling back to Ollama/regex');
        throw new \RuntimeException('All models exhausted: ' . ($lastError?->getMessage() ?? 'unknown'));
    }

    // ── Groq HTTP call ────────────────────────────────────────────────────────

    private function callGroqModel(string $model, string $text, string $hint, string $systemPrompt): array
    {
        $maxTokens = str_contains($model, '8b') ? 2000 : 6000;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.groq.key'),
            'Content-Type'  => 'application/json',
        ])->timeout(120)->post('https://api.groq.com/openai/v1/chat/completions', [
            'model'       => $model,
            'temperature' => 0.1,
            'max_tokens'  => $maxTokens,
            'messages'    => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user',   'content' => ($hint ? "Framework: {$hint}\n\n" : '') . $text],
            ],
        ]);

        if ($response->successful()) {
            return $this->parseAndValidate($response->json('choices.0.message.content', ''));
        }

        if ($response->status() === 429) {
            $wait = $this->parseRetryAfter($response);
            throw $wait > self::MAX_WAIT_SECONDS
                ? new RateLimitLongWaitException($wait)
                : new RateLimitShortWaitException($wait);
        }

        if ($response->status() === 413) {
            throw new \RuntimeException('Payload too large (413)');
        }

        throw new \RuntimeException("Groq error {$response->status()}: " . $response->body());
    }

    // ── Retry-After parser ────────────────────────────────────────────────────

    private function parseRetryAfter(\Illuminate\Http\Client\Response $response): int
    {
        $header = $response->header('Retry-After');
        if ($header && is_numeric($header)) {
            return (int) ceil((float) $header) + 2;
        }

        $retryAfter = $response->json('error.retry_after');
        if ($retryAfter && is_numeric($retryAfter)) {
            return (int) ceil((float) $retryAfter) + 2;
        }

        $message = $response->json('error.message', '');
        if (preg_match('/try again in\s+([\d.]+)s/i', $message, $matches)) {
            return (int) ceil((float) $matches[1]) + 2;
        }

        return 35;
    }

    // ── Throttle ──────────────────────────────────────────────────────────────

    private function throttledSleep(int $seconds): void
    {
        Log::info("Rate-limit throttle: sleeping {$seconds}s");
        sleep($seconds);
    }

    // ── Single pass ───────────────────────────────────────────────────────────

    private function extractSinglePass(string $text, string $hint): array
    {
        try {
            $result = $this->callWithModelRotation(mb_substr($text, 0, 60000), $hint, 'general');
            Log::info('Single pass (Groq) OK', ['count' => count($result)]);
            return $result;
        } catch (\Throwable $e) {
            Log::warning('All Groq models failed, trying Ollama', ['error' => $e->getMessage()]);
        }

        try {
            $result = $this->callOllama(mb_substr($text, 0, 40000), $hint);
            Log::info('Single pass (Ollama) OK', ['count' => count($result)]);
            return $result;
        } catch (\Throwable $e) {
            Log::warning('Ollama failed, using regex', ['error' => $e->getMessage()]);
        }

        return $this->extractLocally($text, $hint);
    }

    // ── Chunk text ────────────────────────────────────────────────────────────

    private function chunkText(string $text, int $chunkSize): array
    {
        $chunks = [];
        $len    = mb_strlen($text);

        for ($offset = 0; $offset < $len; $offset += $chunkSize) {
            $chunk = mb_substr($text, $offset, $chunkSize);

            if ($offset + $chunkSize < $len) {
                $lastPeriod = mb_strrpos($chunk, '.');
                if ($lastPeriod !== false && $lastPeriod > (int) ($chunkSize * 0.7)) {
                    $chunk   = mb_substr($chunk, 0, $lastPeriod + 1);
                    $offset -= ($chunkSize - mb_strlen($chunk));
                }
            }

            if (trim($chunk) !== '') {
                $chunks[] = $chunk;
            }
        }

        return $chunks;
    }

    // ── Ollama fallback ───────────────────────────────────────────────────────

    private function callOllama(string $text, string $hint): array
    {
        $url   = config('services.ollama.url',   'http://localhost:11434');
        $model = config('services.ollama.model', 'llama3.2');

        try {
            Http::timeout(3)->get("{$url}/api/tags");
        } catch (\Throwable $e) {
            throw new \RuntimeException('Ollama not reachable: ' . $e->getMessage());
        }

        $response = Http::timeout(180)->post("{$url}/api/generate", [
            'model'   => $model,
            'prompt'  => $this->buildSystemPrompt() . "\n\n" . $text,
            'stream'  => false,
            'options' => ['temperature' => 0.1, 'num_predict' => 6000],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Ollama error: ' . $response->status());
        }

        return $this->parseAndValidate($response->json('response', ''));
    }

    // ── Prompts ───────────────────────────────────────────────────────────────

   private function buildClausesPrompt(): string
{
    return <<<SYSTEM
You are a GRC expert analyzing ISO 27001:2022 clauses 4-10.

Extract ALL mandatory requirements from this section.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array, starting with [ and ending with ]
- No markdown, no backticks, no text before or after

Each object MUST use EXACTLY these allowed values:

{
  "code": "ISO-4.1",
  "title": "max 100 chars",
  "description": "full requirement text",
  "type": "regulatory",
  "priority": "high",
  "frequency": "yearly",
  "compliance_level": "mandatory",
  "source_text": "verbatim sentence from document"
}

ALLOWED VALUES ONLY:
- type: "regulatory" | "internal" | "contractual"
- priority: "high" | "medium" | "low"
- frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "one_time" | "continuous"
- compliance_level: "mandatory" | "recommended" | "optional"
SYSTEM;
}

private function buildAnnexPrompt(): string
{
    return <<<SYSTEM
You are a GRC expert analyzing ISO 27001:2022 Annex A security controls.

Extract ALL 93 security controls from sections 5, 6, 7, and 8.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array, starting with [ and ending with ]
- No markdown, no backticks, no text before or after

Code format examples: ISO-A.5.1, ISO-A.6.3, ISO-A.7.4, ISO-A.8.12

Each object MUST use EXACTLY these allowed values:

{
  "code": "ISO-A.5.1",
  "title": "control name max 100 chars",
  "description": "full control description from document",
  "type": "regulatory",
  "priority": "high",
  "frequency": "yearly",
  "compliance_level": "mandatory",
  "source_text": "verbatim text, min 20 chars"
}

ALLOWED VALUES ONLY:
- type: "regulatory" | "internal" | "contractual"
- priority: "high" | "medium" | "low"  
- frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "one_time" | "continuous"
- compliance_level: "mandatory" | "recommended" | "optional"

Section 5 (organisational) → type: "regulatory"
Section 6 (people) → type: "internal"
Section 7 (physical) → type: "internal"
Section 8 (technological) → type: "regulatory"
SYSTEM;
}

private function buildSystemPrompt(): string
{
    return <<<SYSTEM
You are a GRC expert. Extract ALL compliance obligations from the document.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array, starting with [ and ending with ]
- No markdown, no backticks, no text before or after

ALLOWED VALUES ONLY (no other values accepted):
- type: "regulatory" | "internal" | "contractual"
- priority: "high" | "medium" | "low"
- frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "one_time" | "continuous"
- compliance_level: "mandatory" | "recommended" | "optional"

Each object:
{
  "code": "unique code e.g. REQ-001",
  "title": "concise title under 100 chars",
  "description": "full obligation description",
  "type": "regulatory",
  "priority": "medium",
  "frequency": "yearly",
  "compliance_level": "mandatory",
  "source_text": "exact sentence from document"
}
SYSTEM;
}

    // ── JSON parser ───────────────────────────────────────────────────────────

    private function parseAndValidate(string $content): array
    {
        // Strip markdown fences
        $content = preg_replace('/^```json\s*/i', '', trim($content));
        $content = preg_replace('/\s*```$/m', '', $content);

        // Remove control characters that break JSON parsing
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $content);
        $content = trim($content);

        // Extract JSON array if wrapped in text
        if (!str_starts_with($content, '[')) {
            if (preg_match('/\[[\s\S]*\]/s', $content, $matches)) {
                $content = $matches[0];
            }
        }

        // Fix trailing commas
        $content = preg_replace('/,(\s*[}\]])/m', '$1', $content);

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            Log::error('JSON parse failed', [
                'error'   => json_last_error_msg(),
                'preview' => mb_substr($content, 0, 300),
            ]);
            throw new \RuntimeException('JSON invalide: ' . json_last_error_msg());
        }

        $validTypes  = ['regulatory', 'technical', 'operational', 'contractual', 'internal'];
        $validPrios  = ['critical', 'high', 'medium', 'low'];
        $validFreqs  = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one_time', 'continuous'];
        $validLevels = ['mandatory', 'recommended', 'optional'];

        $cleaned = [];
        foreach ($data as $item) {
            if (!is_array($item) || empty($item['code']) || empty($item['title'])) {
                continue;
            }

            $cleaned[] = [
                'code'             => strtoupper(substr(trim($item['code']), 0, 50)),
                'title'            => substr(trim($item['title']), 0, 100),
                'description'      => trim($item['description'] ?? $item['title']),
                'type'             => in_array($item['type'] ?? '', $validTypes) ? $item['type'] : 'regulatory',
                'priority'         => in_array($item['priority'] ?? '', $validPrios) ? $item['priority'] : 'medium',
                'frequency'        => in_array($item['frequency'] ?? '', $validFreqs) ? $item['frequency'] : 'yearly',
                'compliance_level' => in_array($item['compliance_level'] ?? '', $validLevels) ? $item['compliance_level'] : 'mandatory',
                'source_text'      => substr(trim($item['source_text'] ?? ''), 0, 500),
            ];
        }

        if (empty($cleaned)) {
            throw new \RuntimeException('0 requirements valides après validation');
        }

        return $cleaned;
    }

    // ── Deduplicate ───────────────────────────────────────────────────────────

    private function deduplicateByCode(array $items): array
    {
        $seen   = [];
        $result = [];

        foreach ($items as $item) {
            $key = strtoupper($item['code'] ?? '');
            if ($key && !isset($seen[$key])) {
                $seen[$key] = true;
                $result[]   = $item;
            }
        }

        return $result;
    }

    // ── Local regex fallback ──────────────────────────────────────────────────

    private function extractLocally(string $text, string $frameworkHint): array
    {
        $requirements = [];
        $counter      = 1;
        $prefix       = $frameworkHint
            ? strtoupper(preg_replace('/[^A-Z0-9]/i', '', explode(' ', $frameworkHint)[0]))
            : 'REQ';

        $patterns = [
            '/(?:shall|must|is required to)[^\.\n]{20,200}/i',
            '/(?:doit|doivent|est tenu de)[^\.\n]{20,200}/i',
        ];

        $seen = [];
        foreach ($patterns as $pattern) {
            preg_match_all($pattern, $text, $matches);
            foreach ($matches[0] as $match) {
                $match = trim($match);
                $key   = substr($match, 0, 40);
                if (isset($seen[$key]) || strlen($match) < 20) {
                    continue;
                }
                $seen[$key] = true;

                $requirements[] = [
                    'code'             => sprintf('%s-%03d', $prefix, $counter++),
                    'title'            => ucfirst(implode(' ', array_slice(explode(' ', $match), 0, 8))),
                    'description'      => $match,
                    'type'             => 'regulatory',
                    'priority'         => 'medium',
                    'frequency'        => 'yearly',
                    'compliance_level' => 'mandatory',
                    'source_text'      => $match,
                    '_source'          => 'local_regex',
                ];

                if ($counter > 50) break 2;
            }
        }

        return $requirements ?: [[
            'code'             => $prefix . '-001',
            'title'            => 'General compliance requirement',
            'description'      => 'Please review document manually.',
            'type'             => 'regulatory',
            'priority'         => 'medium',
            'frequency'        => 'yearly',
            'compliance_level' => 'mandatory',
            'source_text'      => '',
            '_source'          => 'local_regex',
        ]];
    }
}

// ── Rate limit exceptions ──────────────────────────────────────────────────────

class RateLimitLongWaitException extends \RuntimeException
{
    public function __construct(private int $waitSeconds)
    {
        parent::__construct("Rate limit with long wait: {$waitSeconds}s");
    }

    public function getWaitSeconds(): int { return $this->waitSeconds; }
}

class RateLimitShortWaitException extends \RuntimeException
{
    public function __construct(private int $waitSeconds)
    {
        parent::__construct("Rate limit with short wait: {$waitSeconds}s");
    }

    public function getWaitSeconds(): int { return $this->waitSeconds; }
}