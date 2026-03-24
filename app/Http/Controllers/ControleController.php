<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Control;
use App\Models\Risk;
use App\Models\RiskHistory;
use App\Models\User;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Filters\StatusFilter;
use App\Http\Controllers\Concerns\HasDataTable;
use App\Exports\ControlsExport;
use App\Models\AppSetting;
use App\Models\RiskScoreLevel;
use App\Models\ControlSetting;
use Illuminate\Support\Facades\DB;

class ControleController extends Controller
{


     use HasDataTable;
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }


        $allControls = Control::where('organization_id', $currentOrgId)->get();

        $stats = [
            'total' => $allControls->count(),
            'active' => $allControls->where('is_active', true)->count(),
            'inactive' => $allControls->where('is_active', false)->count(),
        ];

        $isAuditMode = AppSetting::where('key', 'audit')->value('value');

        $efficiencyStats = [];

        if (!$isAuditMode) {
          $efficiencyStats = [
        'effective' => Control::where('organization_id', $currentOrgId)
            ->where('efficiency', 'efficient')
            ->count(),

        'partially_effective' => Control::where('organization_id', $currentOrgId)
            ->where('efficiency', 'partially-efficient')
            ->count(),

        'ineffective' => Control::where('organization_id', $currentOrgId)
            ->where('efficiency', 'inefficient')
            ->count(),
    ];
}


        $baseQuery = Control::where('organization_id', $currentOrgId)
            ->with(['owner','risks']);


        $controls = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description', 'owner.name'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::exact('owner', 'owner_id'),
                AllowedFilter::scope('date_from'),
                AllowedFilter::scope('date_to'),
            ],
            'sorts' => ['name', 'code', 'updated_at'],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);


        $owners = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->orderBy('name')
            ->get(['id', 'name']);
         $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();



        $configData = null;
        if ($activeConfiguration) {
            $configData = $activeConfiguration->toConfigArray();
        }

        return Inertia::render('controle/index', [
            'controls' => $controls,
            'stats' => $stats,
            'owners' => $owners,
            'filters' => $this->getCurrentFilters(),
            'activeConfiguration' => $configData,
            'efficiencyStats' => $efficiencyStats,


        ]);
    }
