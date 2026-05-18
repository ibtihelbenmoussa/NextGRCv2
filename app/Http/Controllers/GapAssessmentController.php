<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Requirement;
use App\Models\GapAssessment;
use App\Models\Framework;
use App\Services\GapAssessmentService;
use Illuminate\Support\Facades\Auth;
use App\Models\GapQuestion;
use Illuminate\Support\Facades\Http;
use App\Models\GapAssessmentAnswer;
use App\Services\MLMaturityService;
use App\Exports\GapAssessmentExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;



class GapAssessmentController extends Controller
{
    public function __construct(protected GapAssessmentService $service)
    {
    }

    // ─── Page principale ──────────────────────────────────────────────────────
    public function index()
    {
        $user = Auth::user();
        $orgId = $user->current_organization_id;

        $assessments = GapAssessment::where('organization_id', $orgId)
            ->whereNotNull('code')
            ->with('framework:id,code,name')
            ->withCount('assessmentRequirements')
            ->withCount([
                'answers as answers_count' => function ($q) {
                    $q->select(DB::raw('COUNT(DISTINCT gap_question_id)'));
                },
            ])->withCount([
                    'answers as answers_count' => function ($q) {
                        $q->select(\DB::raw('COUNT(DISTINCT gap_question_id)'));
                    },
                ])
            ->latest()
            ->get()
            ->map(function ($a) {
                $requirementsWithQuestions = $a->assessmentRequirements()
                    ->with(['requirement' => fn($q) => $q->withCount('gapQuestions')])
                    ->get();

                $questionsCount = $requirementsWithQuestions->sum(
                    fn($ar) => $ar->requirement?->gap_questions_count ?? 0
                );

                return [
                    'id' => $a->id,
                    'code' => $a->code,
                    'name' => $a->name,
                    'description' => $a->description,
                    'start_date' => $a->start_date?->format('Y-m-d'),
                    'end_date' => $a->end_date?->format('Y-m-d'),
                    'framework' => $a->framework ? [
                        'id' => $a->framework->id,
                        'code' => $a->framework->code,
                        'name' => $a->framework->name,
                    ] : null,
                    'requirements_count' => $a->assessment_requirements_count,
                    'answers_count' => (int) \DB::table('gap_assessment_answers')
                        ->where('gap_assessment_id', $a->id)
                        ->whereIn('gap_question_id', $requirementsWithQuestions->flatMap(
                            fn($ar) => $ar->requirement?->gapQuestions?->pluck('id') ?? collect()
                        )->toArray())
                        ->distinct('gap_question_id')
                        ->count('gap_question_id'),
                    'questions_count' => $questionsCount,
                    'requirements' => $requirementsWithQuestions
                        ->filter(fn($ar) => $ar->requirement)
                        ->map(fn($ar) => [
                            'id' => $ar->requirement->id,
                            'code' => $ar->requirement->code,
                            'title' => $ar->requirement->title,
                            'questions_count' => $ar->requirement->gap_questions_count,
                        ]),
                ];
            });

        return Inertia::render('GapAssessment/Index', [
            'assessments' => $assessments,
        ]);
    }

