<?php

namespace App\Http\Controllers;
use Spatie\QueryBuilder\QueryBuilder;
use App\Http\Controllers\Concerns\HasDataTable;
use App\Models\Risk;
use App\Models\RiskHistory;
use App\Models\User;
use App\Models\Process;
use App\Exports\RisksExport;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Support\Facades\Log;
use App\Models\RiskCategory;
use App\Models\AppSetting;
use App\Models\KRI;
use App\Models\Mesure;
use Spatie\QueryBuilder\AllowedSort;
use App\QueryBuilder\Sorts\InherentScoreSort;
use App\QueryBuilder\Sorts\ResidualScoreSort;
class RiskController extends Controller
{
    use HasDataTable;

    /**
     * Display a listing of the resource.
     */
   public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }


        $allRisks = Risk::where('organization_id', $currentOrgId)
            ->withCount(['processes', 'controls'])->with('owner','riskCategory')
            ->get();

        $stats = [
            'total' => $allRisks->count(),
            'active' => $allRisks->where('is_active', true)->count(),
            'high_inherent' => $allRisks->filter(function ($risk) {
                return $risk->inherent_score && $risk->inherent_score >= 15;
            })->count(),
            'high_residual' => $allRisks->filter(function ($risk) {
                return $risk->residual_score && $risk->residual_score >= 15;
            })->count(),
        ];

        // Build base query
        $baseQuery = Risk::where('organization_id', $currentOrgId)  ->withCount(relations: ['processes', 'controls'])->with('riskCategory','owner');

        // Build data table query
        $risks = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['code', 'name', 'description', 'category', 'owner.name'],
            'filters' => [
                AllowedFilter::exact('is_active'),
                AllowedFilter::partial('category'),
                AllowedFilter::exact('owner_id'),
                AllowedFilter::callback('inherent_score_min', function ($query, $value) {
                    $query->whereRaw('(inherent_likelihood * inherent_impact) >= ?', [$value]);
                }),
                AllowedFilter::callback('inherent_score_max', function ($query, $value) {
                    $query->whereRaw('(inherent_likelihood * inherent_impact) <= ?', [$value]);
                }),
                AllowedFilter::callback('residual_score_min', function ($query, $value) {
                    $query->whereRaw('(residual_likelihood * residual_impact) >= ?', [$value]);
                }),
                AllowedFilter::callback('residual_score_max', function ($query, $value) {
                    $query->whereRaw('(residual_likelihood * residual_impact) <= ?', [$value]);
                }),
            ],
            'sorts' => [
                'code',
                'name',
                'category',
                'inherent_score' => 'inherent_likelihood * inherent_impact',
                'residual_score' => 'residual_likelihood * residual_impact',
                'created_at',
                'updated_at'
            ],
            'defaultSort' => 'code',
            'includes' => ['owner', 'processes'],
            'perPage' => 15,
        ]);

        // Get filter options
        $categories = Risk::where('organization_id', $currentOrgId)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->sort()
            ->values();

        $owners = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Load the active risk configuration
        $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();
        $hasRiskSettings = $activeConfiguration !== null;

        // Check if there are any configurations
        $hasAnyRiskConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->exists();
        $hasInactiveConfigOnly = $hasAnyRiskConfiguration && !$hasRiskSettings;

        $configData = null;
        if ($activeConfiguration) {
            $configData = $activeConfiguration->toConfigArray();
        }
        return Inertia::render('risks/index', [
            'risks' => $this->formatPaginationData($risks),
            'stats' => $stats,
            'filters' => $this->getCurrentFilters(),
            'filterOptions' => [
                'categories' => $categories,
                'owners' => $owners,
            ],
            'hasRiskSettings' => $hasRiskSettings,
            'hasInactiveConfigOnly' => $hasInactiveConfigOnly,
            'canManageRiskMatrix' => $user->can('manage_risk_matrix'),
            'activeConfiguration' => $configData,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get available owners
        $owners = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get available processes
        $processes = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with(['macroProcess.businessUnit'])
            ->select('id', 'code', 'name', 'macro_process_id')
            ->orderBy('code')
            ->get();
          $categories = RiskCategory::where('organization_id', $currentOrgId)
          ->where('is_active', 1)
          ->orderBy('parent_id')
          ->orderBy('name')
             ->get();
         $setting = AppSetting::all();
        return Inertia::render('risks/create', [
            'owners' => $owners,
            'processes' => $processes,
            'category' => $categories,
            'setting'=>$setting

        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

      //  dd($request);
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('risks')
                    ->where('organization_id', $currentOrgId)
                    ->whereNull('deleted_at'),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'risk_category_id' => 'required|integer',
            'inherent_likelihood' => 'required|integer|between:1,5',
            'inherent_impact' => 'required|integer|between:1,5',
            'residual_likelihood' => 'nullable|integer|between:1,5',
            'residual_impact' => 'nullable|integer|between:1,5',
            'owner_id' => 'required|exists:users,id',
            'is_active' => 'boolean',
            'process_ids' => 'required|array',
            'process_ids.*' => 'exists:processes,id',
             'kri_name' => 'nullable|string|max:255|required_with:kri_description,kri_threshold,kri_owner_id',

             'kri_description' => 'nullable|string|required_with:kri_name',

             'kri_threshold' => 'nullable|numeric|required_with:kri_name',

            'kri_owner_id' => 'nullable|exists:users,id|required_with:kri_name',

            'status' => 'nullable|in:low,medium,high|required_with:kri_name',
        ]);


        // Verify owner belongs to current organization if specified
        if (isset($validated['owner_id'])) {
            $ownerBelongsToOrg = User::whereHas('organizations', function ($query) use ($currentOrgId) {
                $query->where('organization_id', $currentOrgId);
            })->where('id', $validated['owner_id'])->exists();

            if (!$ownerBelongsToOrg) {
                abort(403, 'Invalid owner.');
            }
        }

        // Verify processes belong to current organization if specified
        if (!empty($validated['process_ids'])) {
            $validProcessCount = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
                $query->where('organization_id', $currentOrgId);
            })->whereIn('id', $validated['process_ids'])->count();

            if ($validProcessCount !== count($validated['process_ids'])) {
                abort(403, 'Invalid processes.');
            }
        }

        $processIds = $validated['process_ids'] ?? [];
        unset($validated['process_ids']);

        $validated['organization_id'] = $currentOrgId;

        $risk = Risk::create($validated);

        // Attach processes
        if (!empty($processIds)) {
            $risk->processes()->attach($processIds);
        }

        if ($request->filled('kri_name')) {

        $kri = KRI::create([
            'name' => $request->kri_name,
            'description' => $request->kri_description,
            'threshold' => $request->kri_threshold,
            'owner_id' => $request->kri_owner_id,
            'status' => $request->status,

        ]);


            $risk->update([
            'kri_id' => $kri->id
            ]);
}

        return redirect()->route('risks.index', $risk)
            ->with('success', 'Risk created successfully.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Request $request, Risk $risk)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;


        if ($risk->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this risk.');
        }

        $risk->load(['owner', 'processes.macroProcess.businessUnit', 'controls', 'tests','riskCategory']);

         $history = RiskHistory::where('risk_id', $risk->id)
        ->orderBy('created_at', 'desc')
        ->get();

    // Configuration
    $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();

    $configData = null;
    if ($activeConfiguration) {
        $configData = $activeConfiguration->toConfigArray();
    }
        return Inertia::render('risks/show', [
            'risk' => $risk,
            'initialConfiguration' => $configData,
           'history' => $history,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     **/
     public function edit(Request $request, Risk $risk)
    {
        $user = $request->user();
    $currentOrgId = $user->current_organization_id;

        if ($risk->organization_id !== $user->current_organization_id) {
            abort(403, 'Unauthorized');
        }


        $risk->load('processes','kri');

        return Inertia::render('risks/edit', [
            'risk' => [
                'id' => $risk->id,
                'name' => $risk->name,
                'code' => $risk->code,
                'description' => $risk->description,
                'category' => $risk->risk_category_id,
                'inherent_likelihood' => $risk->inherent_likelihood,
                'inherent_impact' => $risk->inherent_impact,
                'residual_likelihood' => $risk->residual_likelihood,
                'residual_impact' => $risk->residual_impact,
                'owner_id' => $risk->owner_id,
                'is_active' => (bool) $risk->is_active,

                 'kri' => $risk->kri ? [
                 'id' => $risk->kri->id,
                 'name' => $risk->kri->name ?? $risk->kri->kri_name,
                 'owner_id' => $risk->kri->owner_id ?? $risk->kri->owner_id,
                 'description' => $risk->kri->description ?? $risk->kri->description,
                 'threshold' => $risk->kri->threshold ?? $risk->kri->threshold,
                 'status' => $risk->kri->status ?? $risk->kri->status,
             ] : null,



                'processes' => $risk->processes->map(fn($process) => [
                    'id' => $process->id,
                ],


                ),
            ],


            'owners' => User::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'categories' => RiskCategory::where('organization_id',operator: $risk->organization_id)->where('is_active',1)

                ->get(),

            'processes' =>  Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with(['macroProcess.businessUnit'])
            ->select('id', 'code', 'name', 'macro_process_id')
            ->orderBy('code')
            ->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
public function update(Request $request, Risk $risk)
{
    //dd($request);

    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    if (!$currentOrgId) {
        return redirect()
            ->route('organizations.select.page')
            ->with('error', 'Please select an organization first.');
    }

    if ($risk->organization_id !== $currentOrgId) {
        abort(403, 'Unauthorized action.');
    }


    $request->merge([
        'owner_id' => $request->owner_id ?: null,
    ]);


    $validated = $request->validate([
        'code' => [
            'required',
            'string',
            'max:50',
            Rule::unique('risks')
                ->where('organization_id', $currentOrgId)
                ->whereNull('deleted_at')
                ->ignore($risk->id),
        ],
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'risk_category_id' => 'required|integer',

        'inherent_likelihood' => 'required|integer|between:1,5',
        'inherent_impact' => 'required|integer|between:1,5',
        'residual_likelihood' => 'nullable|integer|between:1,5',
        'residual_impact' => 'nullable|integer|between:1,5',

        'owner_id' => 'required|integer|exists:users,id',
        'is_active' => 'boolean',

        'process_ids' => 'required|array',
        'process_ids.*' => 'exists:processes,id',

        'documents' => 'nullable|array',
        'documents.*' => 'file|max:10240',

        'kri_name' => 'nullable|string|max:255|required_with:kri_description,kri_threshold,kri_owner_id',

             'kri_description' => 'nullable|string|required_with:kri_name',

             'kri_threshold' => 'nullable|numeric|required_with:kri_name',

            'kri_owner_id' => 'nullable|exists:users,id|required_with:kri_name',

            'status' => 'nullable|in:low,medium,high|required_with:kri_name',
    ]);


    if (isset($validated['owner_id'])) {
        $ownerBelongsToOrg = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
        ->where('id', $validated['owner_id'])
        ->exists();

        if (!$ownerBelongsToOrg) {
            abort(403, 'Invalid owner.');
        }
    }


    $processIds = $validated['process_ids'] ?? [];
    unset($validated['process_ids']);

    if (!empty($processIds)) {
        $validProcessCount = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
        ->whereIn('id', $processIds)
        ->count();

        if ($validProcessCount !== count($processIds)) {
            abort(403, 'Invalid processes.');
        }
    }


    $validated['is_active'] = $request->boolean('is_active');


    $risk->update($validated);


    $risk->processes()->sync($processIds);
    if ($request->filled('kri_name')) {

        if ($risk->kri_id) {
            // ✅ UPDATE EXISTING KRI
            $kri = KRI::find($risk->kri_id);

            if ($kri) {
                $kri->update([
                    'name' => $request->kri_name,
                    'description' => $request->kri_description,
                    'threshold' => $request->kri_threshold,
                    'owner_id' => $request->kri_owner_id,
                    'status' => $request->status,
                ]);
            }
        } else {

            $kri = KRI::create([
                'name' => $request->kri_name,
                'description' => $request->kri_description,
                'threshold' => $request->kri_threshold,
                'owner_id' => $request->kri_owner_id,
                'status' => $request->status,
            ]);

            $risk->update([
                'kri_id' => $kri->id
            ]);
        }

    } else {


        if ($risk->kri_id) {
            $kri = KRI::find($risk->kri_id);

            if ($kri) {

                Mesure::where('kri_id', $kri->id)->delete();


                $kri->delete();
            }


            $risk->update([
                'kri_id' => null
            ]);
        }
    }


    if ($request->hasFile('documents')) {
        foreach ($request->file('documents') as $file) {
            $risk->addMedia($file)->toMediaCollection('documents');
        }
    }

    return redirect()
        ->route('risks.index')
        ->with('success', 'Risk updated successfully.');
}


    public function ShowById(Request $request, $id)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;


    $risk = Risk::findOrFail($id);


    if ($risk->organization_id !== $currentOrgId) {
        abort(403, 'You do not have access to this risk.');
    }


    $history = RiskHistory::where('risk_id', $id)
        ->orderBy('created_at', 'desc')
        ->get();


    $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();

    $configData = null;
    if ($activeConfiguration) {
        $configData = $activeConfiguration->toConfigArray();
    }

    // Return inertia
    return Inertia::render('risks/show', [
        'risk' => $risk,
        'initialConfiguration' => $configData,
        'history' => $history,
    ]);
}
    /*
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Risk $risk)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Verify risk belongs to current organization
        if ($risk->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this risk.');
        }

        $risk->delete();

        return redirect()->route('risks.index')
            ->with('success', 'Risk deleted successfully.');
    }

    /**
     * Export risks to Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get all risks with relationships for export
        $risks = Risk::where('organization_id', $currentOrgId)
            ->with(['owner', 'processes'])
            ->withCount('controls')
            ->orderBy('code')
            ->get();

        $filename = 'risks-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

        return Excel::download(new RisksExport($risks), $filename);
    }

    /**
     * Display the risk assessment matrix.
     */
    public function matrix(Request $request)
    {

        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Load the active risk configuration
        $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();

        $configData = null;
        if ($activeConfiguration) {
            $configData = $activeConfiguration->toConfigArray();
        }

        // Load risks for the matrix
        $risks = Risk::where('organization_id', $currentOrgId)
            ->select('id', 'name', 'inherent_impact', 'inherent_likelihood', 'residual_impact', 'residual_likelihood')
            ->get();

        return Inertia::render('risks/matrix', [
            'initialConfiguration' => $configData,
            'risks' => $risks,
        ]);
    }

  public function RiskHistory(Request $request, Risk $risk)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;


    if ($risk->organization_id !== $currentOrgId) {
        abort(403, 'Unauthorized');
    }


    $history = RiskHistory::where('risk_id', $risk->id)
        ->orderBy('created_at', 'desc')
        ->get();
   $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();

        $configData = null;
        if ($activeConfiguration) {
            $configData = $activeConfiguration->toConfigArray();
        }

     return Inertia::render('risks/history', [
            'initialConfiguration' => $configData,
            'history' =>  $history,
        ]);
}
}