public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        return Excel::download(
            new ControlsExport($currentOrgId, $request->all()),
            'controls-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
    public function create(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;
        $risks = Risk::where(
            'organization_id',
             $currentOrgId
        )->where('is_active',1)->get();
         $risks = Risk::where(
            'organization_id',
             $currentOrgId
        )->where('is_active',1)->get();
         $owners = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('controle/create', [
            'risks' => $risks,
            'owners' => $owners,

        ]);
    }

public function store(Request $request)
{

    $user = $request->user();
    $currentOrgId = $user->current_organization_id;
    $isAuditMode = AppSetting::where('key', 'mode')->value('value') === 'audit';
    if($isAuditMode)
   { 
    $validated = $request->validate([
        'code' => 'required|string|max:50',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'reality' => 'nullable|string',
        'pertinence' => 'nullable|string',
        'efficiency' => 'nullable|string',
        'control_type' => 'required|string',
        'control_nature' => 'required|string',
        'frequency' => 'required|string',
        'owner_id' => 'required|exists:users,id',
        'risk_ids' => 'required|array|min:1',
        'risk_ids.*' => 'exists:risks,id',
        'is_active' => 'boolean',
    ]);
    }else{
        $validated = $request->validate([
        'code' => 'required|string|max:50',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'reality' => 'required|string',
        'pertinence' => 'required|string',
        'efficiency' => 'required|string',
        'control_type' => 'required|string',
        'control_nature' => 'required|string',
        'frequency' => 'required|string',
        'owner_id' => 'required|exists:users,id',
        'risk_ids' => 'required|array|min:1',
        'risk_ids.*' => 'exists:risks,id',
        'is_active' => 'boolean',
    ]); 
    }

    $control = Control::create([
        'code' => $validated['code'],
        'name' => $validated['name'],
        'description' => $validated['description'] ?? null,
        'control_type' => $validated['control_type'],
        'control_nature' => $validated['control_nature'],
        'frequency' => $validated['frequency'],
        'pertinance' => $validated['pertinence'],
        'realite' => $validated['reality'],
        'efficiency' => $validated['efficiency'],
        'owner_id' => $validated['owner_id'],
        'organization_id' => $currentOrgId,
        'is_active' => $validated['is_active'] ?? true,
    ]);


    $control->risks()->sync($validated['risk_ids']);



    if (!$isAuditMode) {

        $risks = Risk::whereIn('id', $validated['risk_ids'])->get();

        $effectivenessMap = [
            'efficient' => 'effective',
            'partially-efficient' => 'partial',
            'inefficient' => 'none'
        ];

        $effectiveness = $effectivenessMap[$validated['efficiency']] ?? null;

        foreach ($risks as $risk) {

            $score = $risk->inherent_impact * $risk->inherent_likelihood;

            $riskLevel = RiskScoreLevel::where('min', '<=', $score)
                ->where('max', '>=', $score)
                ->first();

            if (!$riskLevel) {
                continue;
            }

            $controlSetting = ControlSetting::where('risk_level', $riskLevel->label)
                ->where('effectiveness', $effectiveness)
                ->where('organization_id', $currentOrgId)
                ->first();

            if (!$controlSetting) {
                continue;
            }

            $risk->update([
                'residual_likelihood' => $controlSetting->probability,
                'residual_impact' => $controlSetting->impact
            ]);

            RiskHistory::create([
            "resImpact" => $controlSetting->impact,
            "resProbability" =>$controlSetting->probability,
            "control_id" =>$control->id,
            "type" => "residual",
            "score" => $controlSetting->impact * $controlSetting->probability,
            "risk_id" =>$risk->id,
            "changed_by" => $user->id,
        ]);
        }
    }

    return redirect('controls')->with('success', 'Control created successfully');
}

 public function edit(Control $control, Request $request)
{
    $this->authorizeControl($control, $request);

    $currentOrgId = $request->user()->current_organization_id;

    $control->load('risks');

    $risks = Risk::where('organization_id', $currentOrgId)
        ->where('is_active', 1)
        ->get(['id', 'name']);

    $owners = User::whereHas('organizations', function ($query) use ($currentOrgId) {
        $query->where('organization_id', $currentOrgId);
    })
    ->select('id', 'name')
    ->orderBy('name')
    ->get();

    return Inertia::render('controle/edit', [
        'control' => $control,
        'risks' => $risks,
        'owners' => $owners,
        'selectedRisks' => $control->risks->pluck('id'),

    ]);
}

 public function update(Request $request, Control $control)
{



    $currentOrgId = $request->user()->current_organization_id;
 $isAuditMode = AppSetting::where('key', 'mode')->value('value') === 'audit';
 if($isAuditMode)
  {
      $validated = $request->validate([
        'code' => [
            'required',
            'string',
            Rule::unique('controls')
                ->where('organization_id', $currentOrgId)
                ->ignore($control->id)
        ],
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'control_type' => 'required|string',
        'control_nature' => 'required|string',
        'frequency' => 'required|string',
                'reality' => 'nullable|string',
          'pertinence' => 'nullable|string',
        'efficiency' => 'nullable|string',

        'owner_id' => [
            'required',
            Rule::exists('users', 'id')
        ],
        'risk_ids' => 'required|array|min:1',
        'risk_ids.*' => [
            Rule::exists('risks', 'id')
                ->where('organization_id', $currentOrgId)
        ],
        'is_active' => 'boolean',
    ]);
  }else{
     $validated = $request->validate([
        'code' => [
            'required',
            'string',
            Rule::unique('controls')
                ->where('organization_id', $currentOrgId)
                ->ignore($control->id)
        ],
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'control_type' => 'required|string',
        'control_nature' => 'required|string',
        'frequency' => 'required|string',
                'reality' => 'required|string',
          'pertinence' => 'required|string',
        'efficiency' => 'required|string',

        'owner_id' => [
            'required',
            Rule::exists('users', 'id')
        ],
        'risk_ids' => 'required|array|min:1',
        'risk_ids.*' => [
            Rule::exists('risks', 'id')
                ->where('organization_id', $currentOrgId)
        ],
        'is_active' => 'boolean',
    ]);
  }

    try {

        $control->update([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'control_type' => $validated['control_type'],
            'control_nature' => $validated['control_nature'],
            'frequency' => $validated['frequency'],
            'pertinance' => $validated['pertinence'],
            'realite' => $validated['reality'],
            'efficiency' => $validated['efficiency'],
            'owner_id' => $validated['owner_id'],
            'is_active' => $validated['is_active'] ?? $control->is_active,
        ]);

        $control->risks()->sync($validated['risk_ids']);

       

    if (!$isAuditMode) {
        foreach ($validated['risk_ids'] as $riskId) {

            $risk = Risk::find($riskId);

            if (!$risk) continue;

            $impact = $risk->inherent_impact;
            $probability = $risk->inherent_likelihood;

            $score = $impact * $probability;

            $riskLevel = RiskScoreLevel::where('min', '<=', $score)
                ->where('max', '>=', $score)
                ->first();

            if (!$riskLevel) continue;

            $effectivenessMap = [
                'efficient' => 'effective',
                'partially-efficient' => 'partial',
                'inefficient' => 'none'
            ];

            $effectiveness = $effectivenessMap[$validated['efficiency']] ?? null;

            $controlSetting = ControlSetting::where('risk_level', $riskLevel->label)
                ->where('effectiveness', $effectiveness)
                ->where('organization_id', $currentOrgId)
                ->first();

            if (!$controlSetting) continue;

           // dd($controlSetting->probability,$controlSetting->impact);
            $risk->update([
                'residual_likelihood' => $controlSetting->probability,
                'residual_impact' => $controlSetting->impact
            ]);
             RiskHistory::create([
            "resImpact" => $controlSetting->impact,
            "resProbability" =>$controlSetting->probability,
            "control_id" =>$control->id,
            "type" => "residual",
            "score" =>  $controlSetting->impact * $controlSetting->probability,
            "risk_id" =>$risk->id,
            "changed_by" => $request->user()->id,
        ]);
        }
    }
        return redirect('controls')
            ->with('success', 'Control updated successfully.');

    } catch (\Exception $e) {

        return back()->with('error', $e->getMessage());
    }
}

 public function destroy($id)
{
    $control= Control::find($id);

    $control->delete();

    return redirect()->back()
        ->with('success', 'Control deleted successfully.');
}

    private function authorizeControl(Control $control, Request $request)
    {
        if ($control->organization_id !== $request->user()->current_organization_id) {
            abort(403, 'Unauthorized');
        }
    }

    public function show(Control $control, Request $request)
{

    $this->authorizeControl($control, $request);
 $currentOrgId = $request->user()->current_organization_id;

    $control->load(['owner', 'risks']);
    $activeConfiguration = \App\Models\RiskConfiguration::forOrganization($currentOrgId)->first();
     $configData = null;
        if ($activeConfiguration) {
            $configData = $activeConfiguration->toConfigArray();
        }
    return Inertia::render('controle/show', [
        'control' => $control,
              'activeConfiguration' => $configData,
    ]);
}
}
