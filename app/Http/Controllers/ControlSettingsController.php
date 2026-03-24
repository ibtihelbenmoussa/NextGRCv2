<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RiskConfiguration;
use App\Models\ControlSetting;
use Illuminate\Support\Facades\DB;

class ControlSettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id ?? null;

        if (!$currentOrgId) {
            return redirect()
                ->route('organizations.select.page')
                ->with('error', 'Veuillez sélectionner une organisation.');
        }

        $activeConfiguration = RiskConfiguration::forOrganization($currentOrgId)->first();

        $configData = null;
        $matrix = [];

        if ($activeConfiguration) {

            $configData = $activeConfiguration->toConfigArray();

            $settings = ControlSetting::where('organization_id', $currentOrgId)->get();

            foreach ($settings as $setting) {

                $riskLevelKey = trim($setting->risk_level);

                $matrix[$riskLevelKey][$setting->effectiveness] = [
                    'impact' => (int) trim($setting->impact),
                    'probability' => (int) trim($setting->probability),
                ];
            }
        }

        return Inertia::render('controle/setting/index', [
            'activeConfiguration' => $configData,
            'savedMatrix' => $matrix,
        ]);
    }

    public function store(Request $request)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    $matrix = $request->matrix ?? [];

    DB::transaction(function () use ($matrix, $currentOrgId) {

        foreach ($matrix as $riskLevel => $effectivenessTypes) {

            foreach ($effectivenessTypes as $effectiveness => $values) {

                if (
                    isset($values['impact']) &&
                    isset($values['probability'])
                ) {

                    $impact = (int) trim($values['impact']);
                    $probability = (int) trim($values['probability']);
                    $score = $impact * $probability;

                    ControlSetting::updateOrCreate(
                        [
                            'organization_id' => $currentOrgId,
                            'risk_level' => trim($riskLevel),
                            'effectiveness' => trim($effectiveness),
                        ],
                        [
                            'impact' => $impact,
                            'probability' => $probability,
                            'score' => $score,
                        ]
                    );
                }
            }
        }
    });

    return back()->with('success', 'Configuration saved.');
}
}