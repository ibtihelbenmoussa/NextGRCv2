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


class GapAssessmentController extends Controller
{
    public function __construct(protected GapAssessmentService $service)
    {
    }

    // ─── Page principale ──────────────────────────────────────────────────────
    public function index()
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        $assessments = GapAssessment::where('organization_id', $orgId)
            ->whereNotNull('code')
            ->with('framework:id,code,name')
            ->withCount('assessmentRequirements')
            ->withCount([
                'answers as answers_count' => function ($q) {
                    $q->select(\DB::raw('COUNT(DISTINCT gap_question_id)'));
                },
            ])
            ->latest()
            ->get()
            ->map(function ($a) {
                // ── Charge les requirements + leur nombre de questions en 1 requête
                $requirementsWithQuestions = $a->assessmentRequirements()
                    ->with(['requirement' => fn($q) => $q->withCount('gapQuestions')])
                    ->get();

                // ── questions_count : total de questions liées à cet assessment
                $questionsCount = $requirementsWithQuestions->sum(
                    fn($ar) => $ar->requirement->gap_questions_count
                );

                return [
                    'id'                 => $a->id,
                    'code'               => $a->code,
                    'name'               => $a->name,
                    'description'        => $a->description,
                    'start_date'         => $a->start_date?->format('Y-m-d'),
                    'end_date'           => $a->end_date?->format('Y-m-d'),
                    'framework'          => $a->framework ? [
                        'id'   => $a->framework->id,
                        'code' => $a->framework->code,
                        'name' => $a->framework->name,
                    ] : null,
                    'requirements_count' => $a->assessment_requirements_count,
                    // ✅ answers_count = nb de questions DISTINCTES ayant au moins une réponse
                    'answers_count'      => (int) $a->answers_count,
                    // ✅ questions_count = nb total de questions des requirements liés
                    'questions_count'    => $questionsCount,
                    // ✅ requirements utilise la collection déjà chargée (pas de N+1)
                    'requirements'       => $requirementsWithQuestions->map(fn($ar) => [
                        'id'             => $ar->requirement->id,
                        'code'           => $ar->requirement->code,
                        'title'          => $ar->requirement->title,
                        'questions_count'=> $ar->requirement->gap_questions_count,
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
        $user  = Auth::user();
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
                'id'           => $f->id,
                'code'         => $f->code,
                'name'         => $f->name,
                'requirements' => $f->requirements->map(fn($r) => [
                    'id'               => $r->id,
                    'code'             => $r->code,
                    'title'            => $r->title,
                    'priority'         => $r->priority,
                    'questions_count'  => $r->gapQuestions->count(),
                    'assessments_count'=> $r->gap_assessment_requirements_count,
                    'last_assessment'  => GapAssessment::where('requirement_id', $r->id)
                        ->latest()
                        ->select('score', 'maturity_level', 'created_at')
                        ->first(),
                    'questions'        => $r->gapQuestions,
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
                    'id'    => $requirement->id,
                    'code'  => $requirement->code,
                    'title' => $requirement->title,
                ],
                'questions' => $existing,
                'source'    => 'database',
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
                'id'    => $requirement->id,
                'code'  => $requirement->code,
                'title' => $requirement->title,
            ],
            'questions' => $requirement->gapQuestions()->orderBy('id')->get(),
            'source'    => 'generated',
        ]);
    }

    // ─── Soumettre assessment ─────────────────────────────────────────────────
    public function store(Request $request)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        $request->validate([
            'code'              => 'required|string|max:100',
            'name'              => 'required|string|max:255',
            'description'       => 'nullable|string',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'framework_id'      => 'required|exists:frameworks,id',
            'requirement_ids'   => 'required|array|min:1',
            'requirement_ids.*' => 'exists:requirements,id',
        ]);

        $assessment = GapAssessment::create([
            'organization_id' => $orgId,
            'framework_id'    => $request->framework_id,
            'code'            => $request->code,
            'name'            => $request->name,
            'description'     => $request->description,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
        ]);

        foreach ($request->requirement_ids as $reqId) {
            \App\Models\GapAssessmentRequirement::create([
                'gap_assessment_id' => $assessment->id,
                'requirement_id'    => $reqId,
            ]);
        }

        return redirect('/gap-assessment');
    }

    public function create(Request $request)
    {
        $user  = Auth::user();
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
        ->with(['requirement' => function ($q) {
            $q->with(['gapQuestions' => function ($gq) {
                $gq->orderBy('id');
            }]);
        }])
        ->get()
        ->map(function ($ar) use ($assessment) {
            $requirement = $ar->requirement;

            $questions = $requirement->gapQuestions->map(function ($question) use ($assessment) {
                $latestAnswer = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                    ->where('gap_question_id', $question->id)
                    ->latest()
                    ->first();

                return [
                    'id'             => $question->id,
                    'text'           => $question->text,
                    'answer'         => $latestAnswer?->answer,
                    'note'           => $latestAnswer?->note,
                    'score'          => $latestAnswer?->score,
                    'maturity_level' => $latestAnswer?->maturity_level,
                ];
            });

            $answerScores   = $questions->pluck('score')->filter();
            $maturityLevels = $questions->pluck('maturity_level')->filter();
            $reqScore       = $answerScores->isNotEmpty() ? round($answerScores->avg(), 2) : 0;
            $reqMaturity    = $maturityLevels->isNotEmpty() ? (int) round($maturityLevels->avg()) : 1;

            $answersMap = $questions->mapWithKeys(fn($q) => [
                $q['id'] => $q['answer'] ?? 0,
            ])->all();

            return [
                'id'             => $requirement->id,
                'code'           => $requirement->code,
                'title'          => $requirement->title,
                'description'    => $requirement->description ?? '',
                'questions'      => $questions,
                'score'          => $reqScore,
                'maturity_level' => $reqMaturity,
                'answers_map'    => $answersMap,
            ];
        });

    return Inertia::render('GapAssessment/Show', [
        'assessment' => [
            'id'                     => $assessment->id,
            'code'                   => $assessment->code,
            'name'                   => $assessment->name,
            'description'            => $assessment->description,
            'start_date'             => $assessment->start_date?->format('Y-m-d'),
            'end_date'               => $assessment->end_date?->format('Y-m-d'),
            'framework'              => $assessment->framework ? [
                'code' => $assessment->framework->code,
                'name' => $assessment->framework->name,
            ] : null,
            'overall_score'          => $assessment->score ?? 0,
            'overall_maturity_level' => $assessment->maturity_level ?? 1,
        ],
        'requirements' => $requirements,
        'ml_result'    => session('ml_result'),
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
            'id'           => $framework->id,
            'code'         => $framework->code,
            'name'         => $framework->name,
            'requirements' => $framework->requirements->map(fn($r) => [
                'id'             => $r->id,
                'code'           => $r->code,
                'title'          => $r->title,
                'questions'      => $r->gapQuestions,
                'questions_count'=> $r->gap_questions_count,
            ]),
        ];

        $selectedRequirementIds = $assessment->assessmentRequirements()
            ->pluck('requirement_id')
            ->toArray();

        return Inertia::render('GapAssessment/Edit', [
            'assessment' => [
                'id'                       => $assessment->id,
                'code'                     => $assessment->code,
                'name'                     => $assessment->name,
                'description'              => $assessment->description,
                'start_date'               => $assessment->start_date?->format('Y-m-d'),
                'end_date'                 => $assessment->end_date?->format('Y-m-d'),
                'framework_id'             => $assessment->framework_id,
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
            'code'              => 'required|string|max:100',
            'name'              => 'required|string|max:255',
            'description'       => 'nullable|string',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'framework_id'      => 'required|exists:frameworks,id',
            'requirement_ids'   => 'required|array|min:1',
            'requirement_ids.*' => 'exists:requirements,id',
        ]);

        $assessment->update([
            'code'         => $request->code,
            'name'         => $request->name,
            'description'  => $request->description,
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'framework_id' => $request->framework_id,
        ]);

        $assessment->assessmentRequirements()->delete();
        foreach ($request->requirement_ids as $reqId) {
            \App\Models\GapAssessmentRequirement::create([
                'gap_assessment_id' => $assessment->id,
                'requirement_id'    => $reqId,
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
            'requirement_code'  => 'required|string',
            'requirement_title' => 'required|string',
            'maturity_level'    => 'required|integer',
            'score'             => 'required|numeric',
            'answer_summary'    => 'required|string',
            'gap'               => 'required|integer',
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.groq.key'),
            'Content-Type'  => 'application/json',
        ])->post('https://api.groq.com/openai/v1/chat/completions', [
            'model'      => 'llama-3.3-70b-versatile',
            'max_tokens' => 1000,
            'messages'   => [
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
        if ($requirement->organization_id !== $user->current_organization_id) abort(403);

        $validated = $request->validate(['text' => 'required|string|max:1000']);

        $question = GapQuestion::create([
            'requirement_id' => $requirement->id,
            'text'           => $validated['text'],
        ]);

        return response()->json(['success' => true, 'question' => $question]);
    }

    public function updateQuestion(Request $request, GapQuestion $question)
    {
        $user = Auth::user();
        if ($question->requirement->organization_id !== $user->current_organization_id) abort(403);

        $validated = $request->validate(['text' => 'sometimes|required|string|max:1000']);
        $question->update($validated);

        return response()->json(['success' => true, 'question' => $question]);
    }

    public function destroyQuestion(GapQuestion $question)
    {
        $user = Auth::user();
        if ($question->requirement->organization_id !== $user->current_organization_id) abort(403);

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
                $questions   = $requirement->gapQuestions->map(function ($q) use ($assessment) {
                    $lastAnswer = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $q->id)
                        ->latest()
                        ->first();

                    $history = GapAssessmentAnswer::where('gap_assessment_id', $assessment->id)
                        ->where('gap_question_id', $q->id)
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(fn($a) => [
                            'id'           => $a->id,
                            'answer'       => $a->answer,
                            'note'         => $a->note,
                            'answered_at'  => $a->created_at->toISOString(),
                            'score'        => $a->score,
                            'maturity_level' => $a->maturity_level,
                        ]);

                    return [
                        'id'             => $q->id,
                        'text'           => $q->text,
                        'current_answer' => $lastAnswer?->answer,
                        'current_note'   => $lastAnswer?->note,
                        'history'        => $history,
                    ];
                });

                return [
                    'id'        => $requirement->id,
                    'code'      => $requirement->code,
                    'title'     => $requirement->title,
                    'questions' => $questions,
                ];
            });

        return Inertia::render('GapAssessment/AnswerQuestions', [
            'assessment'   => [
                'id'        => $assessment->id,
                'code'      => $assessment->code,
                'name'      => $assessment->name,
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
            'answers'                => 'required|array|min:1',
            'answers.*.question_id'  => 'required|exists:gap_questions,id',
            'answers.*.answer'       => 'required|integer|min:0|max:4',
            'answers.*.note'         => 'nullable|string|max:1000',
            'ml_result'              => 'nullable|string',
        ]);

        $mlResult = $request->filled('ml_result')
            ? json_decode($request->input('ml_result'), true)
            : null;

        $answersMap = collect($request->answers)
            ->pluck('answer', 'question_id')
            ->map(fn($v) => (int) $v)
            ->all();

        $requirementResults = [];

        $assessment->assessmentRequirements()
            ->with(['requirement.gapQuestions' => fn($q) => $q->orderBy('id')])
            ->get()
            ->each(function ($ar) use ($answersMap, $mlService, &$requirementResults) {
                $requirement     = $ar->requirement;
                $questions       = $requirement->gapQuestions;
                $relevantAnswers = collect($answersMap)->only($questions->pluck('id'))->all();

                if (empty($relevantAnswers)) return;

                try {
                    $prediction = $mlService->predict($relevantAnswers, $questions);
                } catch (\Exception $e) {
                    \Log::error("ML prediction failed for req {$requirement->id}: " . $e->getMessage());
                    $avg        = array_sum($relevantAnswers) / count($relevantAnswers);
                    $prediction = [
                        'maturity_level'  => max(1, min(5, (int) round($avg) + 1)),
                        'weighted_score'  => round(($avg / 4) * 100, 2),
                    ];
                }

                $requirementResults[$requirement->id] = $prediction;
            });

        $now = now();

        foreach ($request->answers as $a) {
            $qId    = (int) $a['question_id'];
            $answer = (int) $a['answer'];
            $note   = $a['note'] ?? null;

            $question  = GapQuestion::find($qId);
            $reqId     = $question?->requirement_id;
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
                    'gap_question_id'   => $qId,
                    'answer'            => $answer,
                    'note'              => $note,
                    'score'             => $prediction['weighted_score'],
                    'maturity_level'    => $prediction['maturity_level'],
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }
        }

        if (!empty($requirementResults)) {
            $avgScore   = collect($requirementResults)->avg('weighted_score');
            $avgMaturity = (int) round(collect($requirementResults)->avg('maturity_level'));

            $assessment->update([
                'score'          => round($avgScore, 2),
                'maturity_level' => max(1, min(5, $avgMaturity)),
            ]);
        }

        if ($mlResult) {
            session()->flash('ml_result', $mlResult);
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
                        'id'             => $question->id,
                        'text'           => $question->text,
                        'answer'         => $latestAnswer?->answer,
                        'note'           => $latestAnswer?->note,
                        'score'          => $latestAnswer?->score,
                        'maturity_level' => $latestAnswer?->maturity_level,
                    ];
                });

                $answerScores   = $questions->pluck('score')->filter();
                $maturityLevels = $questions->pluck('maturity_level')->filter();
                $reqScore       = $answerScores->isNotEmpty() ? round($answerScores->avg(), 2) : 0;
                $reqMaturity    = $maturityLevels->isNotEmpty() ? (int) round($maturityLevels->avg()) : 1;

                $answersMap = $questions->mapWithKeys(fn($q) => [
                    $q['id'] => $q['answer'] ?? 0,
                ])->all();

                return [
                    'id'           => $requirement->id,
                    'code'         => $requirement->code,
                    'title'        => $requirement->title,
                    'description'  => $requirement->description ?? '',
                    'questions'    => $questions,
                    'score'        => $reqScore,
                    'maturity_level' => $reqMaturity,
                    'answers_map'  => $answersMap,
                ];
            });

        return Inertia::render('GapAssessment/Results', [
            'assessment'   => [
                'id'                    => $assessment->id,
                'code'                  => $assessment->code,
                'name'                  => $assessment->name,
                'framework'             => $assessment->framework ? [
                    'code' => $assessment->framework->code,
                    'name' => $assessment->framework->name,
                ] : null,
                'overall_score'         => $assessment->score ?? 0,
                'overall_maturity_level'=> $assessment->maturity_level ?? 1,
            ],
            'requirements' => $requirements,
            'ml_result'    => session('ml_result'),
        ]);
    }

