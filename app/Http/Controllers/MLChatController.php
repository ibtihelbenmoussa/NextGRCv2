<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MLChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'question'               => 'required|string|max:500',
            'plans'                  => 'nullable|array',
            'kpis'                   => 'nullable|array',
            'executiveSummary'       => 'nullable|array',
            'topCriticalGaps'        => 'nullable|array',
            'overdueActionPlans'     => 'nullable|array',
            'recommendations'        => 'nullable|array',
            'frameworkComparison'    => 'nullable|array',
            'businessUnitCompliance' => 'nullable|array',
            'complianceEvolution'    => 'nullable|array',
            'processCompliance'      => 'nullable|array',
        ]);

        try {
            $mlUrl = config('services.ml.url', 'http://localhost:5000');

            $response = Http::timeout(15)->post("{$mlUrl}/chat", [
                'question'               => $request->input('question'),
                'plans'                  => $request->input('plans', []),
                'kpis'                   => $request->input('kpis', []),
                'executiveSummary'       => $request->input('executiveSummary', []),
                'topCriticalGaps'        => $request->input('topCriticalGaps', []),
                'overdueActionPlans'     => $request->input('overdueActionPlans', []),
                'recommendations'        => $request->input('recommendations', []),
                'frameworkComparison'    => $request->input('frameworkComparison', []),
                'businessUnitCompliance' => $request->input('businessUnitCompliance', []),
                'complianceEvolution'    => $request->input('complianceEvolution', []),
                'processCompliance'      => $request->input('processCompliance', []),
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'ML service error'], 502);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}