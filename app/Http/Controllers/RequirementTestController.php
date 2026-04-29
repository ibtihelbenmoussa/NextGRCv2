<?php
// app/Http/Controllers/RequirementTestController.php

namespace App\Http\Controllers;

use App\Models\Requirement;
use App\Models\RequirementTest;
use App\Services\WorkingDayService;          // ← déjà importé ✅
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RequirementTestsExport;

class RequirementTestController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    //  Helper — avancer effective_date (working days)
    // ─────────────────────────────────────────────────────────────

    private function advanceEffectiveDate(Requirement $requirement): void
    {
        /** @var WorkingDayService $service */
        $service  = app(WorkingDayService::class);
        $nextDate = $service->nextEffectiveDate(
            Carbon::today(),
            $requirement->frequency,
            $requirement->organization_id
        );

        if ($nextDate) {
            $requirement->update(['effective_date' => $nextDate]);
        }
    }

  
  private function generateTestsForDate(Carbon $targetDate, int $organizationId): void
{
    /** @var WorkingDayService $service */
    $service = app(WorkingDayService::class);

    if (!$service->isWorkingDay($targetDate, $organizationId)) {
        return;
    }

    // Marquer overdue les tests pending passés
    RequirementTest::query()
        ->where('status', 'pending')
        ->whereDate('test_date', '<', Carbon::today())
        ->whereHas('requirement', fn ($q) =>
            $q->where('organization_id', $organizationId)->where('is_deleted', 0)
        )
        ->update(['status' => 'overdue']);

    $requirements = Requirement::query()
        ->where('organization_id', $organizationId)
        ->where('is_deleted', 0)
        ->where('status', 'active')
        ->get();

    foreach ($requirements as $requirement) {
        // Vérifier si ce requirement est dû à cette date selon sa fréquence
        if (!$this->isDueOnDate($requirement, $targetDate)) {
            continue;
        }

        $exists = RequirementTest::query()
            ->where('requirement_id', $requirement->id)
            ->whereDate('test_date', $targetDate)
            ->exists();

        if (!$exists) {
            RequirementTest::create([
                'requirement_id'    => $requirement->id,
                'framework_id'      => $requirement->framework_id,
                'user_id'           => Auth::id(),
                'test_date'         => $targetDate->toDateString(),
                'tested_at'         => null,
                'status'            => 'pending',
                'validation_status' => 'pending',
                'comment'           => null,
                'evidence'          => null,
            ]);
        }
    }
}

