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

class GapAssessmentController extends Controller
{
    public function __construct(protected GapAssessmentService $service) {}

    /**
     * Page principale Gap Assessment
     */
    public function index()
    {
        $user    = Auth::user();
        $orgId   = $user->current_organization_id;

        $requirements = Requirement::where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->where('status', 'active')
            ->with('framework:id,code,name')
            ->select('id', 'code', 'title', 'framework_id', 'priority')
            ->orderBy('code')
            ->get()
            ->map(fn($r) => [
                'id'        => $r->id,
                'code'      => $r->code,
                'title'     => $r->title,
                'priority'  => $r->priority,
                'framework' => $r->framework
                    ? ['code' => $r->framework->code, 'name' => $r->framework->name]
                    : null,
                // Dernier assessment si existe
                'last_assessment' => GapAssessment::where('requirement_id', $r->id)
                    ->latest()
                    ->select('score', 'maturity_level', 'created_at')
                    ->first(),
            ]);

        return Inertia::render('GapAssessment/Index', [
            'requirements' => $requirements,
        ]);
    }

    // GapAssessmentController.php
public function getQuestions(Requirement $requirement)
{
    $existing = $requirement->gapQuestions()
        ->orderBy('order')
        ->get();

    // إذا موجودين في DB → ارجعهم مباشرة
    if ($existing->count() >= 5) {
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

    // مافيهمش → اطلب من AI
    $generated = $this->service->generateQuestionsViaAI($requirement);

    // خزّنهم في DB للمرة الجاية
    foreach ($generated as $q) {
        GapQuestion::create([
            'requirement_id' => $requirement->id,
            'text'           => $q['text'],
            'dimension'      => $q['dimension'],
            'weight'         => $q['weight'],
            'order'          => $q['order'],
        ]);
    }

    return response()->json([
        'requirement' => [
            'id'    => $requirement->id,
            'code'  => $requirement->code,
            'title' => $requirement->title,
        ],
        'questions' => $requirement->gapQuestions()
            ->orderBy('order')->get(),
        'source'    => 'ai_generated',
    ]);
}

    /**
     * Soumettre les réponses → calculer → sauvegarder
     */
    public function store(Request $request)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        $request->validate([
            'requirement_id' => 'required|exists:requirements,id',
            'answers'        => 'required|array',
            'answers.*'      => 'in:YES,PARTIAL,NO',
        ]);

        $requirement = Requirement::where('id', $request->requirement_id)
            ->where('organization_id', $orgId)
            ->firstOrFail();

        $result = $this->service->calculate($requirement, $request->answers);

        $assessment = GapAssessment::create([
            'requirement_id' => $requirement->id,
            'score'          => $result['score'],
            'maturity_level' => $result['maturity_level'],
            'answers'        => $request->answers,
            'ai_feedback'    => null, // généré séparément
        ]);

        return response()->json([
            'assessment_id'  => $assessment->id,
            'score'          => $result['score'],
            'maturity_level' => $result['maturity_level'],
            'raw_level'      => $result['raw_level'],
            'gate_capped'    => $result['gate_capped'],
            'gate_cap'       => $result['gate_cap'],
        ]);
    }

    /**
     * Générer l'AI feedback pour un assessment existant
     */
    public function generateAiFeedback(GapAssessment $assessment)
    {
        // Le call API Claude est fait depuis le frontend (artifact)
        // Ici on sauvegarde le feedback généré
        request()->validate(['feedback' => 'required|string|max:2000']);

        $assessment->update(['ai_feedback' => request('feedback')]);

        return response()->json(['success' => true]);
    }

    public function show(GapAssessment $assessment)
    {
        return response()->json(
            $assessment->load('requirement:id,code,title')
        );
    }

    public function byRequirement($requirementId)
    {
        return response()->json(
            GapAssessment::where('requirement_id', $requirementId)
                ->latest()
                ->get()
        );
    }
    
}