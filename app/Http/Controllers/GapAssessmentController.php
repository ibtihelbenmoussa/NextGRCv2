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
            ->latest()
            ->get()
            ->map(fn($a) => [
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
                'questions_count' => $a->assessmentRequirements()
                    ->with('requirement.gapQuestions')
                    ->get()
                    ->sum(fn($ar) => $ar->requirement->gapQuestions->count()),
                // ← Ajoute ça
                'requirements' => $a->assessmentRequirements()
                    ->with(['requirement' => fn($q) => $q->withCount('gapQuestions')])
                    ->get()
                    ->map(fn($ar) => [
                        'id' => $ar->requirement->id,
                        'code' => $ar->requirement->code,
                        'title' => $ar->requirement->title,
                        'questions_count' => $ar->requirement->gap_questions_count,
                    ]),
            ]);

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
                                // ✅ orderBy('id') au lieu de orderBy('order')
                                $gq->select('id', 'requirement_id', 'text')->orderBy('id');
                            }
                        ])
                        ->withCount('gapAssessmentRequirements');
                }
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
        // ✅ orderBy('id') au lieu de orderBy('order')
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
                // ✅ firstOrCreate sur text uniquement, plus de 'order'
                GapQuestion::firstOrCreate(
                    [
                        'requirement_id' => $requirement->id,
                        'text' => $q['text'],
                    ],
                    [
                        'text' => $q['text'],
                    ]
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
            // ✅ orderBy('id') au lieu de orderBy('order')
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
        ;

        foreach ($request->requirement_ids as $reqId) {
            \App\Models\GapAssessmentRequirement::create([
                'gap_assessment_id' => $assessment->id,
                'requirement_id' => $reqId,
            ]);
        }
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
        return response()->json($assessment->load('requirement:id,code,title'));
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

        // ✅ supprimé : $order = $requirement->gapQuestions()->max('order') + 1;
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
    // ─── Answer Questions Page ────────────────────────────────────────────────────
public function answerQuestions(GapAssessment $assessment)
{
    $user = Auth::user();
    abort_if($assessment->organization_id !== $user->current_organization_id, 403);

    $requirements = $assessment->assessmentRequirements()
        ->with([
            'requirement' => fn($q) => $q->with([
                'gapQuestions' => fn($gq) => $gq->orderBy('id')
            ])
        ])
        ->get()
        ->map(fn($ar) => [
            'id'        => $ar->requirement->id,
            'code'      => $ar->requirement->code,
            'title'     => $ar->requirement->title,
            'questions' => $ar->requirement->gapQuestions->map(fn($q) => [
                'id'             => $q->id,
                'text'           => $q->text,
                'current_answer' => null,
                'current_note'   => null,
                'history'        => [],
            ]),
        ]);

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
public function storeAnswers(Request $request, GapAssessment $assessment)
{
    $user = Auth::user();
    abort_if($assessment->organization_id !== $user->current_organization_id, 403);

    $request->validate([
        'answers'                => 'required|array|min:1',
        'answers.*.question_id'  => 'required|exists:gap_questions,id',
        'answers.*.answer'       => 'required|in:YES,PARTIAL,NO',
        'answers.*.note'         => 'nullable|string|max:1000',
    ]);

    $scoreMap = ['YES' => 1.0, 'PARTIAL' => 0.5, 'NO' => 0.0];

    $totalScore = collect($request->answers)
        ->sum(fn($a) => $scoreMap[$a['answer']]);

    $scorePercent = round(($totalScore / count($request->answers)) * 100);

    $maturity = match(true) {
        $scorePercent < 20 => 1,
        $scorePercent < 40 => 2,
        $scorePercent < 60 => 3,
        $scorePercent < 80 => 4,
        default            => 5,
    };

    foreach ($request->answers as $a) {
        GapAssessmentAnswer::create([
            'gap_assessment_id' => $assessment->id,
            'gap_question_id'   => $a['question_id'],
            'answer'            => $a['answer'],
            'note'              => $a['note'] ?? null,
            'score'             => $scorePercent,
            'maturity_level'    => $maturity,
            'answered_at'       => now(),
        ]);
    }

    return redirect("/gap-assessments/{$assessment->id}/answer")
        ->with('success', 'Answers saved successfully.');
}
}