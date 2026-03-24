<?php

namespace App\Http\Controllers;

use App\Models\PredefinedTestRequirment;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PredefinedTestsExport;

class PredefinedTestRequirmentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = in_array($perPage, [10, 15, 20, 30, 50]) ? $perPage : 15;

        $query = PredefinedTestRequirment::query()
            ->with([
                'requirement' => function ($q) {
                    $q->select('id', 'code', 'title', 'organization_id');
                }
            ])
            ->whereHas('requirement', function ($q) use ($currentOrgId) {
                $q->where('organization_id', $currentOrgId)
                    ->where('is_deleted', 0);
            })
            ->select([
                'id',
                'requirement_id',
                'test_code',
                'test_name',
                'objective',
                'procedure',
                'created_at',
            ]);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('test_code', 'like', "%{$search}%")
                    ->orWhere('test_name', 'like', "%{$search}%")
                    ->orWhere('objective', 'like', "%{$search}%")
                    ->orWhereHas('requirement', function ($sub) use ($search) {
                        $sub->where('code', 'like', "%{$search}%")
                            ->orWhere('title', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('sort')) {
            $sort = $request->sort;
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $column = ltrim($sort, '-');

            $allowed = ['test_code', 'test_name', 'created_at'];
            if (in_array($column, $allowed)) {
                $query->orderBy($column, $direction);
            } else {
                $query->latest();
            }
        } else {
            $query->latest();
        }

        $tests = $query->paginate($perPage)->withQueryString();

        $tests->through(function ($test) {
            return [
                'id' => $test->id,
                'test_code' => $test->test_code,
                'test_name' => $test->test_name,
                'objective' => $test->objective,
                'procedure' => $test->procedure,
                'created_at' => $test->created_at,
                'requirement' => $test->requirement ? [
                    'id' => $test->requirement->id,
                    'code' => $test->requirement->code,
                    'title' => $test->requirement->title,
                ] : null,
            ];
        });

        return Inertia::render('PredefinedTestRequirements/Index', [
            'tests' => $tests,
        ]);
    }


    public function create()
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $usedRequirementIds = PredefinedTestRequirment::pluck('requirement_id')->toArray();

        $requirements = Requirement::select('id', 'code', 'title')
            ->where('organization_id', $currentOrgId)
            ->where('is_deleted', 0)
            ->whereNotIn('id', $usedRequirementIds)
            ->orderBy('code')
            ->get();

        return Inertia::render('PredefinedTestRequirements/Create', [
            'requirements' => $requirements,
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
            'requirement_id' => [
                'required',
                'exists:requirements,id',
                function ($attribute, $value, $fail) use ($currentOrgId) {
                    if (
                        !Requirement::where('id', $value)
                            ->where('organization_id', $currentOrgId)
                            ->where('is_deleted', 0)
                            ->exists()
                    ) {
                        $fail('The selected requirement is invalid or does not belong to your organization.');
                    }
                },
                'unique:predefined_tests_requirments,requirement_id',
            ],
            'test_code' => ['required', 'string', 'max:100', 'unique:predefined_tests_requirments,test_code'],
            'test_name' => ['required', 'string', 'max:255'],
            'objective' => ['required', 'string'],
            'procedure' => ['required', 'string'],
        ]);

        PredefinedTestRequirment::create($validated);

        // ✅ Nom de route corrigé
        return redirect()->route('predefinedTestReq.index')
            ->with('success', 'Predefined test created successfully.');
    }


    public function edit(PredefinedTestRequirment $predefinedTest)
    {
        $this->authorizeAccess($predefinedTest);

        $predefinedTest->load('requirement:id,code,title');

        $requirements = Requirement::select('id', 'code', 'title')
            ->where('organization_id', Auth::user()->current_organization_id)
            ->where('is_deleted', 0)
            ->orderBy('code')
            ->get();

        return Inertia::render('PredefinedTestRequirements/Edit', [
            'test' => $predefinedTest,
            'requirements' => $requirements,
        ]);
    }


    public function update(Request $request, PredefinedTestRequirment $predefinedTest)
    {
        $this->authorizeAccess($predefinedTest);

        $validated = $request->validate([
            'test_code' => ['required', 'string', 'max:100', 'unique:predefined_tests_requirments,test_code,' . $predefinedTest->id],
            'test_name' => ['required', 'string', 'max:255'],
            'objective' => ['required', 'string'],
            'procedure' => ['required', 'string'],
        ]);

        $predefinedTest->update($validated);

        // ✅ Nom de route corrigé
        return redirect()->route('predefinedTestReq.index')
            ->with('success', 'Predefined test updated successfully.');
    }


    public function destroy(PredefinedTestRequirment $predefinedTest)
    {
        $this->authorizeAccess($predefinedTest);

        $predefinedTest->delete();

        return back()->with('success', 'Predefined test deleted successfully.');
    }


    public function export(Request $request)
    {
        $user = Auth::user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            abort(403, 'No organization selected.');
        }

        // Construire la requête avec relations et filtres
        $query = PredefinedTestRequirment::with('requirement:id,code,title')
            ->whereHas('requirement', function ($q) use ($currentOrgId) {
                $q->where('organization_id', $currentOrgId)
                    ->where('is_deleted', 0);
            });

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('test_code', 'like', "%{$search}%")
                    ->orWhere('test_name', 'like', "%{$search}%")
                    ->orWhere('test_objective', 'like', "%{$search}%")

                    ->orWhereHas('requirement', function ($sub) use ($search) {
                        $sub->where('code', 'like', "%{$search}%")
                            ->orWhere('title', 'like', "%{$search}%");
                    });
            });
        }

        $tests = $query->get();

        return Excel::download(
            new PredefinedTestsExport($tests),
            'predefined-tests-' . now()->format('Y-m-d-His') . '.xlsx'
        );
    }


    public function forRequirement(Requirement $requirement)
    {
        $user = Auth::user();
        if ($requirement->organization_id !== $user->current_organization_id || $requirement->is_deleted) {
            abort(403);
        }

        $test = PredefinedTestRequirment::where('requirement_id', $requirement->id)
            ->select('id', 'test_code', 'test_name', 'objective', 'procedure')
            ->first();

        return response()->json($test ?? null);
    }


    private function authorizeAccess(PredefinedTestRequirment $test): void
    {
        $currentOrgId = Auth::user()?->current_organization_id;

        if (!$currentOrgId || $test->requirement?->organization_id !== $currentOrgId) {
            abort(403, 'Unauthorized action.');
        }
    }
}