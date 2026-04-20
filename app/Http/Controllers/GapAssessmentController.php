<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use App\Models\GapAssessment;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GapAssessmentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        $query = GapAssessment::with('requirement')
            ->whereHas('requirement', fn($q) => $q->where('organization_id', $currentOrgId));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('requirement', function ($r) use ($search) {
                    $r->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            });
        }

        if ($complianceLevel = $request->input('compliance_level')) {
            $levels = array_filter(explode(',', $complianceLevel));
            if (!empty($levels)) {
                $query->whereIn('compliance_level', $levels);
            }
        }

        $allowedSorts = ['created_at', 'score', 'compliance_level'];

        if ($sort = $request->input('sort')) {
            $desc = str_starts_with($sort, '-');
            $column = ltrim($sort, '-');
            $query->orderBy(in_array($column, $allowedSorts) ? $column : 'created_at', $desc ? 'desc' : 'asc');
        } else {
            $query->latest();
        }

        $perPage = in_array((int) $request->input('per_page', 15), [10, 15, 20, 30, 50])
            ? (int) $request->input('per_page', 15)
            : 15;

        $gapAssessments = $query->paginate($perPage)->withQueryString();

        return Inertia::render('GapAssessment/Index', [
            'gapAssessments' => $gapAssessments,
            'filters' => $request->only(['search', 'compliance_level', 'sort', 'per_page']),
            'users' => \App\Models\User::select('id', 'name')->orderBy('name')->get(), 

        ]);
    }
    public function create()
    {
        return Inertia::render('GapAssessment/Create', [
            'requirements' => Requirement::select('id', 'title', 'code')->get(),
        ]);
    }

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

        $score = $validated['score'] ?? 0;

        $validated['compliance_level'] = match (true) {
            $score >= 75 => 'compliant',
            $score >= 40 => 'partial',
            default => 'non_compliant',
        };

        GapAssessment::create($validated);

        return redirect()->route('gapassessment.index')
            ->with('success', 'Gap assessment created successfully.');
    }

    public function show(GapAssessment $gapassessment)
    {
        return Inertia::render('GapAssessment/Show', [
            'gapAssessment' => $gapassessment->load('requirement'),
        ]);
    }

    public function edit(GapAssessment $gapassessment)
    {
        return Inertia::render('GapAssessment/Edit', [
            'gapAssessment' => $gapassessment->load('requirement'),
            'requirements' => Requirement::select('id', 'title', 'code')->get(),
        ]);
    }

    public function update(Request $request, GapAssessment $gapassessment)
    {
        $validated = $request->validate([
            'requirement_id' => 'required|exists:requirements,id',
            'current_state' => 'nullable|string',
            'expected_state' => 'nullable|string',
            'gap_description' => 'nullable|string',
            'score' => 'nullable|integer|min:0|max:100',
            'recommendation' => 'nullable|string',
        ]);

        $score = $validated['score'] ?? 0;

        $validated['compliance_level'] = match (true) {
            $score >= 75 => 'compliant',
            $score >= 40 => 'partial',
            default => 'non_compliant',
        };

        $gapassessment->update($validated);

        return redirect()->route('gapassessment.index')
            ->with('success', 'Gap assessment updated successfully.');
    }

    public function destroy(GapAssessment $gapassessment)
    {
        $gapassessment->delete();

        return redirect()->route('gapassessment.index')
            ->with('success', 'Gap assessment deleted successfully.');
    }
}