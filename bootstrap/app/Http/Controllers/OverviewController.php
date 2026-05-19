<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OverviewController extends Controller
{
    public function index(Request $request)
    {
        $currentOrganizationId = $request->user()->current_organization_id;

        $organization = null;

        if ($currentOrganizationId) {
            $organization = Organization::with([
                'businessUnits' => function ($query) {
                    $query->where('is_active', true)
                        ->withCount('macroProcesses')
                        ->with([
                            'macroProcesses' => function ($query) {
                                $query->where('is_active', true)
                                    ->withCount('processes')
                                    ->with([
                                        'processes' => function ($query) {
                                            $query->where('is_active', true)
                                                ->withCount('risks');
                                        }
                                    ]);
                            }
                        ]);
                },
            ])
                ->withCount('businessUnits')
                ->find($currentOrganizationId);
        }

        return Inertia::render('overview/index', [
            'organization' => $organization,
        ]);
    }
}
