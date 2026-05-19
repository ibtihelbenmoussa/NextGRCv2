<?php


namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Exports\PredefinedTestsExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Http\Controllers\Concerns\HasDataTable;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Filters\StatusFilter;
use App\Models\TestPredefined;

class PredefindTestController extends Controller
{
       use HasDataTable;
    public function index (Request $request){
       $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }
        $allTest = TestPredefined::where('organization_id', $currentOrgId)->get();
       $stats = [
            'total' => $allTest->count(),
            'active' => $allTest->where('is_active', true)->count(),
            'inactive' => $allTest->where('is_active', false)->count(),
        ];
     
        $baseQuery = TestPredefined::where('organization_id', $currentOrgId);
       $tests = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code' ],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::scope('date_from'),
                AllowedFilter::scope('date_to'),
            ],
            'sorts' => ['name', 'code', 'updated_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

  return Inertia::render('predefined-tests/index', [ 
     'tests' => $tests,
     'stats' => $stats,
     'filters' => $this->getCurrentFilters(),
    ]);
    }

    public function create(Request $request)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    if (!$currentOrgId) {
        return redirect()->route('organizations.select.page')
            ->with('error', 'Please select an organization first.');
    }

    return Inertia::render('predefined-tests/create');
}
public function store(Request $request)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    if (!$currentOrgId) {
        return redirect()->route('organizations.select.page')
            ->with('error', 'Please select an organization first.');
    }

    $validated = $request->validate([
        'name' => 'required|string',
        'code' => [
            'required',
            'string',
            'max:255',
            Rule::unique('test_predefineds', 'code'),
        ],
        'test_objective' => 'required|string',
        'test_result' => 'required|string',
        'risk' => 'required|string',
        'echantillon' => 'required|string',
        'is_active' => 'boolean',
    ]);

    $validated['organization_id'] = $currentOrgId;

    TestPredefined::create($validated);

    return  redirect('predefined-tests')
        ->with('success', 'Predefined test created successfully.');
}
public function show(TestPredefined $predefined_test)
{
    $this->authorizeTest($predefined_test);

    return Inertia::render('predefined-tests/show', [
        'test' => $predefined_test,
    ]);
}
public function edit(TestPredefined $predefined_test)
{
    $this->authorizeTest($predefined_test);

    return Inertia::render('predefined-tests/edit', [
        'test' => $predefined_test,
    ]);
}
public function update(Request $request, TestPredefined $predefined_test)
{
    $this->authorizeTest($predefined_test);

    $validated = $request->validate([
        'name' => 'required|string',
        'code' => [
            'required',
            'string',
            Rule::unique('test_predefineds', 'code')->ignore($predefined_test->id),
        ],
        'test_objective' => 'required|string',
        'test_result' => 'required|string',
        'risk' => 'required|string',
        'echantillon' => 'required|string',
        'is_active' => 'boolean',
    ]);

    $predefined_test->update($validated);

    return redirect('predefined-tests')
        ->with('success', 'Predefined test updated successfully.');
}
public function destroy(TestPredefined $predefined_test)
{
    $this->authorizeTest($predefined_test);

    $predefined_test->delete();

    return  redirect('predefined-tests')
        ->with('success', 'Predefined test deleted successfully.');
}


public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        return Excel::download(
            new PredefinedTestsExport($currentOrgId, $request->all()),
            'PredefinedTests-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
   private function authorizeTest(TestPredefined $test)
{
    $user = auth()->user();

    if ($test->organization_id !== $user->current_organization_id) {
        abort(403, 'Unauthorized');
    }
}
}