    public function mlPredict(Request $request)
    {
        $request->validate([
            'answers'              => 'required|array',
            'answers.*.question_id'=> 'required|integer',
            'answers.*.answer'     => 'required|integer|min:0|max:4',
            'questions'            => 'required|array',
        ]);

        $answersById   = collect($request->answers)->pluck('answer', 'question_id')->toArray();
        $orderedAnswers = [];
        foreach ($request->questions as $q) {
            $orderedAnswers[] = $answersById[$q['id']] ?? 0;
        }

        $avg   = empty($orderedAnswers) ? 0 : array_sum($orderedAnswers) / count($orderedAnswers);
        $score = round(($avg / 4) * 100, 2);
        $level = max(1, min(5, (int) round($avg) + 1));

        return response()->json([
            'maturity_level'  => $level,
            'weighted_score'  => $score,
            'probabilities'   => [],
            'source'          => 'rule_based',
            'confidence'      => 0.8,
        ]);
    }

    public function mlAnalyze(Request $request)
    {
        $request->validate([
            'requirement_code'    => 'required|string',
            'requirement_title'   => 'required|string',
            'maturity_level'      => 'required|integer',
            'score'               => 'required|numeric',
            'gap'                 => 'required|integer',
            'answers'             => 'required|array',
            'requirements_detail' => 'nullable|array',
        ]);

        $globalLevel = (int) $request->maturity_level;
        $globalScore = round((float) $request->score, 1);
        $gap         = (int) $request->gap;
        $details     = collect($request->requirements_detail ?? []);

        if ($details->isEmpty()) {
            $details = collect([[
                'code'           => $request->requirement_code,
                'title'          => $request->requirement_title,
                'score'          => $globalScore,
                'maturity_level' => $globalLevel,
            ]]);
        }

        $reqParts = $details->map(
            fn($r) => "{$r['code']} at Level {$r['maturity_level']} (" . round($r['score'], 1) . "%)"
        )->join(', ');

        $summary = "Overall maturity is Level {$globalLevel} ({$globalScore}%). "
            . "Requirements: {$reqParts}. "
            . ($gap > 0
                ? "Focus on reaching Level " . ($globalLevel + 1) . " through the actions below."
                : "All requirements have reached maximum maturity — maintain and sustain.");

        $answerToLabel = function ($val) {
            if (is_string($val)) {
                return match (strtoupper($val)) {
                    'YES'     => 'YES',
                    'MANAGED' => 'MANAGED',
                    'PARTIAL' => 'PARTIAL',
                    'BASIC'   => 'BASIC',
                    default   => 'NO',
                };
            }
            return match ((int) $val) {
                0       => 'NO',
                1       => 'BASIC',
                2       => 'PARTIAL',
                3       => 'MANAGED',
                4       => 'YES',
                default => 'NO',
            };
        };

        $answers       = $request->answers ?? [];
        $dimensionKeys = ['Existence', 'Formalization', 'Enforcement', 'Measurement', 'Optimization'];

        if (array_is_list($answers)) {
            $namedAnswers = [];
            foreach ($answers as $i => $val) {
                if (isset($dimensionKeys[$i])) {
                    $namedAnswers[$dimensionKeys[$i]] = $val;
                }
            }
            $answers = $namedAnswers;
        }

        $noDims      = [];
        $basicDims   = [];
        $partialDims = [];
        $managedDims = [];
        $yesDims     = [];

        foreach ($answers as $dimension => $val) {
            $label = $answerToLabel($val);
            match ($label) {
                'NO'      => $noDims[]      = $dimension,
                'BASIC'   => $basicDims[]   = $dimension,
                'PARTIAL' => $partialDims[] = $dimension,
                'MANAGED' => $managedDims[] = $dimension,
                'YES'     => $yesDims[]     = $dimension,
                default   => null,
            };
        }

        $currentIssues = [];

        foreach ($details as $req) {
            $lvl   = (int) $req['maturity_level'];
            $code  = $req['code'];
            $score = round($req['score'], 1);

            if ($lvl <= 1) {
                $currentIssues[] = "Critical: {$code} has no formal processes in place ({$score}%) — immediate action required.";
            } elseif ($lvl === 2) {
                $currentIssues[] = "Critical: {$code} relies on ad-hoc practices ({$score}%) — documentation and structure needed.";
            } elseif ($lvl === 3) {
                $currentIssues[] = "Confirmed: {$code} has defined processes ({$score}%) — focus on measurement and enforcement.";
            } elseif ($lvl === 4) {
                $currentIssues[] = "Confirmed: {$code} is well managed ({$score}%) — optimization is the next step.";
            } else {
                $currentIssues[] = "Confirmed: {$code} is fully optimized ({$score}%) — sustain and continuously improve.";
            }
        }

        if (!empty($noDims))      $currentIssues[] = "Critical gaps in: " . implode(', ', $noDims) . " — not implemented, immediate action required.";
        if (!empty($partialDims)) $currentIssues[] = "Partial implementation in: " . implode(', ', $partialDims) . " — requires formalization and enforcement.";
        if (!empty($managedDims)) $currentIssues[] = "Well managed in: " . implode(', ', $managedDims) . " — focus on continuous improvement.";
        if (!empty($yesDims))     $currentIssues[] = "Confirmed strengths in: " . implode(', ', $yesDims) . " — fully optimized, maintain and leverage.";

        $allCodes      = $details->pluck('code')->join(', ');
        $criticalCodes = $details->filter(fn($r) => (int) $r['maturity_level'] <= 2)->pluck('code')->join(', ');
        $weakCodes     = $details->filter(fn($r) => (int) $r['maturity_level'] <= 3)->pluck('code')->join(', ');

        $l2Actions = $criticalCodes ? [
            "Draft an initial policy specifically for: {$criticalCodes}.",
            "Define the scope, assets, and stakeholders for {$criticalCodes}.",
            "Implement basic manual controls and workarounds for {$criticalCodes}.",
            "Communicate baseline rules and expectations to the team.",
        ] : [
            "Review and consolidate existing policies across {$allCodes}.",
            "Ensure all basic controls are consistently documented.",
        ];

        $l3Actions = $criticalCodes ? [
            "Formalize and get management sign-off on the {$criticalCodes} policy.",
            "Document step-by-step procedures and assign responsibilities for {$criticalCodes}.",
            "Implement technical or administrative enforcement controls for {$criticalCodes}.",
            "Train all relevant staff on the approved {$criticalCodes} procedures.",
        ] : [
            "Standardize and formalize all existing procedures across {$allCodes}.",
            "Ensure management approval and staff training for all policies.",
        ];

        $l4Actions = $weakCodes ? [
            "Define KPIs and compliance metrics for: {$weakCodes}.",
            "Establish periodic review cycles (monthly or quarterly) for {$weakCodes}.",
            "Implement dashboards to track compliance posture across {$allCodes}.",
            "Address deviations through a formal corrective-action process.",
        ] : [
            "Refine existing KPIs and add predictive metrics across {$allCodes}.",
            "Automate periodic reviews and reporting.",
        ];

        $l5Actions = [
            "Automate compliance checks and alerting across {$allCodes}.",
            "Use predictive analytics to anticipate and prevent gaps.",
            "Integrate continuous feedback loops from audits and incidents.",
            "Benchmark against industry peers and update controls accordingly.",
        ];

        $dimActions     = [];
        $specificByDim  = [
            'Existence'     => 'Formally establish that controls exist and are recognized',
            'Formalization' => 'Document, get management approval, and communicate procedures',
            'Enforcement'   => 'Implement technical controls to enforce compliance',
            'Measurement'   => 'Define KPIs and track effectiveness metrics regularly',
            'Optimization'  => 'Create feedback loops for continuous improvement',
        ];

        foreach ($noDims as $dim) {
            if (isset($specificByDim[$dim])) {
                $dimActions[] = "[{$dim}] {$specificByDim[$dim]}";
            }
        }

        $nextLevel = $globalLevel + 1;

        $stepsDef = [
            1 => ['label' => 'Initial',    'actions' => []],
            2 => ['label' => 'Basic',      'actions' => $l2Actions],
            3 => ['label' => 'Defined',    'actions' => $l3Actions],
            4 => ['label' => 'Managed',    'actions' => $l4Actions],
            5 => ['label' => 'Optimized',  'actions' => $l5Actions],
        ];

        if (isset($stepsDef[$nextLevel]) && !empty($dimActions)) {
            $stepsDef[$nextLevel]['actions'] = array_merge(
                $stepsDef[$nextLevel]['actions'],
                $dimActions
            );
        }

        $subtitles = [
            1 => 'Ad-hoc, undocumented',
            2 => 'Ad-hoc practices',
            3 => 'Documented & approved',
            4 => 'Measured & monitored',
            5 => 'Continuously improved',
        ];

        $roadmap = [];
        foreach ($stepsDef as $lvl => $step) {
            $isCompleted = $lvl < $globalLevel;
            $isCurrent   = $lvl === $globalLevel;
            $isNext      = $lvl === $globalLevel + 1;
            $status      = $isCompleted ? 'completed' : ($isCurrent ? 'current' : 'todo');

            $roadmap[] = [
                'level'      => $lvl,
                'label'      => $step['label'],
                'subtitle'   => $isCompleted ? '' : $subtitles[$lvl],
                'status'     => $status,
                'actions'    => $isCompleted ? [] : $step['actions'],
                'is_current' => $isCurrent,
                'is_next'    => $isNext,
            ];
        }

        return response()->json([
            'summary'        => $summary,
            'current_issues' => $currentIssues,
            'roadmap'        => $roadmap,
        ]);
    }
}