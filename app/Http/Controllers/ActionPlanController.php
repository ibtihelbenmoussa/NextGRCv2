<?php

namespace App\Http\Controllers;

use App\Models\ActionPlan;
use App\Models\GapAssessment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActionPlanController extends Controller
{
    // ─── Valid status transitions ───────────────────────────────────────────────
    // Only forward transitions are allowed:
    //   open → in_progress → done
    // Going backward (e.g. done → open) is blocked intentionally.
    private const ALLOWED_TRANSITIONS = [
        'open'        => ['in_progress'],
        'in_progress' => ['done'],
        'done'        => [],          // terminal state
    ];

    // ─── Overdue scope helper ───────────────────────────────────────────────────
    // "Overdue" means: not done AND due_date is strictly before today midnight.
    // We avoid whereDate() / DATE() wrappers so the DB can use an index on due_date.
    private function applyOverdueScope($query)
    {
        return $query->where('status', '!=', 'done')
                     ->where('due_date', '<', now()->startOfDay());
    }

    // ─── index ─────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = ActionPlan::with(['gap.requirement', 'assignee']);

        // ── Status filter ──
        if ($status = $request->input('status')) {
            $statuses = array_filter(explode(',', $status));
            if (!empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }

        // ── Search ──
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas(
                      'gap.requirement',
                      fn($r) => $r->where('title', 'like', "%{$search}%")
                                  ->orWhere('code',  'like', "%{$search}%")
                  );
            });
        }

        // ── Sorting ──
        $allowedSorts = ['title', 'status', 'due_date', 'created_at'];
        if ($sort = $request->input('sort')) {
            $desc   = str_starts_with($sort, '-');
            $column = ltrim($sort, '-');
            if (in_array($column, $allowedSorts)) {
                $query->orderBy($column, $desc ? 'desc' : 'asc');
            }
        } else {
            // Overdue rows first, then most recent
            $query->orderByRaw("
                CASE
                    WHEN status != 'done' AND due_date < CURDATE() THEN 0
                    ELSE 1
                END
            ")->latest();
        }

        // ── Pagination ──
        $perPage = in_array((int) $request->input('per_page', 15), [10, 15, 20, 30, 50])
            ? (int) $request->input('per_page', 15)
            : 15;

        $actionPlans = $query->paginate($perPage)->withQueryString();

        $users = User::select('id', 'name')->orderBy('name')->get();

        // ── Global KPIs (not paginated — counts across ALL records) ──
        // These are returned to the frontend so KPI cards reflect reality,
        // not just the current page.
        $globalStats = [
            'total'       => ActionPlan::count(),
            'open'        => ActionPlan::where('status', 'open')->count(),
            'in_progress' => ActionPlan::where('status', 'in_progress')->count(),
            'done'        => ActionPlan::where('status', 'done')->count(),
            'overdue'     => $this->applyOverdueScope(ActionPlan::query())->count(),
        ];

        return Inertia::render('ActionPlans/Index', [
            'actionPlans' => $actionPlans,
            'users'       => $users,
            'globalStats' => $globalStats,
        ]);
    }

    // ─── store ─────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'gap_id'      => 'required|exists:gap_assessments,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:users,id',
            'due_date'    => 'required|date|after_or_equal:today',
            'status'      => 'in:open,in_progress,done',
        ]);

        // New plans always start as "open" regardless of what was sent.
        $validated['status'] = 'open';

        ActionPlan::create($validated);

        return back()->with('success', 'Action plan created successfully.');
    }

    // ─── update ────────────────────────────────────────────────────────────────
    public function update(Request $request, ActionPlan $actionPlan)
    {
        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'sometimes|required|exists:users,id',
            'due_date'    => 'sometimes|required|date',
            'status'      => 'sometimes|required|in:open,in_progress,done',
        ]);

        // ── Enforce transition rules when status is being changed ──
        if (isset($validated['status']) && $validated['status'] !== $actionPlan->status) {
            $allowed = self::ALLOWED_TRANSITIONS[$actionPlan->status] ?? [];

            if (!in_array($validated['status'], $allowed)) {
                return back()->withErrors([
                    'status' => "Cannot transition from \"{$actionPlan->status}\" to \"{$validated['status']}\". "
                              . 'Allowed: ' . (empty($allowed) ? 'none (terminal state)' : implode(', ', $allowed)),
                ]);
            }
        }

        $actionPlan->update($validated);

        // ── Auto-close the parent gap if all its action plans are done ──
        $this->syncGapStatus($actionPlan->gap_id);

        return back()->with('success', 'Action plan updated successfully.');
    }

    // ─── destroy ───────────────────────────────────────────────────────────────
    public function destroy(ActionPlan $actionPlan)
    {
        $gapId = $actionPlan->gap_id;

        $actionPlan->delete();

        // Re-evaluate gap status after deletion
        $this->syncGapStatus($gapId);

        return back()->with('success', 'Action plan deleted.');
    }

    // ─── syncGapStatus ─────────────────────────────────────────────────────────
    // Automatically sets the parent gap's status based on its action plans:
    //   • All done      → closed
    //   • Any in_progress (and none overdue) → in_progress
    //   • Any overdue   → overdue  (if your GapAssessment model supports it)
    //   • Otherwise     → open
    //
    // Adjust the status strings below to match your GapAssessment::status enum.
    private function syncGapStatus(int $gapId): void
    {
        $gap   = GapAssessment::find($gapId);
        if (!$gap) return;

        $plans = ActionPlan::where('gap_id', $gapId)->get();

        if ($plans->isEmpty()) {
            // No plans left — leave gap status unchanged (or set to 'open' if preferred)
            return;
        }

        $allDone      = $plans->every(fn($p) => $p->status === 'done');
        $anyOverdue   = $plans->contains(
            fn($p) => $p->status !== 'done' && $p->due_date && $p->due_date->lt(now()->startOfDay())
        );
        $anyInProgress = $plans->contains(fn($p) => $p->status === 'in_progress');

        $newStatus = match (true) {
            $allDone      => 'closed',
            $anyOverdue   => 'overdue',    // remove this line if GapAssessment has no "overdue" status
            $anyInProgress => 'in_progress',
            default       => 'open',
        };

        $gap->update(['status' => $newStatus]);
    }
}