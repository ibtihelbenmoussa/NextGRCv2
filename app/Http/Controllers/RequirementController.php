<?php

namespace App\Http\Controllers;

use App\Models\Requirement;
use App\Models\RequirementTest;
use App\Models\Framework;
use App\Models\Process;
use App\Models\Tag;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RequirementsExport;
use Carbon\Carbon;

class RequirementController extends Controller
{


    public function index(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 30, 50]) ? $perPage : 10;

        $query = Requirement::where('organization_id', $currentOrgId)
            ->where('is_deleted', 0)
            ->with(['framework', 'process','tags']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('filter.status')) {
            $query->where('status', $request->input('filter.status'));
        }

        if ($request->filled('filter.type') && $request->input('filter.type') !== 'all') {
            $query->where('type', $request->input('filter.type'));
        }

        if ($request->filled('filter.priority') && $request->input('filter.priority') !== 'all') {
            $query->where('priority', $request->input('filter.priority'));
        }

        if ($request->filled('sort')) {
            $sort = $request->sort;
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $column = ltrim($sort, '-');
            $allowed = ['code', 'title', 'type', 'status', 'priority', 'deadline', 'created_at'];
            if (in_array($column, $allowed)) {
                $query->orderBy($column, $direction);
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $requirements = $query->paginate($perPage)->withQueryString();

        $statsQuery = Requirement::where('organization_id', $currentOrgId)
            ->where('is_deleted', 0)
            ->selectRaw('priority, COUNT(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority')
            ->toArray();

        $total = array_sum($statsQuery);
        $lowCount = $statsQuery['low'] ?? 0;
        $mediumCount = $statsQuery['medium'] ?? 0;
        $highCount = $statsQuery['high'] ?? 0;

        $requirements->through(function ($req) {
            return [
                'id' => $req->id,
                'code' => $req->code,
                'title' => $req->title,
                'description' => $req->description,
                'type' => $req->type,
                'status' => $req->status,
                'priority' => $req->priority,
                'frequency' => $req->frequency,
                'framework' => $req->framework ? [
                    'code' => $req->framework->code,
                    'name' => $req->framework->name,
                ] : null,
                'process' => $req->process ? ['name' => $req->process->name] : null,
                'owner_id' => $req->owner_id,
                'tags' => $req->tags,
                'deadline' => $req->deadline,
                'completion_date' => $req->completion_date,
                'compliance_level' => $req->compliance_level,
                'attachments' => $req->attachments,
                'created_at' => $req->created_at,
                'updated_at' => $req->updated_at,
            ];
        });

        return Inertia::render('Requirements/Index', [
            'requirements' => $requirements,
            'stats' => [
                'total' => $total,
                'lowCount' => $lowCount,
                'mediumCount' => $mediumCount,
                'highCount' => $highCount,
                'lowPercent' => $total > 0 ? round(($lowCount / $total) * 100) : 0,
                'mediumPercent' => $total > 0 ? round(($mediumCount / $total) * 100) : 0,
                'highPercent' => $total > 0 ? round(($highCount / $total) * 100) : 0,
            ],
        ]);
    }
    public function create()
    {
        return Inertia::render('Requirements/Create', [
            'frameworks' => Framework::select('id', 'code', 'name')->get(),
            'processes' => Process::select('id', 'name')->get(),
            'tags' => Tag::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            abort(403, 'No organization selected.');
        }

        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:requirements,code',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:regulatory,internal,contractual',
            'status' => 'required|in:active,draft,archived',
            'priority' => 'required|in:low,medium,high',
            'frequency' => 'required|in:one_time,daily,weekly,monthly,quarterly,yearly,continuous',
            'framework_id' => 'required|exists:frameworks,id',
            'process_id' => 'nullable|exists:processes,id',
            'deadline' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'compliance_level' => 'required|in:Mandatory,Recommended,Optional',
            'attachments' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'integer|exists:tags,id',
            'auto_validate' => 'boolean',
        ]);

        $requirement = Requirement::create([
            'code' => $validated['code'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'frequency' => $validated['frequency'],
            'framework_id' => $validated['framework_id'],
            'process_id' => $validated['process_id'] ?? null,
            'owner_id' => $user->id,
            'deadline' => $validated['deadline'] ?? null,
            'completion_date' => $validated['completion_date'] ?? null,
            'compliance_level' => $validated['compliance_level'],
            'attachments' => $validated['attachments'] ?? null,
            'organization_id' => $currentOrgId,
            'auto_validate' => $validated['auto_validate'] ?? false,
        ]);

        $requirement->tags()->sync($validated['tags'] ?? []);

        return redirect()->route('requirements.index')
            ->with('success', 'Requirement created successfully.');
    }

    public function show(Requirement $requirement)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $requirement->load('tags', 'framework', 'process');

        return Inertia::render('Requirements/Show', [
            'requirement' => $requirement,
        ]);
    }

    public function edit(Requirement $requirement)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $requirement->load('tags');

        return Inertia::render('Requirements/Edit', [
            'requirement' => $requirement,
            'frameworks' => Framework::where('organization_id', $currentOrgId)
                ->select('id', 'code', 'name')->get(),
            'processes' => Process::select('id', 'name')->get(),
            'tags' => Tag::where('organization_id', $currentOrgId)
                ->select('id', 'name')->get(),
            'selectedTagIds' => $requirement->tags->pluck('id')
                ->map(fn($id) => (string) $id)->toArray(),
        ]);
    }

    public function update(Request $request, Requirement $requirement)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:255|unique:requirements,code,' . $requirement->id,
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|required|in:regulatory,internal,contractual',
            'status' => 'sometimes|required|in:active,draft,archived',
            'priority' => 'sometimes|required|in:low,medium,high',
            'frequency' => 'sometimes|required|in:one_time,daily,weekly,monthly,quarterly,yearly,continuous',
            'framework_id' => 'sometimes|required|exists:frameworks,id',
            'process_id' => 'sometimes|nullable|exists:processes,id',
            'deadline' => 'sometimes|nullable|date',
            'completion_date' => 'sometimes|nullable|date',
            'compliance_level' => 'sometimes|required|in:Mandatory,Recommended,Optional',
            'attachments' => 'sometimes|nullable|string',
            'tags' => 'sometimes|nullable|array',
            'tags.*' => 'integer|exists:tags,id',
            'auto_validate' => 'sometimes|boolean',
        ]);

        $tags = $validated['tags'] ?? [];
        unset($validated['tags']);

        $requirement->update($validated);
        $requirement->tags()->sync($tags);

        return back()->with('success', 'Requirement updated successfully.');
    }

    public function destroy(Requirement $requirement)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId) {
            abort(403, 'Unauthorized');
        }

        $requirement->is_deleted = 1;
        $requirement->save();

        return redirect()->route('requirements.index')
            ->with('success', 'Requirement deleted successfully.');
    }

    public function export(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            abort(403, 'Please select an organization first.');
        }

        $query = Requirement::where('organization_id', $currentOrgId)
            ->where('is_deleted', 0)
            ->with(['framework', 'process', 'tags']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $requirements = $query->get();
        $requirements->each(function ($req) {
            $req->tags_names = $req->tags->pluck('name')->toArray();
        });

        return Excel::download(
            new RequirementsExport($requirements),
            'requirements-' . now()->format('Y-m-d-His') . '.xlsx'
        );
    }

    private function getRequirementIdsForDate(int $orgId, Carbon $date): \Illuminate\Support\Collection
    {
        return Requirement::query()
            ->where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->where(function ($q) use ($date) {
                $q
                    ->whereHas(
                        'tests',
                        fn($sub) =>
                        $sub->whereDate('test_date', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'one_time')
                            ->whereDate('deadline', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'daily')
                            ->whereDate('deadline', '<=', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'weekly')
                            ->whereRaw('DAYOFWEEK(deadline) = ?', [$date->dayOfWeek + 1])
                            ->whereDate('deadline', '<=', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'monthly')
                            ->whereRaw('DAY(deadline) = ?', [$date->day])
                            ->whereDate('deadline', '<=', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'quarterly')
                            ->whereRaw('DAY(deadline) = ?', [$date->day])
                            ->whereRaw('MOD(MONTH(deadline), 3) = MOD(?, 3)', [$date->month])
                            ->whereDate('deadline', '<=', $date)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'yearly')
                            ->whereRaw('DAY(deadline) = ?', [$date->day])
                            ->whereRaw('MONTH(deadline) = ?', [$date->month])
                            ->whereDate('deadline', '<=', $date)
                    )
                    ->orWhere('frequency', 'continuous');
            })
            ->pluck('id');
    }

    /**
     * Calcule tous les KPIs pour une date donnée en une seule passe.
     *
     * On récupère les IDs une seule fois, puis on fait 3 COUNT ciblés
     * sur requirement_tests. Pas de N+1, pas de duplication.
     *
     * @return array{
     *   reqIds: \Illuminate\Support\Collection,
     *   total: int,
     *   completed: int,
     *   pending: int,
     *   missed: int,
     *   due: int,
     *   completionRate: int,
     * }
     */
    private function computeKpisForDate(int $orgId, Carbon $date): array
    {
        $reqIds = $this->getRequirementIdsForDate($orgId, $date);
        $total = $reqIds->count();

        $testCounts = $total > 0
            ? RequirementTest::whereIn('requirement_id', $reqIds)
                ->whereDate('test_date', $date)
                ->selectRaw('validation_status, COUNT(*) as count')
                ->groupBy('validation_status')
                ->pluck('count', 'validation_status')
                ->toArray()
            : [];

        $completed = (int) ($testCounts['accepted'] ?? 0);
        $pending = (int) ($testCounts['pending'] ?? 0);


        $missed = Requirement::where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->where('frequency', '!=', 'one_time')
            ->whereDate('deadline', '<', $date)
            ->whereDoesntHave(
                'tests',
                fn($q) =>
                $q->whereDate('test_date', $date)
            )
            ->count();

        $due = Requirement::where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->whereDate('deadline', $date)
            ->whereDoesntHave(
                'tests',
                fn($q) =>
                $q->whereDate('test_date', $date)
            )
            ->count();

        return [
            'reqIds' => $reqIds,
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'missed' => $missed,
            'due' => $due,
            'completionRate' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
        ];
    }

    public function getRequirementsForTesting(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            abort(403, 'No organization selected.');
        }

        $dateStr = $request->query('date', today()->format('Y-m-d'));
        try {
            $targetDate = Carbon::parse($dateStr)->startOfDay();
        } catch (\Exception $e) {
            $targetDate = Carbon::today()->startOfDay();
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = in_array($perPage, [10, 15, 20, 30, 50]) ? $perPage : 15;
        $search = trim($request->query('search', ''));


        $query = Requirement::query()
            ->where('organization_id', $currentOrgId)
            ->where('is_deleted', 0)
            ->with([
                'framework:id,code,name',
                'process:id,name',
                'tags:id,name',
                'tests' => function ($q) use ($targetDate) {
                    $q->whereDate('test_date', $targetDate)
                        ->latest('created_at')
                        ->limit(1)
                        ->select([
                            'id',
                            'requirement_id',
                            'validation_status',
                            'validation_comment',
                            'test_date',
                            'created_at',
                        ]);
                },
            ])
            ->where(function ($q) use ($targetDate) {
                $q
                    ->whereHas(
                        'tests',
                        fn($sub) =>
                        $sub->whereDate('test_date', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'one_time')
                            ->whereDate('deadline', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'daily')
                            ->whereDate('deadline', '<=', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'weekly')
                            ->whereRaw('DAYOFWEEK(deadline) = ?', [$targetDate->dayOfWeek + 1])
                            ->whereDate('deadline', '<=', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'monthly')
                            ->whereRaw('DAY(deadline) = ?', [$targetDate->day])
                            ->whereDate('deadline', '<=', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'quarterly')
                            ->whereRaw('DAY(deadline) = ?', [$targetDate->day])
                            ->whereRaw('MOD(MONTH(deadline), 3) = MOD(?, 3)', [$targetDate->month])
                            ->whereDate('deadline', '<=', $targetDate)
                    )
                    ->orWhere(
                        fn($q2) =>
                        $q2->where('frequency', 'yearly')
                            ->whereRaw('DAY(deadline) = ?', [$targetDate->day])
                            ->whereRaw('MONTH(deadline) = ?', [$targetDate->month])
                            ->whereDate('deadline', '<=', $targetDate)
                    )
                    ->orWhere('frequency', 'continuous');
            });

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('sort')) {
            $sort = $request->sort;
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $column = ltrim($sort, '-');
            $allowed = ['code', 'title', 'frequency', 'deadline'];
            $query->orderBy(in_array($column, $allowed) ? $column : 'code', $direction);
        } else {
            $query->orderBy('code');
        }

        $requirements = $query->paginate($perPage)->withQueryString();

        $requirements->through(function (Requirement $req) {
            $latestTest = $req->tests->first();
            $req->latest_test_status = $latestTest?->validation_status ?? null;
            $req->latest_test_comment = $latestTest?->validation_comment ?? null;
            $req->latest_test_id = $latestTest?->id ?? null;
            return $req;
        });


        $kpis = $this->computeKpisForDate($currentOrgId, $targetDate);

        return Inertia::render('RequirementTests/Index', [
            'requirements' => $requirements,
            'date' => $targetDate->format('Y-m-d'),
            'isToday' => $targetDate->isToday(),
            'filters' => $request->only(['search', 'date']),
            'missedToday' => $kpis['missed'],
            'dueToday' => $kpis['due'],
            'kpi' => [
                'total' => $kpis['total'],
                'completed' => $kpis['completed'],
                'pending' => $kpis['pending'],
                'overdue' => $kpis['missed'],
                'completionRate' => $kpis['completionRate'],
            ],
        ]);
    }
}