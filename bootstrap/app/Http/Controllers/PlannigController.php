<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Planning;
use Inertia\Inertia;
use App\Http\Filters\StatusFilter;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Controllers\Concerns\HasDataTable;
use App\Exports\PlanningsExport;

class PlannigController extends Controller
{
      use HasDataTable;

 

   public function index(Request $request)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    if (!$currentOrgId) {
        return redirect()
            ->route('organizations.select.page')
            ->with('error', 'Please select an organization first.');
    }

    $allPlannings = Planning::where('organization_id', $currentOrgId)->get();

    $stats = [
        'total' => $allPlannings->count(),
        'active' => $allPlannings->where('is_active', true)->count(),
        'inactive' => $allPlannings->where('is_active', false)->count(),
    ];


    $baseQuery = Planning::where('organization_id', $currentOrgId);
    $plannings = $this->buildDataTableQuery($baseQuery, [
        'searchColumns' => [
            'name',
            'code',
            'description',
            'year'
        ],

        'filters' => [
            AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            AllowedFilter::exact('year'),
            AllowedFilter::scope('date_from'),
            AllowedFilter::scope('date_to'),
        ],

        'sorts' => [
            'name',
            'year',
            'updated_at',
        ],

        'defaultSort' => 'name',
        'perPage' => 10,
    ]);
    
    return Inertia::render('Plannings/index', [
        'plannings' => $plannings,
        'stats' => $stats,
        'filters' => $this->getCurrentFilters(),
    ]);
}
  
    public function create()
    {
        return Inertia::render('Plannings/create');
    }


  public function store(Request $request)
{
    $currentOrgId = $request->user()->current_organization_id;

    if (!$currentOrgId) {
        return back()->withErrors([
            'organization' => 'No organization selected.'
        ]);
    }

    $validated = $request->validate([
        'name'        => 'required|string|max:255',
        'code'        => 'nullable|string|max:100',
        'description' => 'nullable|string',
        'year'        => 'required|integer|min:2000|max:2100',
        'start_date'  => 'required|date',
        'end_date'    => 'required|date|after_or_equal:start_date',
        'is_active'   => 'boolean'
    ]);


    $validated['organization_id'] = $currentOrgId;

    
    Planning::create($validated);

    return redirect('plannings')
        ->with('success', 'Planning created successfully');
}

  
    public function show(Request $request, Planning $planning)
    {
        $this->checkOrganization($request, $planning);

        return Inertia::render('Plannings/show', [
            'planning' => $planning
        ]);
    }


    public function edit(Request $request, Planning $planning)
    {
        $this->checkOrganization($request, $planning);

        return Inertia::render('Plannings/edit', [
            'planning' => $planning
        ]);
    }

    
    public function update(Request $request, Planning $planning)
    {
        $this->checkOrganization($request, $planning);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'year'        => 'required|integer',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'is_active'   => 'boolean'
        ]);

        $planning->update($validated);

        return  redirect('plannings')
            ->with('success', 'Planning updated successfully');
    }

 
    public function destroy(Request $request, Planning $planning)
    {
        $this->checkOrganization($request, $planning);

        $planning->delete();

        return  redirect('plannings')
            ->with('success', 'Planning deleted successfully');
    }

    private function checkOrganization(Request $request, Planning $planning)
    {
        if ($planning->organization_id !== $request->user()->current_organization_id) {
            abort(403, 'Unauthorized action.');
        }
    }


 public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        return Excel::download(
            new PlanningsExport($currentOrgId, $request->all()),
            'PredefinedTests-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}

  
   

