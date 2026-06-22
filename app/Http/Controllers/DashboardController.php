<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\ActionPlan;
use App\Models\GapAssessment;
use App\Models\RequirementTest;
use App\Models\Framework;
use App\Models\BusinessUnit;
use App\Models\Process;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\DatabaseNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $orgId = session('current_organization_id');

        if (!$orgId) {
            $orgId = Auth::user()->organizations()->first()?->id;
        }

        if (!$orgId) {
            return redirect()->route('organizations.select.page');
        }

        return Inertia::render('dashboard', [
            'kpis' => $this->getKpis($orgId),
            'recentActivity' => $this->getRecentActivity(),
            'deadlines' => $this->getDeadlines($orgId),
            'radarData' => $this->getRadarData($orgId),
            'heatmapData' => $this->getHeatmapData($orgId),
            'businessUnitCompliance' => $this->getComplianceByBusinessUnit($orgId),
            'complianceEvolution' => $this->getComplianceEvolution($orgId),
            'topCriticalGaps' => $this->getTopCriticalGaps($orgId),
            'overdueActionPlans' => $this->getOverdueActionPlans($orgId),
            'executiveSummary' => $this->getExecutiveSummary($orgId),
            'recommendations' => $this->getSmartRecommendations($orgId),
            'processCompliance' => $this->getProcessCompliance($orgId),
            'frameworkComparison' => $this->getFrameworkComparison($orgId),
            // Fi getKpis() — awel el return array, zid:
            'all_plans' => ActionPlan::whereHas(
                'gapAssessment',
                fn($q) => $q->where('organization_id', $orgId)->where('is_deleted', 0)
            )
                ->with('assignedUser:id,name')
                ->select(['id', 'title', 'description', 'status', 'due_date', 'assigned_to'])
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status,
                    'due_date' => $p->due_date?->format('Y-m-d'),
                    'assigned_to' => $p->assigned_to,
                    'assigned_user_name' => $p->assignedUser?->name,
                    'description' => $p->description,
                    'gap_assessment_name' => null,
                    'gap_assessment_code' => null,
                ]),
        ]);
    }
    private function getAllPlans(int $orgId): array
    {
        return ActionPlan::whereHas(
            'gapAssessment',
            fn($q) => $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )
            ->with('assignedUser:id,name')
            ->select(['id', 'title', 'description', 'status', 'due_date', 'assigned_to'])
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'status' => $p->status,
                'due_date' => $p->due_date?->format('Y-m-d'),
                'assigned_to' => $p->assigned_to,
                'assigned_user_name' => $p->assignedUser?->name,
                'description' => $p->description ?? '',
                'gap_assessment_name' => null,
                'gap_assessment_code' => null,
            ])
            ->toArray();
    }

    // ─── KPIs ────────────────────────────────────────────────────────────────

    private function getKpis(int $orgId): array
    {
        $assessments = GapAssessment::where('organization_id', $orgId)
            ->where('is_deleted', 0);

        $avgMaturity = (clone $assessments)
            ->whereNotNull('maturity_level')
            ->avg('maturity_level');

        // ✅ FIX : utiliser le vrai score (précis) au lieu de maturity_level (approximatif)
        $avgScore = (clone $assessments)
            ->whereNotNull('score')
            ->avg('score');

        $complianceScore = $avgScore !== null
            ? round($avgScore)
            : ($avgMaturity ? round(($avgMaturity / 5) * 100) : 0);

        $plans = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        );

        return [
            'compliance_score' => $complianceScore,
            'avg_maturity' => round($avgMaturity ?? 0, 1),
            'action_plans' => [
                'total' => (clone $plans)->count(),
                'overdue' => (clone $plans)->where('status', 'overdue')->count(),
                'in_progress' => (clone $plans)->where('status', 'in_progress')->count(),
                'done' => (clone $plans)->where('status', 'completed')->count(),
            ],
            'gap_assessments' => [
                'total' => (clone $assessments)->count(),
                'this_month' => (clone $assessments)
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'avg_score' => round((clone $assessments)->avg('score') ?? 0, 1),
            ],
        ];
    }

    // ─── Activity Feed ───────────────────────────────────────────────────────

    private function getRecentActivity(): array
    {
        return DatabaseNotification::where('notifiable_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'info',
                'message' => $n->data['message'] ?? '',
                'time' => Carbon::parse($n->created_at)->diffForHumans(),
                'read' => !is_null($n->read_at),
            ])
            ->toArray();
    }

    // ─── Deadlines ───────────────────────────────────────────────────────────

    private function getDeadlines(int $orgId): array
    {
        $tests = RequirementTest::with('requirement:id,name')
            ->whereNotNull('effective_date')
            ->where('status', '!=', 'completed')
            ->orderBy('effective_date')
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->requirement->name ?? ('Test #' . $t->id),
                'due_date' => $t->effective_date?->format('Y-m-d'),
                'type' => 'test',
                'status' => $this->deadlineStatus($t->effective_date),
            ]);

        $plans = ActionPlan::with('gapAssessment:id,code')
            ->whereNotNull('due_date')
            ->where('status', '!=', 'completed')
            ->whereHas(
                'gapAssessment',
                fn($q) =>
                $q->where('organization_id', $orgId)
            )
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->title ?? ('Plan ' . ($p->gapAssessment?->code ?? '#' . $p->id)),
                'due_date' => $p->due_date?->format('Y-m-d'),
                'type' => 'action_plan',
                'status' => $this->deadlineStatus($p->due_date),
            ]);

        return $tests->concat($plans)
            ->sortBy('due_date')
            ->values()
            ->take(7)
            ->toArray();
    }

    private function deadlineStatus($date): string
    {
        if (!$date)
            return 'ok';
        $diff = Carbon::parse($date)->diffInDays(now(), false);
        if ($diff > 0)
            return 'overdue';
        if ($diff > -4)
            return 'soon';
        return 'ok';
    }

    // ─── Radar Data ──────────────────────────────────────────────────────────

    private function getRadarData(int $orgId): array
    {
        return Framework::where('organization_id', $orgId)
            ->limit(6)
            ->get()
            ->map(fn($f) => [
                'framework' => $f->name,
                'score' => round(
                    GapAssessment::where('organization_id', $orgId)
                        ->where('framework_id', $f->id)
                        ->where('is_deleted', 0)
                        ->whereNotNull('maturity_level')
                        ->avg('maturity_level') ?? 0,
                    1
                ),
                'target' => 5,
            ])
            ->toArray();
    }

    // ─── Heatmap ─────────────────────────────────────────────────────────────

    private function getHeatmapData(int $orgId): array
    {
        $frameworks = Framework::where('organization_id', $orgId)->limit(5)->get();

        return $frameworks->map(fn($fw) => [
            'framework' => $fw->name,
            'scores' => GapAssessment::where('organization_id', $orgId)
                ->where('framework_id', $fw->id)
                ->whereNotNull('maturity_level')
                ->select('code', 'name', 'maturity_level')
                ->limit(5)
                ->get()
                ->map(fn($a) => [
                    'bu' => $a->code ?? substr($a->name ?? 'N/A', 0, 8),
                    'score' => round($a->maturity_level, 1),
                ])
                ->toArray(),
        ])->filter(fn($row) => count($row['scores']) > 0)
            ->values()
            ->toArray();
    }

    // ─── Compliance by Business Unit ─────────────────────────────────────────

    private function getComplianceByBusinessUnit(int $orgId): array
    {
        $businessUnits = BusinessUnit::where('organization_id', $orgId)->get();

        return $businessUnits->map(function ($bu) {
            $avgScore = GapAssessment::whereHas('requirements.processes.macroProcess', function ($q) use ($bu) {
                $q->where('business_unit_id', $bu->id);
            })
                ->whereNotNull('score')
                ->avg('score');

            $avgMaturity = GapAssessment::whereHas('requirements.processes.macroProcess', function ($q) use ($bu) {
                $q->where('business_unit_id', $bu->id);
            })
                ->whereNotNull('maturity_level')
                ->avg('maturity_level');

            $count = GapAssessment::whereHas('requirements.processes.macroProcess', function ($q) use ($bu) {
                $q->where('business_unit_id', $bu->id);
            })
                ->whereNotNull('maturity_level')
                ->count();

            return [
                'name' => $bu->name,
                'code' => $bu->code,
                'score' => $avgScore !== null
                    ? round($avgScore)
                    : ($avgMaturity ? round(($avgMaturity / 5) * 100) : 0),
                'count' => $count,
            ];
        })
            ->filter(fn($row) => $row['count'] > 0)
            ->sortByDesc('score')
            ->values()
            ->toArray();
    }
    // ─── NEW: Compliance Evolution (last 6 months) ────────────────────────────

    private function getComplianceEvolution(int $orgId): array
    {
        $months = collect(range(5, 0))->map(function ($i) use ($orgId) {
            $date = now()->subMonths($i);

            // ✅ FIX : cumAvg basé sur "score" au lieu de "maturity_level"
            $cumAvgScore = GapAssessment::where('organization_id', $orgId)
                ->where('is_deleted', 0)
                ->whereNotNull('score')
                ->where('created_at', '<=', $date->endOfMonth())
                ->avg('score');

            $cumAvgMaturity = GapAssessment::where('organization_id', $orgId)
                ->where('is_deleted', 0)
                ->whereNotNull('maturity_level')
                ->where('created_at', '<=', $date->endOfMonth())
                ->avg('maturity_level');

            $score = $cumAvgScore !== null
                ? round($cumAvgScore, 1)
                : ($cumAvgMaturity ? round(($cumAvgMaturity / 5) * 100, 1) : 0);

            return [
                'month' => $date->format('M Y'),
                'score' => $score,
                'new_assessments' => GapAssessment::where('organization_id', $orgId)
                    ->where('is_deleted', 0)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        });

        return $months->toArray();
    }

    // ─── NEW: Top Critical Gap Assessments ───────────────────────────────────

    private function getTopCriticalGaps(int $orgId): array
    {
        return GapAssessment::with('framework:id,name')
            ->where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->whereNotNull('maturity_level')
            ->where('maturity_level', '<=', 2) // Critical = low maturity
            ->orderBy('maturity_level')
            ->limit(6)
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name ?? $g->code,
                'code' => $g->code,
                'framework' => $g->framework?->name ?? 'N/A',
                'maturity' => round($g->maturity_level, 1),
                'score' => round(($g->maturity_level / 5) * 100),
                'status' => $g->status ?? 'in_progress',
                'severity' => $g->maturity_level <= 1 ? 'critical' : 'high',
            ])
            ->toArray();
    }

    // ─── NEW: Overdue Action Plans ────────────────────────────────────────────

    private function getOverdueActionPlans(int $orgId): array
    {
        return ActionPlan::with('gapAssessment:id,code,name')
            ->whereHas(
                'gapAssessment',
                fn($q) =>
                $q->where('organization_id', $orgId)->where('is_deleted', 0)
            )
            ->where(function ($q) {
                $q->where('status', 'overdue')
                    ->orWhere(function ($q2) {
                        $q2->whereNotNull('due_date')
                            ->where('due_date', '<', now())
                            ->where('status', '!=', 'completed');
                    });
            })
            ->orderBy('due_date')
            ->limit(6)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->title ?? ('Plan #' . $p->id),
                'gap' => $p->gapAssessment?->code ?? $p->gapAssessment?->name ?? 'N/A',
                'due_date' => $p->due_date?->format('Y-m-d'),
                'days_overdue' => $p->due_date ? (int) Carbon::parse($p->due_date)->diffInDays(now()) : 0,
                'priority' => $p->priority ?? 'medium',
                'status' => $p->status,
            ])
            ->toArray();
    }

    // ─── NEW: Executive Summary ───────────────────────────────────────────────

    private function getExecutiveSummary(int $orgId): array
    {
        $buCompliance = $this->getComplianceByBusinessUnit($orgId);

        $best = collect($buCompliance)->sortByDesc('score')->first();
        $worst = collect($buCompliance)->sortBy('score')->first();

        $criticalGaps = GapAssessment::where('organization_id', $orgId)
            ->where('is_deleted', 0)
            ->whereNotNull('maturity_level')
            ->where('maturity_level', '<=', 2)
            ->count();

        $overdueCount = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )
            ->where(function ($q) {
                $q->where('status', 'overdue')
                    ->orWhere(fn($q2) => $q2->whereNotNull('due_date')->where('due_date', '<', now())->where('status', '!=', 'completed'));
            })
            ->count();

        $totalAssessments = GapAssessment::where('organization_id', $orgId)
            ->where('is_deleted', 0)->count();

        $completedPlans = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )
            ->where('status', 'completed')->count();

        $totalPlans = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )->count();

        return [
            'best_bu' => $best,
            'worst_bu' => $worst,
            'critical_gaps' => $criticalGaps,
            'overdue_plans' => $overdueCount,
            'total_assessments' => $totalAssessments,
            'remediation_rate' => $totalPlans > 0 ? round(($completedPlans / $totalPlans) * 100) : 0,
        ];
    }

    // ─── NEW: Smart Recommendations ──────────────────────────────────────────

    private function getSmartRecommendations(int $orgId): array
    {
        $recommendations = [];

        // 1. Frameworks with critical gaps
        $frameworks = Framework::where('organization_id', $orgId)->get();
        foreach ($frameworks as $fw) {
            $criticalCount = GapAssessment::where('organization_id', $orgId)
                ->where('framework_id', $fw->id)
                ->where('is_deleted', 0)
                ->whereNotNull('maturity_level')
                ->where('maturity_level', '<=', 2)
                ->count();

            $overdueCount = ActionPlan::whereHas(
                'gapAssessment',
                fn($q) =>
                $q->where('organization_id', $orgId)
                    ->where('framework_id', $fw->id)
                    ->where('is_deleted', 0)
            )
                ->where('status', 'overdue')
                ->count();

            if ($criticalCount > 0 || $overdueCount > 0) {
                $parts = [];
                if ($criticalCount > 0)
                    $parts[] = "{$criticalCount} critical gap" . ($criticalCount > 1 ? 's' : '');
                if ($overdueCount > 0)
                    $parts[] = "{$overdueCount} overdue action plan" . ($overdueCount > 1 ? 's' : '');

                $recommendations[] = [
                    'type' => 'critical',
                    'icon' => 'alert',
                    'title' => "Framework {$fw->name} needs attention",
                    'message' => ucfirst(implode(' and ', $parts)) . " detected. Immediate remediation is recommended.",
                    'priority' => $criticalCount + ($overdueCount * 2),
                ];
            }
        }

        // 2. Business unit with lowest compliance
        $buCompliance = $this->getComplianceByBusinessUnit($orgId);
        $worstBu = collect($buCompliance)->sortBy('score')->first();
        if ($worstBu && $worstBu['score'] < 60) {
            $recommendations[] = [
                'type' => 'warning',
                'icon' => 'building',
                'title' => "Business Unit \"{$worstBu['name']}\" underperforming",
                'message' => "Compliance score is {$worstBu['score']}% — below the 60% threshold. Consider prioritizing gap assessment reviews for this unit.",
                'priority' => 50 - $worstBu['score'],
            ];
        }

        // 3. Remediation rate
        $totalPlans = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )->count();
        $completedPlans = ActionPlan::whereHas(
            'gapAssessment',
            fn($q) =>
            $q->where('organization_id', $orgId)->where('is_deleted', 0)
        )->where('status', 'completed')->count();
        $rate = $totalPlans > 0 ? round(($completedPlans / $totalPlans) * 100) : 0;

        if ($rate < 50 && $totalPlans > 0) {
            $recommendations[] = [
                'type' => 'warning',
                'icon' => 'chart',
                'title' => "Low remediation rate ({$rate}%)",
                'message' => "Only {$completedPlans} out of {$totalPlans} action plans are completed. Accelerating remediation will improve your compliance posture.",
                'priority' => 30,
            ];
        }

        // 4. Positive reinforcement
        $bestBu = collect($buCompliance)->sortByDesc('score')->first();
        if ($bestBu && $bestBu['score'] >= 80) {
            $recommendations[] = [
                'type' => 'success',
                'icon' => 'star',
                'title' => "\"{$bestBu['name']}\" is a compliance leader",
                'message' => "This business unit achieves {$bestBu['score']}% compliance. Consider using its processes as a benchmark for other units.",
                'priority' => 0,
            ];
        }

        // Sort by priority desc, limit 5
        return collect($recommendations)
            ->sortByDesc('priority')
            ->values()
            ->take(5)
            ->toArray();
    }

    // ─── NEW: Process Compliance Analysis ────────────────────────────────────

    private function getProcessCompliance(int $orgId): array
    {
        $processes = Process::whereHas(
            'macroProcess.businessUnit',
            fn($q) =>
            $q->where('organization_id', $orgId)
        )
            ->with('macroProcess:id,name,business_unit_id')
            ->limit(10)
            ->get();

        return $processes->map(function ($process) use ($orgId) {
            $baseQuery = fn() => GapAssessment::where('organization_id', $orgId)
                ->where('is_deleted', 0)
                ->whereHas(
                    'requirements',
                    fn($q) =>
                    $q->whereHas(
                        'processes',
                        fn($q2) =>
                        $q2->where('processes.id', $process->id)
                    )
                );

            // ✅ FIX : utiliser "score" en priorité
            $avgScore = (clone $baseQuery())->whereNotNull('score')->avg('score');
            $avgMaturity = (clone $baseQuery())->whereNotNull('maturity_level')->avg('maturity_level');
            $count = (clone $baseQuery())->whereNotNull('maturity_level')->count();

            return [
                'id' => $process->id,
                'name' => $process->name,
                'macro' => $process->macroProcess?->name ?? 'N/A',
                'score' => $avgScore !== null
                    ? round($avgScore)
                    : ($avgMaturity ? round(($avgMaturity / 5) * 100) : 0),
                'maturity' => round($avgMaturity ?? 0, 1),
                'count' => $count,
            ];
        })
            ->filter(fn($row) => $row['count'] > 0)
            ->sortBy('score')
            ->values()
            ->toArray();
    }

    // ─── NEW: Framework Comparison ────────────────────────────────────────────

    private function getFrameworkComparison(int $orgId): array
    {
        return Framework::where('organization_id', $orgId)
            ->limit(8)
            ->get()
            ->map(function ($fw) use ($orgId) {
                $assessments = GapAssessment::where('organization_id', $orgId)
                    ->where('framework_id', $fw->id)
                    ->where('is_deleted', 0);

                $avgScore = (clone $assessments)->whereNotNull('score')->avg('score');
                $avgMaturity = (clone $assessments)->whereNotNull('maturity_level')->avg('maturity_level');
                $totalCount = (clone $assessments)->count();
                $critCount = (clone $assessments)->where('maturity_level', '<=', 2)->count();

                $overdueCount = ActionPlan::whereHas(
                    'gapAssessment',
                    fn($q) =>
                    $q->where('organization_id', $orgId)
                        ->where('framework_id', $fw->id)
                        ->where('is_deleted', 0)
                )
                    ->where(function ($q) {
                        $q->where('status', 'overdue')
                            ->orWhere(fn($q2) => $q2->whereNotNull('due_date')->where('due_date', '<', now())->where('status', '!=', 'completed'));
                    })
                    ->count();

                return [
                    'framework' => $fw->name,
                    'compliance' => $avgScore !== null ? round($avgScore) : ($avgMaturity ? round(($avgMaturity / 5) * 100) : 0),

                    'maturity' => round($avgMaturity ?? 0, 1),
                    'total' => $totalCount,
                    'critical' => $critCount,
                    'overdue_plans' => $overdueCount,
                ];
            })
            ->filter(fn($row) => $row['total'] > 0)
            ->sortByDesc('compliance')
            ->values()
            ->toArray();
    }
}