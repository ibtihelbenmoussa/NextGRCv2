<?php

namespace App\Http\Controllers;

use App\Services\TextExtractorService;
use App\Services\RequirementExtractorService;
use App\Models\Requirement;
use App\Models\Framework;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DocumentAnalysisController extends Controller
{
    public function __construct(
        private TextExtractorService        $textExtractor,
        private RequirementExtractorService $requirementExtractor,
    ) {}

    // ── POST /ai/analyze-document ─────────────────────────────────────────────
    public function analyze(Request $request)
    {
        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['error' => 'No organization selected'], 403);
        }

        $request->validate([
            'file'           => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,xls,xlsx,txt'],
            'framework_hint' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            // 1. Extraire le texte
            $text = $this->textExtractor->extract($request->file('file'));

            if (strlen($text) < 50) {
                return response()->json([
                    'error' => 'Could not extract text from document. The file may be empty or corrupted.'
                ], 422);
            }

            // 2. Appeler l'IA
            $requirements = $this->requirementExtractor->extract(
                $text,
                $request->input('framework_hint', '')
            );

            // 3. Frameworks et tags pour l'UI
            $frameworks = Framework::where('organization_id', $currentOrgId)
                ->where('is_deleted', 0)
                ->select('id', 'code', 'name')
                ->orderBy('name')
                ->get();

            $tags = Tag::where('organization_id', $currentOrgId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success'        => true,
                'requirements'   => $requirements,
                'frameworks'     => $frameworks,
                'tags'           => $tags,
                'total'          => count($requirements),
                'chars_analyzed' => strlen($text),
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            Log::error('AI Extraction failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected error during extraction', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }

    // ── POST /ai/import-requirements ──────────────────────────────────────────
    public function import(Request $request)
    {
        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['error' => 'No organization selected'], 403);
        }

        $request->validate([
            'requirements'                    => ['required', 'array', 'min:1'],
            'requirements.*.code'             => ['required', 'string', 'max:100'],
            'requirements.*.title'            => ['required', 'string', 'max:255'],
            'requirements.*.description'      => ['nullable', 'string'],
            'requirements.*.type'             => ['required', 'string'],
            'requirements.*.priority'         => ['required', 'string'],
            'requirements.*.frequency'        => ['required', 'string'],
            'requirements.*.compliance_level' => ['nullable', 'string'],
            'framework_id'                    => ['nullable', 'exists:frameworks,id'],
            'tag_ids'                         => ['nullable', 'array'],
            'tag_ids.*'                       => ['integer', 'exists:tags,id'],
        ]);

        // ── Maps de normalisation ─────────────────────────────────────────────

        // type AI → type BDD (regulatory | internal | contractual)
        $typeMap = [
            'regulatory'  => 'regulatory',
            'technical'   => 'internal',
            'operational' => 'internal',
            'contractual' => 'contractual',
            'internal'    => 'internal',
        ];

        // priority AI → priority BDD (low | medium | high)
        $priorityMap = [
            'critical' => 'high',
            'high'     => 'high',
            'medium'   => 'medium',
            'low'      => 'low',
        ];

        // frequency AI → frequency BDD exacte
        $frequencyMap = [
            'daily'      => 'daily',
            'weekly'     => 'weekly',
            'monthly'    => 'monthly',
            'quarterly'  => 'quarterly',
            'yearly'     => 'yearly',
            'one_time'   => 'one_time',
            'continuous' => 'continuous',
        ];

        // compliance_level AI → BDD (Mandatory | Recommended | Optional)
        $complianceMap = [
            'mandatory'   => 'Mandatory',
            'recommended' => 'Recommended',
            'optional'    => 'Optional',
        ];

        $created = 0;
        $skipped = 0;
        $errors  = [];

        DB::transaction(function () use (
            $request, $currentOrgId, $user,
            $typeMap, $priorityMap, $frequencyMap, $complianceMap,
            &$created, &$skipped, &$errors
        ) {
            foreach ($request->requirements as $reqData) {

                // Dédoublonnage par code dans la même organisation
                $exists = Requirement::where('organization_id', $currentOrgId)
                    ->where('code', $reqData['code'])
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                try {
                    // Normaliser chaque valeur
                    $type      = $typeMap[strtolower($reqData['type'] ?? '')]             ?? 'internal';
                    $priority  = $priorityMap[strtolower($reqData['priority'] ?? '')]     ?? 'medium';
                    $frequency = $frequencyMap[strtolower($reqData['frequency'] ?? '')]   ?? 'yearly';
                    $compliance = $complianceMap[strtolower($reqData['compliance_level'] ?? '')] ?? 'Mandatory';

                    $requirement = Requirement::create([
                        'organization_id'  => $currentOrgId,
                        'framework_id'     => $request->framework_id ?? null,
                        'code'             => $reqData['code'],
                        'title'            => $reqData['title'],
                        'description'      => $reqData['description'] ?? null,
                        'type'             => $type,
                        'status'           => 'draft',                   // draft par défaut
                        'priority'         => $priority,
                        'frequency'        => $frequency,
                        'compliance_level' => $compliance,
                        'effective_date'   => now()->toDateString(),     // date du jour
                        'is_deleted'       => 0,
                        'owner_id'         => $user->id,
                        'auto_validate'    => false,
                    ]);

                    // Attacher les tags sélectionnés par l'utilisateur
                    if ($request->filled('tag_ids')) {
                        $requirement->tags()->sync($request->tag_ids);
                    }

                    $created++;

                } catch (\Exception $e) {
                    $errors[] = [
                        'code'  => $reqData['code'],
                        'error' => $e->getMessage(),
                    ];
                    Log::error('Failed to import requirement', [
                        'code'  => $reqData['code'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'created' => $created,
            'skipped' => $skipped,
            'errors'  => $errors,
            'message' => "{$created} requirement(s) imported successfully, {$skipped} skipped.",
        ]);
    }
}