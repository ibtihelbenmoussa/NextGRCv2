<?php

namespace App\Http\Controllers;

use App\Models\RiskConfiguration;
use App\Services\RiskCalculationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RiskConfigurationController extends Controller
{
    protected RiskCalculationService $riskCalculationService;

    public function __construct(RiskCalculationService $riskCalculationService)
    {
        $this->riskCalculationService = $riskCalculationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $organizationId = Auth::user()->current_organization_id;

        $configurations = RiskConfiguration::forOrganization($organizationId)
            ->with(['impacts', 'probabilities', 'criterias.impacts', 'scoreLevels'])
            ->get()
            ->map(function (RiskConfiguration $config) {
                return $config->toConfigArray();
            });

        $canManageRiskConfigurations = Auth::user()->hasPermissionTo('manage risk configurations');

        return Inertia::render('risk-configurations/index', [
            'configurations' => $configurations,
            'canManageRiskConfigurations' => $canManageRiskConfigurations,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $canManageRiskConfigurations = Auth::user()->hasPermissionTo('manage risk configurations');

        if (!$canManageRiskConfigurations) {
            abort(403, 'You do not have permission to create risk configurations.');
        }

        return Inertia::render('risk-configurations/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //dd($request);
        $request->validate([
            'name' => 'required|string|max:255',
            'impact_scale_max' => 'required|integer|min:2|max:10',
            'probability_scale_max' => 'required|integer|min:2|max:10',
            'calculation_method' => 'required|in:avg,max',
            'use_criterias' => 'required|boolean',
            'impacts' => 'required|array',
            'impacts.*.label' => 'required|string',
            'impacts.*.score' => 'required|numeric',
            'impacts.*.color' => 'nullable|string',
            'impacts.*.order' => 'required|integer',
            'probabilities' => 'required|array',
            'probabilities.*.label' => 'required|string',
            'probabilities.*.score' => 'required|numeric',
            'probabilities.*.order' => 'required|integer',
            'criterias' => 'nullable|array',
            'criterias.*.name' => 'required|string',
            'criterias.*.description' => 'nullable|string',
            'criterias.*.order' => 'required|integer',
            'criterias.*.impacts' => 'required|array',
            'criterias.*.impacts.*.impact_label' => 'required|string',
            'criterias.*.impacts.*.score' => 'required|numeric',
            'criterias.*.impacts.*.order' => 'required|integer',
            'score_levels' => 'required|array',
            'score_levels.*.label' => 'required|string',
            'score_levels.*.min' => 'required|integer|min:1',
            'score_levels.*.max' => 'required|integer|min:1',
            'score_levels.*.color' => 'required|string',
            'score_levels.*.order' => 'required|integer',
        ]);

        $organizationId = Auth::user()->current_organization_id;

        $configData = [
            'organization_id' => $organizationId,
            'name' => $request->name,
            'impact_scale_max' => $request->impact_scale_max,
            'probability_scale_max' => $request->probability_scale_max,
            'calculation_method' => $request->calculation_method,
            'use_criterias' => $request->use_criterias,
        ];

        $impactsData = $request->impacts;
        $probabilitiesData = $request->probabilities;
        $criteriasData = $request->criterias ?? [];
        $scoreLevelsData = $request->score_levels ?? [];

        // Validate configuration
        $errors = $this->riskCalculationService->validateRiskConfiguration(
            $configData,
            $impactsData,
            $probabilitiesData,
            $criteriasData
        );

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        try {
            $configuration = $this->riskCalculationService->createRiskConfiguration(
                $configData,
                $impactsData,
                $probabilitiesData,
                $criteriasData,
                $scoreLevelsData
            );

            return redirect()->route('risk-configurations.index')
                ->with('success', 'Risk configuration created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create risk configuration: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(RiskConfiguration $riskConfiguration)
    {
        $this->authorize('view', $riskConfiguration);

        $configuration = $riskConfiguration->load(['impacts', 'probabilities', 'criterias.impacts', 'scoreLevels']);

        return Inertia::render('risk-configurations/show', [
            'configuration' => $configuration->toConfigArray(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RiskConfiguration $riskConfiguration)
    {
        $this->authorize('update', $riskConfiguration);

        $configuration = $riskConfiguration->load(['impacts', 'probabilities', 'criterias.impacts', 'scoreLevels']);

        return Inertia::render('risk-configurations/edit', [
            'configuration' => $configuration->toConfigArray(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RiskConfiguration $riskConfiguration)
    {
       // dd($request);
        $this->authorize('update', $riskConfiguration);

        $request->validate([
            'name' => 'required|string|max:255',
            'impact_scale_max' => 'required|integer|min:2|max:10',
            'probability_scale_max' => 'required|integer|min:2|max:10',
            'calculation_method' => 'required|in:avg,max',
            'use_criterias' => 'required|boolean',
            'impacts' => 'required|array',
            'impacts.*.label' => 'required|string',
            'impacts.*.score' => 'required|numeric',
            'impacts.*.color' => 'nullable|string',
            'impacts.*.order' => 'required|integer',
            'probabilities' => 'required|array',
            'probabilities.*.label' => 'required|string',
            'probabilities.*.score' => 'required|numeric',
            'probabilities.*.order' => 'required|integer',
            'criterias' => 'nullable|array',
            'criterias.*.name' => 'required|string',
            'criterias.*.description' => 'nullable|string',
            'criterias.*.order' => 'required|integer',
            'criterias.*.impacts' => 'required|array',
            'criterias.*.impacts.*.impact_label' => 'required|string',
            'criterias.*.impacts.*.score' => 'required|numeric',
            'criterias.*.impacts.*.order' => 'required|integer',
            'score_levels' => 'required|array',
            'score_levels.*.label' => 'required|string',
            'score_levels.*.min' => 'required|integer|min:1',
            'score_levels.*.max' => 'required|integer|min:1',
            'score_levels.*.color' => 'required|string',
            'score_levels.*.order' => 'required|integer',
        ]);

        $configData = [
            'name' => $request->name,
            'impact_scale_max' => $request->impact_scale_max,
            'probability_scale_max' => $request->probability_scale_max,
            'calculation_method' => $request->calculation_method,
            'use_criterias' => $request->use_criterias,
        ];

        $impactsData = $request->impacts;
        $probabilitiesData = $request->probabilities;
        $criteriasData = $request->criterias ?? [];
        $scoreLevelsData = $request->score_levels ?? [];

        // Validate configuration
        $errors = $this->riskCalculationService->validateRiskConfiguration(
            $configData,
            $impactsData,
            $probabilitiesData,
            $criteriasData
        );

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        try {
            $configuration = $this->riskCalculationService->updateRiskConfiguration(
                $riskConfiguration,
                $configData,
                $impactsData,
                $probabilitiesData,
                $criteriasData,
                $scoreLevelsData
            );

            return redirect()->route('risk-configurations.index')
                ->with('success', 'Risk configuration updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update risk configuration: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RiskConfiguration $riskConfiguration)
    {
        $this->authorize('delete', $riskConfiguration);

        try {
            $riskConfiguration->delete();

            return redirect()->route('risk-configurations.index')
                ->with('success', 'Risk configuration deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete risk configuration: ' . $e->getMessage()]);
        }
    }

    /**
     * Calculate risk score using the configuration
     */
    public function calculateRiskScore(Request $request): JsonResponse
    {
        $request->validate([
            'impact_score' => 'required|numeric|min:0',
            'probability_score' => 'required|numeric|min:0',
        ]);

        $organizationId = Auth::user()->current_organization_id;

        try {
            $result = $this->riskCalculationService->calculateRiskScore(
                $organizationId,
                $request->impact_score,
                $request->probability_score
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get risk matrix data for visualization
     */
    public function getRiskMatrixData(): JsonResponse
    {
        $organizationId = Auth::user()->current_organization_id;

        try {
            $data = $this->riskCalculationService->getRiskMatrixData($organizationId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