    // ─── Frameworks + Requirements + Questions ────────────────────────────────
    public function getFrameworks()
    {
        $user = Auth::user();
        $orgId = $user->current_organization_id;

        $frameworks = Framework::where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->with([
                'requirements' => function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)
                        ->where('is_deleted', 0)
                        ->where('status', 'active')
                        ->select('id', 'code', 'title', 'priority', 'framework_id')
                        ->with([
                            'gapQuestions' => function ($gq) {
                                $gq->select('id', 'requirement_id', 'text')->orderBy('id');
                            },
                        ])
                        ->withCount('gapAssessmentRequirements');
                },
            ])
            ->select('id', 'code', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'code' => $f->code,
                'name' => $f->name,
                'requirements' => $f->requirements->map(fn($r) => [
                    'id' => $r->id,
                    'code' => $r->code,
                    'title' => $r->title,
                    'priority' => $r->priority,
                    'questions_count' => $r->gapQuestions->count(),
                    'assessments_count' => $r->gap_assessment_requirements_count,
                    'last_assessment' => GapAssessment::where('requirement_id', $r->id)
                        ->latest()
                        ->select('score', 'maturity_level', 'created_at')
                        ->first(),
                    'questions' => $r->gapQuestions,
                ]),
            ]);

        return response()->json(['frameworks' => $frameworks]);
    }

    // ─── Questions d'un requirement ───────────────────────────────────────────
    public function getQuestions(Requirement $requirement)
    {
        $existing = $requirement->gapQuestions()->orderBy('id')->get();

        if ($existing->count() >= 3) {
            return response()->json([
                'requirement' => [
                    'id' => $requirement->id,
                    'code' => $requirement->code,
                    'title' => $requirement->title,
                ],
                'questions' => $existing,
                'source' => 'database',
            ]);
        }

        try {
            $generated = $this->service->generateQuestionsViaAI($requirement);
            foreach ($generated as $q) {
                GapQuestion::firstOrCreate(
                    ['requirement_id' => $requirement->id, 'text' => $q['text']],
                    ['text' => $q['text']]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Question generation failed: ' . $e->getMessage());
        }

        return response()->json([
            'requirement' => [
                'id' => $requirement->id,
                'code' => $requirement->code,
                'title' => $requirement->title,
            ],
            'questions' => $requirement->gapQuestions()->orderBy('id')->get(),
            'source' => 'generated',
        ]);
    }

    // ─── Soumettre assessment ─────────────────────────────────────────────────
    public function store(Request $request)
    {
        $user = Auth::user();
        $orgId = $user->current_organization_id;

        $request->validate([
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'framework_id' => 'required|exists:frameworks,id',
            'requirement_ids' => 'required|array|min:1',
            'requirement_ids.*' => 'exists:requirements,id',
        ]);

        $assessment = GapAssessment::create([
            'organization_id' => $orgId,
            'framework_id' => $request->framework_id,
            'code' => $request->code,
            'name' => $request->name,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        // sync() au lieu du foreach — gère les doublons automatiquement
        $assessment->requirements()->sync($request->requirement_ids);

        return redirect('/gap-assessment');
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $orgId = $user->current_organization_id;

        $requirement = null;
        if ($request->has('requirement_id')) {
            $requirement = Requirement::where('id', $request->requirement_id)
                ->where('organization_id', $orgId)
                ->with(['gapQuestions' => fn($q) => $q->orderBy('id')])
                ->with('framework:id,code,name')
                ->firstOrFail();

            $requirement->questions = $requirement->gapQuestions;
        }

        return Inertia::render('GapAssessment/Create', [
            'requirement' => $requirement,
            'existingCount' => 0, // plus utilisé, on le retire
            'frameworkCounts' => \App\Models\GapAssessment::where('organization_id', $orgId)
                ->selectRaw('framework_id, count(*) as total')
                ->groupBy('framework_id')
                ->pluck('total', 'framework_id'), // { "2": 3, "5": 1, ... }
        ]);
    }

    // ─── AI Feedback ──────────────────────────────────────────────────────────
    public function generateAiFeedback(GapAssessment $assessment)
    {
        request()->validate(['feedback' => 'required|string|max:5000']);
        $assessment->update(['ai_feedback' => request('feedback')]);

        return response()->json(['success' => true]);
    }

    public function show(GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $requirements = $assessment->assessmentRequirements()
            ->with([
                'requirement' => function ($q) {
                    $q->with([
                        'gapQuestions' => function ($gq) {
                            $gq->orderBy('id');
                        }
                    ]);
                }
            ])
            ->get()
            ->map(function ($ar) use ($assessment) {
                $requirement = $ar->requirement;

                $questions = $requirement->gapQuestions->map(function ($question) use ($assessment) {
                    $latestAnswer = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $question->id)
                        ->latest()
                        ->first();

                    return [
                        'id' => $question->id,
                        'text' => $question->text,
                        'answer' => $latestAnswer?->answer,
                        'note' => $latestAnswer?->note,
                        'score' => $latestAnswer?->score,
                        'maturity_level' => $latestAnswer?->maturity_level,
                    ];
                });

                $answerScores = $questions->pluck('score')->filter();
                $maturityLevels = $questions->pluck('maturity_level')->filter();
                $reqScore = $answerScores->isNotEmpty() ? round($answerScores->avg(), 2) : 0;
                $reqMaturity = $maturityLevels->isNotEmpty() ? (int) round($maturityLevels->avg()) : 1;

                $answersMap = $questions->mapWithKeys(fn($q) => [
                    $q['id'] => $q['answer'] ?? 0,
                ])->all();

                return [
                    'id' => $requirement->id,
                    'code' => $requirement->code,
                    'title' => $requirement->title,
                    'description' => $requirement->description ?? '',
                    'questions' => $questions,
                    'score' => $reqScore,
                    'maturity_level' => $reqMaturity,
                    'answers_map' => $answersMap,
                ];
            });

        return Inertia::render('GapAssessment/Show', [
            'assessment' => [
                'id' => $assessment->id,
                'code' => $assessment->code,
                'name' => $assessment->name,
                'description' => $assessment->description,
                'start_date' => $assessment->start_date?->format('Y-m-d'),
                'end_date' => $assessment->end_date?->format('Y-m-d'),
                'framework' => $assessment->framework ? [
                    'code' => $assessment->framework->code,
                    'name' => $assessment->framework->name,
                ] : null,
                'overall_score' => $assessment->score ?? 0,
                'overall_maturity_level' => $assessment->maturity_level ?? 1,
            ],
            'requirements' => $requirements,
            'ml_result' => session('ml_result'),
        ]);
    }

    public function edit(GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $framework = Framework::where('id', $assessment->framework_id)
            ->where('organization_id', $user->current_organization_id)
            ->with([
                'requirements' => function ($q) use ($user) {
                    $q->where('organization_id', $user->current_organization_id)
                        ->where('is_deleted', 0)
                        ->where('status', 'active')
                        ->with(['gapQuestions' => fn($gq) => $gq->orderBy('id')])
                        ->withCount('gapQuestions');
                },
            ])
            ->firstOrFail();

        $frameworkData = [
            'id' => $framework->id,
            'code' => $framework->code,
            'name' => $framework->name,
            'requirements' => $framework->requirements->map(fn($r) => [
                'id' => $r->id,
                'code' => $r->code,
                'title' => $r->title,
                'questions' => $r->gapQuestions,
                'questions_count' => $r->gap_questions_count,
            ]),
        ];

        $selectedRequirementIds = $assessment->assessmentRequirements()
            ->pluck('requirement_id')
            ->toArray();

        return Inertia::render('GapAssessment/Edit', [
            'assessment' => [
                'id' => $assessment->id,
                'code' => $assessment->code,
                'name' => $assessment->name,
                'description' => $assessment->description,
                'start_date' => $assessment->start_date?->format('Y-m-d'),
                'end_date' => $assessment->end_date?->format('Y-m-d'),
                'framework_id' => $assessment->framework_id,
                'selected_requirement_ids' => $selectedRequirementIds,
            ],
            'framework' => $frameworkData,
        ]);
    }

    public function update(Request $request, GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $request->validate([
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'framework_id' => 'required|exists:frameworks,id',
            'requirement_ids' => 'required|array|min:1',
            'requirement_ids.*' => 'exists:requirements,id',
        ]);

        $assessment->update([
            'code' => $request->code,
            'name' => $request->name,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'framework_id' => $request->framework_id,
        ]);

        $assessment->assessmentRequirements()->delete();
        foreach ($request->requirement_ids as $reqId) {
            \App\Models\GapAssessmentRequirement::create([
                'gap_assessment_id' => $assessment->id,
                'requirement_id' => $reqId,
            ]);
        }

        return redirect()->route('gap-assessment.index')->with('success', 'Assessment updated.');
    }

    public function destroy(GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $assessment->delete();

        return redirect()->route('gap-assessment.index')->with('success', 'Assessment deleted successfully.');
    }

    public function byRequirement($requirementId)
    {
        return response()->json(
            GapAssessment::where('requirement_id', $requirementId)->latest()->get()
        );
    }

    public function generateAiAnalysis(Request $request)
    {
        $validated = $request->validate([
            'requirement_code' => 'required|string',
            'requirement_title' => 'required|string',
            'maturity_level' => 'required|integer',
            'score' => 'required|numeric',
            'answer_summary' => 'required|string',
            'gap' => 'required|integer',
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.groq.key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'max_tokens' => 1000,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a GRC compliance expert. Write a concise gap analysis. Return ONLY the paragraph.'],
                        ['role' => 'user', 'content' => "Requirement: {$validated['requirement_code']} - {$validated['requirement_title']}\nLevel: {$validated['maturity_level']}/5\nScore: {$validated['score']}%\nAnswers: {$validated['answer_summary']}\nGap: {$validated['gap']} levels."],
                    ],
                ]);

        return response()->json([
            'text' => $response->json('choices.0.message.content') ?? 'Unable to generate analysis.',
        ]);
    }

    // ─── CRUD Questions ───────────────────────────────────────────────────────
    public function storeQuestion(Request $request, Requirement $requirement)
    {
        $user = Auth::user();
        if ($requirement->organization_id !== $user->current_organization_id)
            abort(403);

        $validated = $request->validate(['text' => 'required|string|max:1000']);

        $question = GapQuestion::create([
            'requirement_id' => $requirement->id,
            'text' => $validated['text'],
        ]);

        return response()->json(['success' => true, 'question' => $question]);
    }

    public function updateQuestion(Request $request, GapQuestion $question)
    {
        $user = Auth::user();
        if ($question->requirement->organization_id !== $user->current_organization_id)
            abort(403);

        $validated = $request->validate(['text' => 'sometimes|required|string|max:1000']);
        $question->update($validated);

        return response()->json(['success' => true, 'question' => $question]);
    }

    public function destroyQuestion(GapQuestion $question)
    {
        $user = Auth::user();
        if ($question->requirement->organization_id !== $user->current_organization_id)
            abort(403);

        $question->delete();

        return response()->json(['success' => true]);
    }

    // ─── Answer Questions Page ────────────────────────────────────────────────
    public function answerQuestions(GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $requirements = $assessment->assessmentRequirements()
            ->with([
                'requirement' => fn($q) => $q->with([
                    'gapQuestions' => fn($gq) => $gq->orderBy('id'),
                ]),
            ])
            ->get()
            ->map(function ($ar) use ($assessment) {
                $requirement = $ar->requirement;
                $questions = $requirement->gapQuestions->map(function ($q) use ($assessment) {
                    $lastAnswer = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $q->id)
                        ->latest()
                        ->first();

                    $history = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $q->id)
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(fn($a) => [
                            'id' => $a->id,
                            'answer' => $a->answer,
                            'note' => $a->note,
                            'answered_at' => $a->created_at->toISOString(),
                            'score' => $a->score,
                            'maturity_level' => $a->maturity_level,
                        ]);

                    return [
                        'id' => $q->id,
                        'text' => $q->text,
                        'current_answer' => $lastAnswer?->answer,
                        'current_note' => $lastAnswer?->note,
                        'history' => $history,
                    ];
                });

                return [
                    'id' => $requirement->id,
                    'code' => $requirement->code,
                    'title' => $requirement->title,
                    'questions' => $questions,
                ];
            });

        return Inertia::render('GapAssessment/AnswerQuestions', [
            'assessment' => [
                'id' => $assessment->id,
                'code' => $assessment->code,
                'name' => $assessment->name,
                'framework' => $assessment->framework ? [
                    'code' => $assessment->framework->code,
                    'name' => $assessment->framework->name,
                ] : null,
            ],
            'requirements' => $requirements,
        ]);
    }

    public function storeAnswers(Request $request, GapAssessment $assessment, MLMaturityService $mlService)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $request->validate([
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|exists:gap_questions,id',
            'answers.*.answer' => 'required|integer|min:0|max:4',
            'answers.*.note' => 'nullable|string|max:1000',
            'ml_result' => 'nullable|string',
        ]);

        // ── 1. ml_result du frontend (optionnel) ─────────────────────────────
        $mlResult = $request->filled('ml_result')
            ? json_decode($request->input('ml_result'), true)
            : null;

        $generateMlServerSide = !$mlResult;

        // ── 2. Map des réponses ───────────────────────────────────────────────
        $answersMap = collect($request->answers)
            ->pluck('answer', 'question_id')
            ->map(fn($v) => (int) $v)
            ->all();

        // ── 3. Calcul ML par requirement ──────────────────────────────────────
        $requirementResults = [];

        $assessment->assessmentRequirements()
            ->with(['requirement.gapQuestions' => fn($q) => $q->orderBy('id')])
            ->get()
            ->each(function ($ar) use ($answersMap, $mlService, &$requirementResults) {
                $requirement = $ar->requirement;
                $questions = $requirement->gapQuestions;
                $relevantAnswers = collect($answersMap)->only($questions->pluck('id'))->all();

                if (empty($relevantAnswers))
                    return;

                try {
                    $prediction = $mlService->predict($relevantAnswers, $questions);
                } catch (\Exception $e) {
                    \Log::error("ML prediction failed for req {$requirement->id}: " . $e->getMessage());
                    $avg = array_sum($relevantAnswers) / count($relevantAnswers);
                    $prediction = [
                        'maturity_level' => max(1, min(5, (int) round($avg) + 1)),
                        'weighted_score' => round(($avg / 4) * 100, 2),
                    ];
                }

                $requirementResults[$requirement->id] = $prediction;
            });

        // ── 4. Enregistrement des réponses ────────────────────────────────────
        $now = now();

        foreach ($request->answers as $a) {
            $qId = (int) $a['question_id'];
            $answer = (int) $a['answer'];
            $note = $a['note'] ?? null;

            $question = GapQuestion::find($qId);
            $reqId = $question?->requirement_id;
            $prediction = $requirementResults[$reqId]
                ?? ['maturity_level' => 1, 'weighted_score' => 0];

            $lastEntry = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                ->where('gap_question_id', $qId)
                ->latest()
                ->first();

            $hasChanged = !$lastEntry
                || (int) $lastEntry->answer !== $answer
                || (string) ($lastEntry->note ?? '') !== (string) ($note ?? '');

            if ($hasChanged) {
                GapAssessmentAnswer::create([
                    'gap_assessment_id' => $assessment->id,
                    'gap_question_id' => $qId,
                    'answer' => $answer,
                    'note' => $note,
                    'score' => $prediction['weighted_score'],
                    'maturity_level' => $prediction['maturity_level'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ── 5. Mise à jour score/maturity de l'assessment ─────────────────────
        if (!empty($requirementResults)) {
            $avgScore = collect($requirementResults)->avg('weighted_score');
            $avgMaturity = (int) round(collect($requirementResults)->avg('maturity_level'));

            $assessment->update([
                'score' => round($avgScore, 2),
                'maturity_level' => max(1, min(5, $avgMaturity)),
            ]);
        }

        // ── 6. Génération ML côté serveur si non fourni par le frontend ───────
        if ($generateMlServerSide && !empty($requirementResults)) {
            $avgLevel = (int) round(collect($requirementResults)->avg('maturity_level'));
            $avgScore = round(collect($requirementResults)->avg('weighted_score'), 2);
            $mlUrl = config('services.ml.url', 'http://127.0.0.1:5000');

            try {
                $firstReq = $assessment->assessmentRequirements()
                    ->with('requirement')
                    ->first()?->requirement;

                $analyzePayload = [
                    'requirement_code' => $firstReq?->code ?? 'N/A',
                    'requirement_title' => $firstReq?->title ?? 'N/A',
                    'maturity_level' => $avgLevel,
                    'score' => $avgScore,
                    'gap' => max(0, 5 - $avgLevel),
                    'answers' => collect($answersMap)->map(fn($v) => (int) $v)->toArray(),
                ];

                $response = Http::timeout(10)->post("{$mlUrl}/analyze", $analyzePayload);

                if ($response->successful()) {
                    $mlResult = array_merge(
                        ['maturity_level' => $avgLevel, 'weighted_score' => $avgScore],
                        $response->json()
                    );
                }
            } catch (\Exception $e) {
                \Log::warning('Server-side ML analyze failed: ' . $e->getMessage());
            }
        }

        // ── 7. Sauvegarde ml_result + création action plans ───────────────────
        if ($mlResult) {
            $assessment->update(['ml_result' => $mlResult]);
            session()->flash('ml_result', $mlResult);

            \App\Models\ActionPlan::where('gap_id', $assessment->id)->delete();

            foreach ($mlResult['roadmap'] ?? [] as $step) {
                if (!($step['is_next'] ?? false))
                    continue;

                foreach ($step['actions'] ?? [] as $action) {
                    \App\Models\ActionPlan::create([
                        'gap_id' => $assessment->id,
                        'assigned_to' => $user->id,
                        'title' => substr($action, 0, 255),
                        'description' => "L{$step['level']} — {$step['label']}: {$action}",
                        'due_date' => now()->addDays(30),
                        'status' => 'open',
                    ]);
                }
            }
        }

        return redirect()->route('gap-assessments.results', $assessment);
    }

    public function resultsPage(GapAssessment $assessment)
    {
        $user = Auth::user();
        abort_if($assessment->organization_id !== $user->current_organization_id, 403);

        $requirements = $assessment->assessmentRequirements()
            ->with(['requirement' => fn($q) => $q->with(['gapQuestions' => fn($gq) => $gq->orderBy('id')])])
            ->get()
            ->map(function ($ar) use ($assessment) {
                $requirement = $ar->requirement;

                $questions = $requirement->gapQuestions->map(function ($question) use ($assessment) {
                    $latestAnswer = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $question->id)
                        ->latest()
                        ->first();

                    return [
                        'id' => $question->id,
                        'text' => $question->text,
                        'answer' => $latestAnswer?->answer,
                        'note' => $latestAnswer?->note,
                        'score' => $latestAnswer?->score,
                        'maturity_level' => $latestAnswer?->maturity_level,
                    ];
                });

                $answerScores = $questions->pluck('score')->filter();
                $maturityLevels = $questions->pluck('maturity_level')->filter();
                $reqScore = $answerScores->isNotEmpty() ? round($answerScores->avg(), 2) : 0;
                $reqMaturity = $maturityLevels->isNotEmpty() ? (int) round($maturityLevels->avg()) : 1;

                $answersMap = $questions->mapWithKeys(fn($q) => [
                    $q['id'] => $q['answer'] ?? 0,
                ])->all();

                return [
                    'id' => $requirement->id,
                    'code' => $requirement->code,
                    'title' => $requirement->title,
                    'description' => $requirement->description ?? '',
                    'questions' => $questions,
                    'score' => $reqScore,
                    'maturity_level' => $reqMaturity,
                    'answers_map' => $answersMap,
                ];
            });

        return Inertia::render('GapAssessment/Results', [
            'assessment' => [
                'id' => $assessment->id,
                'code' => $assessment->code,
                'name' => $assessment->name,
                'framework' => $assessment->framework ? [
                    'code' => $assessment->framework->code,
                    'name' => $assessment->framework->name,
                ] : null,
                'overall_score' => $assessment->score ?? 0,
                'overall_maturity_level' => $assessment->maturity_level ?? 1,
            ],
            'requirements' => $requirements,
            'ml_result' => session('ml_result') ?? $assessment->ml_result,
        ]);
    }

    // ─── ML Predict → appelle Flask Python ───────────────────────────────────
    public function mlPredict(Request $request)
    {
        $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer' => 'required|integer|min:0|max:4',
            'questions' => 'required|array',
        ]);

        // Map int 0..4 → float 0.0..1.0
        $scale = [0 => 0.0, 1 => 0.25, 2 => 0.5, 3 => 0.75, 4 => 1.0];

        $answersById = collect($request->answers)
            ->pluck('answer', 'question_id')
            ->toArray();

        $orderedFloats = [];
        foreach ($request->questions as $q) {
            $raw = (int) ($answersById[$q['id']] ?? 0);
            $orderedFloats[] = $scale[max(0, min(4, $raw))];
        }

        $count = count($orderedFloats);
        $payload = [];

        if ($count === 0) {
            for ($i = 1; $i <= 5; $i++)
                $payload["q{$i}"] = 0.0;

        } elseif ($count >= 5) {
            $buckets = [[], [], [], [], []];
            foreach ($orderedFloats as $i => $val)
                $buckets[$i % 5][] = $val;
            foreach ($buckets as $i => $bucket) {
                $payload['q' . ($i + 1)] = count($bucket)
                    ? round(array_sum($bucket) / count($bucket), 4)
                    : 0.0;
            }
        } else {
            // Interpolation linéaire pour N < 5
            for ($i = 0; $i < 5; $i++) {
                $srcPos = $i * ($count - 1) / 4;
                $lo = max(0, min($count - 1, (int) floor($srcPos)));
                $hi = max(0, min($count - 1, (int) ceil($srcPos)));
                $frac = $srcPos - $lo;
                $val = $orderedFloats[$lo] + $frac * ($orderedFloats[$hi] - $orderedFloats[$lo]);
                $payload['q' . ($i + 1)] = round($val, 4);
            }
        }

        // ── Appel Flask ────────────────────────────────────────────────────
        $mlUrl = config('services.ml.url', 'http://127.0.0.1:5000');

        try {
            $response = Http::timeout(8)->post("{$mlUrl}/predict", $payload);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'maturity_level' => $data['maturity_level'] ?? 1,
                    'weighted_score' => $data['weighted_score'] ?? 0,
                    'confidence' => $data['confidence'] ?? 0.8,
                    'probabilities' => $data['probabilities'] ?? [],
                    'source' => 'ml_model',
                    'gate_capped' => $data['gate_capped'] ?? false,
                ]);
            }

            \Log::warning('Flask /predict non-2xx', ['status' => $response->status()]);

        } catch (\Exception $e) {
            \Log::warning('Flask unavailable for mlPredict: ' . $e->getMessage());
        }

        // ── Fallback PHP ───────────────────────────────────────────────────
        $avg = $count ? array_sum($orderedFloats) / $count : 0;
        $score = round($avg * 100, 2);
        $level = max(1, min(5, (int) round($avg * 4) + 1));

        return response()->json([
            'maturity_level' => $level,
            'weighted_score' => $score,
            'confidence' => 0.8,
            'probabilities' => [],
            'source' => 'rule_based',
            'gate_capped' => false,
        ]);
    }

    // ─── ML Analyze → appelle Flask Python ───────────────────────────────────
    public function mlAnalyze(Request $request)
    {
        $request->validate([
            'requirement_code' => 'required|string',
            'requirement_title' => 'required|string',
            'maturity_level' => 'required|integer',
            'score' => 'required|numeric',
            'gap' => 'required|integer',
            'answers' => 'required|array',
            'requirements_detail' => 'nullable|array',
        ]);

        $mlUrl = config('services.ml.url', 'http://127.0.0.1:5000');
        $details = collect($request->requirements_detail ?? []);
        $globalLevel = (int) $request->maturity_level;
        $globalScore = round((float) $request->score, 1);

        // ── Convertir answers → {Dimension: label} pour Flask ─────────────
        $dimensionKeys = ['Existence', 'Formalization', 'Enforcement', 'Measurement', 'Optimization'];
        $labelMap = [0 => 'NO', 1 => 'BASIC', 2 => 'PARTIAL', 3 => 'MANAGED', 4 => 'YES'];
        $namedAnswers = [];
        $answersInput = $request->answers;

        if (isset($answersInput[0]) && is_array($answersInput[0]) && isset($answersInput[0]['answer'])) {
            foreach ($answersInput as $i => $a) {
                $val = is_array($a) ? ($a['answer'] ?? 0) : $a;
                if (isset($dimensionKeys[$i])) {
                    $namedAnswers[$dimensionKeys[$i]] = $labelMap[(int) $val] ?? 'NO';
                }
            }
        } else {
            foreach ($answersInput as $dim => $val) {
                $namedAnswers[$dim] = is_numeric($val)
                    ? ($labelMap[(int) $val] ?? 'NO')
                    : strtoupper($val);
            }
        }

        $primaryCode = $details->isNotEmpty() ? $details->first()['code'] : $request->requirement_code;
        $primaryTitle = $details->isNotEmpty() ? $details->first()['title'] : $request->requirement_title;

        $flaskPayload = [
            'requirement_code' => $primaryCode,
            'requirement_title' => $primaryTitle,
            'maturity_level' => $globalLevel,
            'score' => $globalScore,
            'gap' => (int) $request->gap,
            'answers' => $namedAnswers,
        ];

        try {
            $response = Http::timeout(15)->post("{$mlUrl}/analyze", $flaskPayload);

            if ($response->successful()) {
                $data = $response->json();

                // Enrichir summary avec tous les requirements
                if ($details->count() >= 1) {
                    $reqParts = $details->map(
                        fn($r) =>
                        "{$r['code']} at Level {$r['maturity_level']} (" . round($r['score'], 1) . "%)"
                    )->join(', ');

                    $data['summary'] = "Overall maturity is Level {$globalLevel} ({$globalScore}%). "
                        . "Requirements: {$reqParts}. "
                        . ((int) $request->gap > 0
                            ? "Focus on reaching Level " . ($globalLevel + 1) . " through the actions below."
                            : "All requirements have reached maximum maturity.");
                }

                // Enrichir current_issues avec détail par requirement
                $reqIssues = [];
                foreach ($details as $req) {
                    $lvl = (int) $req['maturity_level'];
                    $code = $req['code'];
                    $sc = round($req['score'], 1);
                    $reqIssues[] = match (true) {
                        $lvl <= 1 => "Critical: {$code} has no formal processes in place ({$sc}%) — immediate action required.",
                        $lvl === 2 => "Critical: {$code} relies on ad-hoc practices ({$sc}%) — documentation needed.",
                        $lvl === 3 => "Confirmed: {$code} has defined processes ({$sc}%) — focus on measurement.",
                        $lvl === 4 => "Confirmed: {$code} is well managed ({$sc}%) — optimization is next.",
                        default => "Confirmed: {$code} is fully optimized ({$sc}%) — sustain and improve.",
                    };
                }
                $data['current_issues'] = array_merge($reqIssues, $data['current_issues'] ?? []);

                return response()->json($data);
            }

            \Log::warning('Flask /analyze non-2xx', ['status' => $response->status()]);

        } catch (\Exception $e) {
            \Log::warning('Flask unavailable for mlAnalyze: ' . $e->getMessage());
        }

        // ── Fallback PHP ───────────────────────────────────────────────────
        return $this->mlAnalyzeFallback($request, $details, $globalLevel, $globalScore);
    }

    // ─── Fallback PHP pour mlAnalyze ─────────────────────────────────────────
    private function mlAnalyzeFallback(
        Request $request,
        \Illuminate\Support\Collection $details,
        int $globalLevel,
        float $globalScore
    ): \Illuminate\Http\JsonResponse {
        $gap = (int) $request->gap;
        $allCodes = $details->pluck('code')->join(', ') ?: $request->requirement_code;
        $criticalCodes = $details->filter(fn($r) => (int) $r['maturity_level'] <= 2)->pluck('code')->join(', ');
        $weakCodes = $details->filter(fn($r) => (int) $r['maturity_level'] <= 3)->pluck('code')->join(', ');

        $reqParts = $details->map(
            fn($r) =>
            "{$r['code']} at Level {$r['maturity_level']} (" . round($r['score'], 1) . "%)"
        )->join(', ') ?: "{$request->requirement_code} at Level {$globalLevel} ({$globalScore}%)";

        $summary = "Overall maturity is Level {$globalLevel} ({$globalScore}%). "
            . "Requirements: {$reqParts}. "
            . ($gap > 0
                ? "Focus on reaching Level " . ($globalLevel + 1) . " through the actions below."
                : "All requirements have reached maximum maturity.");

        $currentIssues = [];
        foreach ($details as $req) {
            $lvl = (int) $req['maturity_level'];
            $code = $req['code'];
            $sc = round($req['score'], 1);
            $currentIssues[] = match (true) {
                $lvl <= 1 => "Critical: {$code} has no formal processes ({$sc}%) — immediate action required.",
                $lvl === 2 => "Critical: {$code} relies on ad-hoc practices ({$sc}%) — documentation needed.",
                $lvl === 3 => "Confirmed: {$code} has defined processes ({$sc}%) — focus on measurement.",
                $lvl === 4 => "Confirmed: {$code} is well managed ({$sc}%) — optimization is next.",
                default => "Confirmed: {$code} is fully optimized ({$sc}%) — sustain and improve.",
            };
        }

        $subtitles = [
            1 => 'Ad-hoc, undocumented',
            2 => 'Ad-hoc practices',
            3 => 'Documented & approved',
            4 => 'Measured & monitored',
            5 => 'Continuously improved',
        ];

        $stepsDef = [
            1 => ['label' => 'Initial', 'actions' => []],
            2 => ['label' => 'Basic', 'actions' => $criticalCodes ? ["Draft initial policy for: {$criticalCodes}.", "Define scope and stakeholders for {$criticalCodes}.", "Implement basic manual controls for {$criticalCodes}.", "Communicate baseline rules to the team."] : ["Review and consolidate existing policies across {$allCodes}.", "Ensure basic controls are documented."]],
            3 => ['label' => 'Defined', 'actions' => $criticalCodes ? ["Formalize and get sign-off on {$criticalCodes} policy.", "Document procedures and assign responsibilities for {$criticalCodes}.", "Implement enforcement controls for {$criticalCodes}.", "Train staff on {$criticalCodes} procedures."] : ["Standardize procedures across {$allCodes}.", "Ensure management approval for all policies."]],
            4 => ['label' => 'Managed', 'actions' => $weakCodes ? ["Define KPIs and metrics for: {$weakCodes}.", "Establish periodic review cycles for {$weakCodes}.", "Implement dashboards to track {$allCodes}.", "Address deviations through corrective-action process."] : ["Refine KPIs and add predictive metrics.", "Automate periodic reviews."]],
            5 => ['label' => 'Optimized', 'actions' => ["Automate compliance checks across {$allCodes}.", "Use predictive analytics to prevent gaps.", "Integrate feedback loops from audits.", "Benchmark against industry peers."]],
        ];

        $roadmap = [];
        foreach ($stepsDef as $lvl => $step) {
            $isCompleted = $lvl < $globalLevel;
            $isCurrent = $lvl === $globalLevel;
            $isNext = $lvl === $globalLevel + 1;
            $roadmap[] = [
                'level' => $lvl,
                'label' => $step['label'],
                'subtitle' => $isCompleted ? '' : $subtitles[$lvl],
                'status' => $isCompleted ? 'completed' : ($isCurrent ? 'current' : 'todo'),
                'actions' => $isCompleted ? [] : $step['actions'],
                'is_current' => $isCurrent,
                'is_next' => $isNext,
            ];
        }

        return response()->json([
            'summary' => $summary,
            'current_issues' => $currentIssues,
            'roadmap' => $roadmap,
        ]);
    }
    public function export(Request $request)
    {
        $user = Auth::user();
        $orgId = $user->current_organization_id;

        if (!$orgId) {
            abort(403, 'Please select an organization first.');
        }

        // ── 1. Requête de base ────────────────────────────────────────
        $query = GapAssessment::where('organization_id', $orgId)
            ->whereNotNull('code')
            ->with(['framework:id,code,name', 'assessmentRequirements.requirement'])
            ->latest();

        // ── 2. Filtres ────────────────────────────────────────────────
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('framework', function ($fq) use ($search) {
                        $fq->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('framework_ids')) {
            $ids = array_filter(explode(',', $request->framework_ids));
            if (!empty($ids)) {
                $query->whereIn('framework_id', $ids);
            }
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $now = now();
            if ($request->status === 'overdue') {
                $query->where('end_date', '<', $now);
            } elseif ($request->status === 'upcoming') {
                $query->where('start_date', '>', $now);
            }
        }

        // ── 3. Mapping vers tableau simple ────────────────────────────
        $rows = $query->get()->map(function (GapAssessment $a) {
            // Compter les questions via la relation déjà chargée
            $questionsCount = $a->assessmentRequirements->sum(function ($ar) {
                return $ar->requirement ? $ar->requirement->gapQuestions()->count() : 0;
            });

            // Compter les réponses distinctes
            $answersCount = DB::table('gap_assessment_answers')
                ->where('gap_assessment_id', $a->id)
                ->distinct('gap_question_id')
                ->count('gap_question_id');

            return [
                'id' => $a->id,
                'code' => $a->code,
                'name' => $a->name,
                'description' => $a->description,
                'start_date' => $a->start_date?->format('Y-m-d'),
                'end_date' => $a->end_date?->format('Y-m-d'),
                'framework' => $a->framework ? [
                    'id' => $a->framework->id,
                    'code' => $a->framework->code,
                    'name' => $a->framework->name,
                ] : null,
                'requirements_count' => $a->assessmentRequirements->count(),
                'answers_count' => (int) $answersCount,
                'questions_count' => (int) $questionsCount,
            ];
        });

        // ── 4. Téléchargement ─────────────────────────────────────────
        return Excel::download(
            new GapAssessmentExport($rows),
            'gap-assessments-' . now()->format('Y-m-d-His') . '.xlsx'
        );
    }
}