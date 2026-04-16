<?php

namespace App\Http\Controllers;

use App\Models\ActionPlan;
use App\Models\GapAssessment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActionPlanController extends Controller
{
    // ── Index : liste globale de toutes les actions ────────────

    public function index(Request $request)
    {
        $query = ActionPlan::with(['gap.requirement', 'assignee']);

        // Filtre par status (?status=open,in_progress)
        if ($status = $request->input('status')) {
            $statuses = array_filter(explode(',', $status));
            if (!empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }

        // Recherche (?search=...)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('gap.requirement', fn($r) =>
                      $r->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                  );
            });
        }

        // Tri ServerDataTable (?sort=-due_date)
        $allowedSorts = ['title', 'status', 'due_date', 'created_at'];
        if ($sort = $request->input('sort')) {
            $desc   = str_starts_with($sort, '-');
            $column = ltrim($sort, '-');
            if (in_array($column, $allowedSorts)) {
                $query->orderBy($column, $desc ? 'desc' : 'asc');
            }
        } else {
            $query->latest();
        }

        $actionPlans = $query
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        $users = User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('ActionPlans/Index', [
            'actionPlans' => $actionPlans,
            'users'       => $users,
        ]);
    }

    // ── Store : créer une action liée à un gap ────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'gap_id'      => [
                'required',
                'exists:gap_assessments,id',
            ],
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:users,id',
            'due_date'    => 'required|date|after_or_equal:today',
            'status'      => 'in:open,in_progress,done',
        ]);

        $validated['status'] = $validated['status'] ?? 'open';

        ActionPlan::create($validated);

        return back()->with('success', 'Action plan created successfully.');
    }

    // ── Update : changer le status ou autres champs ───────────

    public function update(Request $request, ActionPlan $actionPlan)
    {
        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'sometimes|required|exists:users,id',
            'due_date'    => 'sometimes|required|date',
            'status'      => 'sometimes|required|in:open,in_progress,done',
        ]);

        $actionPlan->update($validated);

        return back()->with('success', 'Action plan updated successfully.');
    }

    // ── Destroy ───────────────────────────────────────────────

    public function destroy(ActionPlan $actionPlan)
    {
        $actionPlan->delete();

        return back()->with('success', 'Action plan deleted.');
    }
}