private function isDueOnDate(Requirement $requirement, Carbon $date): bool
{
    $effectiveDate = $requirement->effective_date
        ? Carbon::parse($requirement->effective_date)->startOfDay()
        : null;

    // Pas encore actif
    if ($effectiveDate && $effectiveDate->gt($date)) {
        return false;
    }

    return match ($requirement->frequency) {
        'daily'      => true, // chaque jour ouvrable
        'continuous' => true, // toujours visible
        'one_time'   => $effectiveDate && $effectiveDate->isSameDay($date),
        'weekly'     => $effectiveDate
                            && $effectiveDate->dayOfWeek === $date->dayOfWeek
                            && $effectiveDate->lte($date),
        'monthly'    => $effectiveDate
                            && $effectiveDate->day === $date->day
                            && $effectiveDate->lte($date),
        'quarterly'  => $effectiveDate
                            && $effectiveDate->day === $date->day
                            && ($date->month - $effectiveDate->month) % 3 === 0
                            && $effectiveDate->lte($date),
        'yearly'     => $effectiveDate
                            && $effectiveDate->day === $date->day
                            && $effectiveDate->month === $date->month
                            && $effectiveDate->lte($date),
        default      => false,
    };
}
    // ─────────────────────────────────────────────────────────────
    //  index
    // ─────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $this->authorize('viewAny', RequirementTest::class);

        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) abort(403, 'No organization selected.');

        $targetDate = Carbon::today();
        if ($date = $request->query('date')) {
            try { $targetDate = Carbon::parse($date)->startOfDay(); }
            catch (\Exception $e) { \Log::warning('Invalid date', ['date' => $date]); }
        }

        $this->generateTestsForDate($targetDate, $currentOrgId);

        $query = RequirementTest::query()
            ->with([
                'framework:id,code,name',
                'requirement:id,code,title,frequency,effective_date,framework_id,organization_id',
                'requirement.framework:id,code,name',
                'user:id,name',
            ])
            ->select(['id','requirement_id','framework_id','user_id','test_date',
                      'tested_at','status','validation_status','comment','evidence','created_at'])
            ->whereHas('requirement', fn ($q) =>
                $q->where('organization_id', $currentOrgId)->where('is_deleted', 0)
            )
            ->whereDate('test_date', $targetDate)
            ->latest('test_date');

        if ($search = trim($request->query('search', ''))) {
            $query->whereHas('requirement', fn ($q) =>
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
            );
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $tests = $query->paginate(15)->withQueryString();

        $allForDate = RequirementTest::query()
            ->whereDate('test_date', $targetDate)
            ->whereHas('requirement', fn ($q) =>
                $q->where('organization_id', $currentOrgId)->where('is_deleted', 0)
            );

        $kpis = [
            'total'         => (clone $allForDate)->count(),
            'compliant'     => (clone $allForDate)->where('status', 'compliant')->count(),
            'pending'       => (clone $allForDate)->where('status', 'pending')->count(),
            'overdue'       => (clone $allForDate)->where('status', 'overdue')->count(),
            'non_compliant' => (clone $allForDate)->where('status', 'non_compliant')->count(),
        ];

        return Inertia::render('RequirementTests/Index', [
            'tests'      => $tests,
            'filters'    => $request->only(['date', 'search', 'status']),
            'kpis'       => $kpis,
            'targetDate' => $targetDate->toDateString(),
            'canCreate'  => $user->can('create', RequirementTest::class),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  create / store
    // ─────────────────────────────────────────────────────────────

    public function create()
    {
        $this->authorize('create', RequirementTest::class);

        $requirements = Requirement::query()
            ->where('organization_id', Auth::user()->current_organization_id)
            ->where('is_deleted', 0)
            ->select('id', 'code', 'title', 'frequency', 'effective_date', 'framework_id')
            ->with('framework:id,code,name')
            ->orderBy('code')
            ->get();

        return Inertia::render('RequirementTests/Create', ['requirements' => $requirements]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', RequirementTest::class);

        $validated = $request->validate([
            'requirement_id' => ['required', 'exists:requirements,id'],
            'test_date'      => ['required', 'date'],
            'tested_at'      => ['nullable', 'date'],
            'status'         => ['required', 'in:compliant,non_compliant,partial,na,pending'],
            'comment'        => ['nullable', 'string', 'max:2000'],
            'evidence'       => ['nullable', 'array'],
            'evidence.*'     => ['nullable', 'string', 'max:2048'],
        ]);

        $requirement = Requirement::findOrFail($validated['requirement_id']);

        $alreadyExists = RequirementTest::query()
            ->where('requirement_id', $requirement->id)
            ->whereDate('test_date', Carbon::parse($validated['test_date']))
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors(['test_date' => 'A test already exists for this requirement on that date.']);
        }

        RequirementTest::create([
            'requirement_id'    => $requirement->id,
            'framework_id'      => $requirement->framework_id,
            'user_id'           => Auth::id(),
            'test_date'         => $validated['test_date'],
            'tested_at'         => $validated['tested_at'] ?? null,
            'status'            => $validated['status'],
            'validation_status' => $requirement->auto_validate ? 'accepted' : 'pending',
            'comment'           => $validated['comment'] ?? null,
            'evidence'          => $validated['evidence'] ?? null,
        ]);

        if ($requirement->auto_validate) {
            $this->advanceEffectiveDate($requirement);
        }

        return redirect()->route('requirement-tests.index')->with('success', 'Test created successfully.');
    }

    // ─────────────────────────────────────────────────────────────
    //  show
    // ─────────────────────────────────────────────────────────────

    public function show(RequirementTest $requirementTest)
    {
        $requirement  = $requirementTest->requirement;
        if (!$requirement) abort(404, 'Requirement not found for this test.');

        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $requirement->framework_name = $requirement->framework?->name;
        $requirement->process_name   = $requirement->process?->name;
        $requirement->load('tags');

        return Inertia::render('RequirementTests/Show', [
            'requirementTest' => $requirementTest->load([
                'requirement.framework', 'requirement.tags', 'user:id,name', 'framework:id,code,name',
            ]),
            'requirement' => $requirement,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  edit / update
    // ─────────────────────────────────────────────────────────────

    public function edit(RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);
        $requirementTest->load('requirement.framework');
        return Inertia::render('RequirementTests/Edit', ['test' => $requirementTest]);
    }

    public function update(Request $request, RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);

        $validated = $request->validate([
            'test_date'  => ['required', 'date'],
            'tested_at'  => ['nullable', 'date'],
            'status'     => ['required', 'in:compliant,non_compliant,partial,na,pending,overdue'],
            'comment'    => ['nullable', 'string', 'max:2000'],
            'evidence'   => ['nullable', 'array'],
            'evidence.*' => ['nullable', 'string', 'max:2048'],
        ]);

        $requirementTest->update($validated);

        return redirect()->route('requirement-tests.index')->with('success', 'Test updated successfully.');
    }

    // ─────────────────────────────────────────────────────────────
    //  destroy
    // ─────────────────────────────────────────────────────────────

    public function destroy(RequirementTest $requirementTest)
    {
        $this->authorize('delete', $requirementTest);
        $requirementTest->delete();
        return redirect()->route('requirement-tests.index')->with('success', 'Test deleted successfully.');
    }

    // ─────────────────────────────────────────────────────────────
    //  accept / reject
    // ─────────────────────────────────────────────────────────────

    public function accept(RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);

        $requirementTest->update([
            'validation_status' => 'accepted',
            'tested_at'         => $requirementTest->tested_at ?? now(),
        ]);

        if ($requirement = $requirementTest->requirement) {
            $this->advanceEffectiveDate($requirement);   // ← working days ✅
        }

        return back()->with('success', 'Test accepted. Next effective date calculated using working days.');
    }

    public function reject(Request $request, RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);

        $request->validate(['comment' => ['required', 'string', 'max:1000']]);

        $requirementTest->update([
            'validation_status' => 'rejected',
            'comment'           => $request->comment,
        ]);

        return back()->with('success', 'Test rejected.');
    }

    // ─────────────────────────────────────────────────────────────
    //  validation listing
    // ─────────────────────────────────────────────────────────────

    public function validation()
    {
        $this->authorize('viewAny', RequirementTest::class);

        $currentOrgId = Auth::user()->current_organization_id;
        $tab          = request()->query('tab', 'all');

        $baseQuery = RequirementTest::query()
            ->with(['requirement:id,code,title', 'user:id,name', 'framework:id,code,name'])
            ->whereHas('requirement', fn ($q) =>
                $q->where('organization_id', $currentOrgId)->where('is_deleted', 0)
            );

        $counts = [
            'all'      => (clone $baseQuery)->count(),
            'pending'  => (clone $baseQuery)->where('validation_status', 'pending')->count(),
            'accepted' => (clone $baseQuery)->where('validation_status', 'accepted')->count(),
            'rejected' => (clone $baseQuery)->where('validation_status', 'rejected')->count(),
        ];

        if ($tab !== 'all') {
            $baseQuery->where('validation_status', $tab);
        }

        $tests = $baseQuery->latest()->paginate(50)->withQueryString();

        return Inertia::render('RequirementTests/Validation', [
            'tests'  => $tests,
            'counts' => $counts,
            'tab'    => $tab,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  export
    // ─────────────────────────────────────────────────────────────

    public function export(Request $request)
    {
        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) abort(403, 'No organization selected.');

        $dateStr = $request->query('date', today()->format('Y-m-d'));
        try { $targetDate = Carbon::parse($dateStr)->startOfDay(); }
        catch (\Exception $e) { $targetDate = today()->startOfDay(); }

        $query = RequirementTest::with([
            'requirement:id,code,title,organization_id',
            'user:id,name',
            'framework:id,code,name',
        ])
        ->whereHas('requirement', fn ($q) =>
            $q->where('organization_id', $currentOrgId)->where('is_deleted', 0)
        );

        if ($request->filled('date')) {
            $query->whereDate('test_date', $targetDate->format('Y-m-d'));
        }

        if ($search = trim($request->query('search', ''))) {
            $query->whereHas('requirement', fn ($q) =>
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
            );
        }

        return Excel::download(
            new RequirementTestsExport($query->latest('test_date')->get()),
            'compliance-tests-' . $targetDate->format('Y-m-d') . '.xlsx'
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  createForRequirement / storeForRequirement
    // ─────────────────────────────────────────────────────────────

    public function createForRequirement(Request $request, Requirement $requirement)
    {
        $user         = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $targetDate = Carbon::parse(
            $request->query('date', today()->format('Y-m-d'))
        )->startOfDay();

        $requirement->load('framework', 'processes', 'tags');

        return Inertia::render('RequirementTests/Create', [
            'requirement'  => $requirement,
            'defaultDate'  => $targetDate->format('Y-m-d'),
            'existingTest' => RequirementTest::query()
                ->where('requirement_id', $requirement->id)
                ->whereDate('test_date', $targetDate)
                ->first(),
        ]);
    }

   public function storeForRequirement(Request $request, Requirement $requirement)
{
    $user         = Auth::user();
    $currentOrgId = $user->current_organization_id;

    if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
        abort(403, 'Unauthorized');
    }

    $validated = $request->validate([
        'test_date'      => ['required', 'date'],
        'tested_at'      => ['nullable', 'date'],
        'status'         => ['nullable', 'in:compliant,non_compliant,partial,na,pending'],
        'result'         => ['required', 'in:compliant,non_compliant'],
        'comment'        => ['nullable', 'string', 'max:2000'],
        'failure_reason' => ['nullable', 'string', 'max:2000'],
        'evidence'       => ['nullable', 'string', 'max:5000'],
        'test_code'      => ['nullable', 'string', 'max:100'],
        'name'           => ['nullable', 'string', 'max:255'],
        'objective'      => ['nullable', 'string', 'max:5000'],
        'procedure'      => ['nullable', 'string', 'max:5000'],
    ]);

    $targetDate = Carbon::parse($validated['test_date'])->startOfDay();

    // ── 1. Chercher un test rejeté existant pour cette date ──────────────
    $rejectedTest = RequirementTest::query()
        ->where('requirement_id', $requirement->id)
        ->whereDate('test_date', $targetDate)
        ->where('validation_status', 'rejected')
        ->first();

    // ── 2. Bloquer seulement si un test NON-rejeté existe déjà ──────────
    $alreadyExists = RequirementTest::query()
        ->where('requirement_id', $requirement->id)
        ->whereDate('test_date', $targetDate)
        ->where('validation_status', '!=', 'rejected')
        ->exists();

    if ($alreadyExists) {
        return back()->withErrors(['test_date' => 'Un test existe déjà pour ce requirement à cette date.']);
    }

    // ── 3. Supprimer l'ancien test rejeté avant de créer le nouveau ──────
    $rejectedTest?->delete();

    $comment = trim(
        ($validated['comment'] ?? '') .
        ($validated['failure_reason'] ? "\n\nRaison d'échec : " . $validated['failure_reason'] : '')
    );

    RequirementTest::create([
        'requirement_id'    => $requirement->id,
        'framework_id'      => $requirement->framework_id,
        'user_id'           => Auth::id(),
        'test_date'         => $targetDate->toDateString(),
        'tested_at'         => now(),
        'status'            => $validated['result'],
        'validation_status' => 'pending',   // ← toujours pending après un rejet
        'comment'           => $comment ?: null,
        'evidence'          => $validated['evidence'] ? [$validated['evidence']] : null,
    ]);

    
    return redirect()
        ->route('req-testing.index', ['date' => $targetDate->format('Y-m-d')])
        ->with('success', 'Test re-soumis avec succès. En attente de validation.');
}
}