<?php

namespace App\Http\Controllers;
use App\Models\GapAssessment;
use App\Models\Requirement; 

use Illuminate\Http\Request;
use Inertia\Inertia;
class GapAssessmentController extends Controller
{
  public function store(Request $request)
{
    $validated = $request->validate([
        'requirement_id' => 'required|exists:requirements,id',
        'current_state' => 'nullable|string',
        'expected_state' => 'nullable|string',
        'gap_description' => 'nullable|string',
        'score' => 'nullable|integer|min:0|max:100',
        'recommendation' => 'nullable|string',
    ]);

    // 🔥 AUTO CALC compliance_level
    $score = $validated['score'] ?? 0;

    if ($score >= 75) {
        $validated['compliance_level'] = 'compliant';
    } elseif ($score >= 40) {
        $validated['compliance_level'] = 'partial';
    } else {
        $validated['compliance_level'] = 'non_compliant';
    }

    GapAssessment::create($validated);

    return redirect()->route('gapassessment.index')
        ->with('success', 'Gap assessment created');
}
// GapAssessmentController
public function index()
{
    $search = request('search');

    $gapAssessments = GapAssessment::with('requirement')
        ->when($search, function ($query) use ($search) {
            $query->whereHas('requirement', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(15)
        ->withQueryString();

    return Inertia::render('GapAssessment/Index', [
        'gapAssessments' => $gapAssessments,
        'filters' => [
            'search' => $search
        ],
    ]);
}

public function create() {
    return Inertia::render('GapAssessment/Create', [
        'requirements' => Requirement::select('id', 'title', 'code')->get(),
    ]);
}
}
