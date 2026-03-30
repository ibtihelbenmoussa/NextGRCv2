<?php

namespace App\Http\Controllers;

use App\Models\Requirement;
use App\Models\RequirementTest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RequirementTestsExport;

class RequirementTestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', RequirementTest::class);

        $query = RequirementTest::query()
            ->with([
                'framework:id,code,name',
                'requirement.framework:id,code,name',
                'user:id,name',
            ])
            ->select([
                'id',
                'requirement_id',
                'user_id',
                'framework_id',
                'test_date',
                'status',
                'comment',
                'evidence',
                'created_at',
            ])
            ->latest('test_date');

        if ($date = $request->query('date')) {
            try {
                $parsedDate = Carbon::parse($date);
                $query->whereDate('test_date', $parsedDate);
            } catch (\Exception $e) {
                \Log::warning("Invalid date in requirement-tests index", ['date' => $date]);
            }
        }

        if ($search = trim($request->query('search', ''))) {
            $query->whereHas('requirement', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $tests = $query->paginate(15)->withQueryString();

        return Inertia::render('RequirementTests/Index', [
            'tests' => $tests,
            'filters' => $request->only(['date', 'search', 'status']),
            'canCreate' => Auth::user()->can('create', RequirementTest::class),
        ]);
    }

    public function create()
    {
        $this->authorize('create', RequirementTest::class);

        $requirements = Requirement::query()
            ->select('id', 'code', 'title', 'frequency', 'effective_date', 'framework_id')
            ->with('framework:id,code,name')
            ->orderBy('code')
            ->get();

        return Inertia::render('RequirementTests/Create', [
            'requirements' => $requirements,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', RequirementTest::class);

        $validated = $request->validate([
            'requirement_id' => ['required', 'exists:requirements,id'],
            'test_date' => ['required', 'date'],
            'tested_at' => ['required', 'date'],
            'status' => ['required', 'in:compliant,non_compliant,partial,na'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['nullable', 'string', 'max:2048'],
        ]);

        $requirement = Requirement::findOrFail($validated['requirement_id']);

        RequirementTest::create([
            'requirement_id' => $validated['requirement_id'],
            'framework_id' => $requirement->framework_id,
            'user_id' => Auth::id(),
            'test_date' => $validated['test_date'],
            'tested_at' => $validated['tested_at'],

            'status' => $validated['status'],
            'comment' => $validated['comment'] ?? null,
            'evidence' => $validated['evidence'] ?? null,
        ]);

        return redirect()
            ->route('requirement-tests.index')
            ->with('success', 'Test created successfully.');
    }

    public function show(RequirementTest $requirementTest)
    {
        $requirement = $requirementTest->requirement;

        if (!$requirement) {
            abort(404, 'Requirement not found for this test.');
        }

        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if ($requirement->organization_id != $currentOrgId || $requirement->is_deleted) {
            abort(403, 'Unauthorized');
        }

        $requirement->framework_name = $requirement->framework?->name;
        $requirement->process_name = $requirement->process?->name;
        $requirement->load('tags');

        return Inertia::render('RequirementTests/Show', [
            'requirement' => $requirement,
        ]);
    }
    public function edit(RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);

        $requirementTest->load('requirement.framework');

        $requirements = Requirement::select('id', 'code', 'title', 'frequency', 'effective_date')
            ->with('framework:id,code,name')
            ->orderBy('code')
            ->get();

        return Inertia::render('RequirementTests/Edit', [
            'test' => $requirementTest,
            'requirements' => $requirements,
        ]);
    }

    public function update(Request $request, RequirementTest $requirementTest)
    {
        $this->authorize('update', $requirementTest);

        $validated = $request->validate([
            'test_date' => ['required', 'date'],
            'tested_at' => ['required', 'date'],

            'status' => ['required', 'in:compliant,non_compliant,partial,na'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['nullable', 'string', 'max:2048'],
        ]);

        $requirementTest->update($validated);

        return redirect()
            ->route('requirement-tests.index')
            ->with('success', 'Test updated successfully.');
    }

    public function destroy(RequirementTest $requirementTest)
    {
        $this->authorize('delete', $requirementTest);

        $requirementTest->delete();

        return redirect()
            ->route('requirement-tests.index')
            ->with('success', 'Test deleted successfully.');
    }


    public function createForRequirement(Requirement $requirement)
    {
        $this->authorize('create', RequirementTest::class);

        $requirement->load('framework:id,code,name');

        return Inertia::render('RequirementTests/Create', [
            'requirement' => $requirement,
        ]);
    }


    public function storeForRequirement(Request $request, Requirement $requirement)
    {
        $data = $request->validate([
            'test_code' => 'required|string|max:50|unique:requirement_tests,test_code',
            'name' => 'required|string',
            'objective' => 'required|string',
            'procedure' => 'required|string',
            'status' => 'required|string',
            'result' => 'required|string',
            'efficacy' => 'required|string',
            'test_date' => 'nullable|date',
            'tested_at' => 'nullable|date',

            'evidence' => 'nullable|string',
            'comment' => 'nullable|string|max:2000',
        ]);

        $data['user_id'] = auth()->id();
        $data['framework_id'] = $requirement->framework_id;
        $data['test_date'] = $data['test_date'] ?? now()->toDateString();
                $data['tested_at'] = $data['tested_at'] ?? now()->toDateString();


        // ✅ Auto-validate : si le requirement a auto_validate = true,
        //    le test est directement accepté, sinon il reste en attente
        $data['validation_status'] = $requirement->auto_validate ? 'accepted' : 'pending';

        $test = $requirement->tests()->create($data);

        // ✅ Si auto-validé, mettre à jour la deadline du requirement
        if ($requirement->auto_validate) {
            $newDeadline = match (strtolower($requirement->frequency ?? '')) {
                'daily' => now()->addDay(),
                'weekly' => now()->addWeek(),
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'yearly', 'annual' => now()->addYear(),
                default => null,
            };

            if ($newDeadline) {
                $requirement->update(['effective_date' => $newDeadline]);
            }
        }

        return redirect('/req-testing')
            ->with(
                'success',
                $requirement->auto_validate
                ? 'Test créé et accepté automatiquement !'
                : 'Test créé avec succès !'
            );
    }

    public function accept(RequirementTest $requirementTest)
    {
        $requirementTest->update([
            'validation_status' => 'accepted',
        ]);

        // Recalculer la deadline du requirement selon sa fréquence
        $requirement = $requirementTest->requirement;

        if ($requirement) {
            $newDeadline = match (strtolower($requirement->frequency ?? '')) {
                'daily' => now()->addDay(),
                'weekly' => now()->addWeek(),
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'yearly', 'annual' => now()->addYear(),
                default => null,
            };

            if ($newDeadline) {
                $requirement->update(['effective_date' => $newDeadline]);
            }
        }

        return back()->with('success', 'Test accepted. Deadline updated.');
    }


    public function reject(Request $request, RequirementTest $requirementTest)
    {
        $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $requirementTest->update([
            'validation_status' => 'rejected',
            'validation_comment' => $request->comment,
        ]);

        return back()->with('success', 'Test rejected.');
    }


    public function validation()
    {
        $tests = RequirementTest::query()
            ->with(['requirement:id,code,title', 'user:id,name'])
            ->latest()
            ->paginate(15);

        return Inertia::render('RequirementTests/Validation', [
            'tests' => $tests,
        ]);
    }
    public function export(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            abort(403, 'No organization selected.');
        }

        // Récupérer la date ou utiliser aujourd'hui
        $dateStr = $request->query('date', today()->format('Y-m-d'));
        try {
            $targetDate = Carbon::parse($dateStr)->startOfDay();
        } catch (\Exception $e) {
            $targetDate = today()->startOfDay();
        }

        // Construire la requête
        $query = RequirementTest::with([
            'requirement:id,code,title,organization_id',
            'user:id,name',
            'framework:id,code,name',
        ])
            ->whereHas('requirement', function ($q) use ($currentOrgId) {
                $q->where('organization_id', $currentOrgId)
                    ->where('is_deleted', 0);
            });

        // Filtrer par date si fournie
        if ($request->filled('date')) {
            $query->whereDate('test_date', $targetDate->format('Y-m-d'));
        }

        // Filtrer par recherche sur code ou titre
        if ($search = trim($request->query('search', ''))) {
            $query->whereHas('requirement', function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('code', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            });
        }

        // Récupérer les tests
        $tests = $query->latest('test_date')->get() ?? collect();

        // Télécharger le fichier Excel
        return Excel::download(
            new RequirementTestsExport($tests),
            'compliance-tests-' . $targetDate->format('Y-m-d') . '.xlsx'
        );
    }
}