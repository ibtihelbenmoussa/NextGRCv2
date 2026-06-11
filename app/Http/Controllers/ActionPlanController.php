<?php

namespace App\Http\Controllers;

use App\Models\ActionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Exports\ActionPlansExport;
use Maatwebsite\Excel\Facades\Excel;

class ActionPlanController extends Controller
{
    public function index(Request $request)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        $query = ActionPlan::whereHas('assessment', fn($q) =>
            $q->where('organization_id', $orgId)
        )
        ->with([
            'assessment:id,name,code',
            'assignedUser:id,name',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('assessment', fn($q2) =>
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%")
                  )
                  ->orWhereHas('assignedUser', fn($q2) =>
                      $q2->where('name', 'like', "%{$search}%")
                  );
            });
        }

        $rawStatus = $request->input('status');
        if ($rawStatus) {
            $statuses = is_array($rawStatus)
                ? $rawStatus
                : array_filter(explode(',', $rawStatus));
            if (!empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }

        $rawSort = $request->input('sort', '');
        $sortDir = str_starts_with($rawSort, '-') ? 'desc' : 'asc';
        $sortCol = ltrim($rawSort, '-');

        $allowed = ['title', 'due_date', 'status', 'step_level', 'assigned_to', 'created_at'];
        if ($sortCol && in_array($sortCol, $allowed)) {
            $query->orderBy($sortCol, $sortDir);
        } else {
            $query->orderBy('step_level')->orderBy('step_index');
        }

        $plans = $query
            ->paginate($request->input('per_page', 15))
            ->withQueryString()
            ->through(fn($ap) => [
                'id'                  => $ap->id,
                'title'               => $ap->title,
                'description'         => $ap->description,
                'assigned_to'         => $ap->assigned_to,
                'assigned_user_name'  => $ap->assignedUser?->name,
                'due_date'            => $ap->due_date?->format('Y-m-d'),
                'status'              => $ap->status,
                'gap_assessment_id'   => $ap->gap_id,
                'gap_assessment_name' => $ap->assessment?->name,
                'gap_assessment_code' => $ap->assessment?->code,
                'step_level'          => $ap->step_level,
                'step_index'          => $ap->step_index,
            ]);

        $users = \App\Models\User::whereHas('organizations', fn($q) =>
            $q->where('organizations.id', $orgId)
        )->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('ActionPlans/Index', [
            'plans' => $plans,
            'users' => $users,
        ]);
    }

    public function getByAssessment($gapAssessment)
    {
        return response()->json(
            ActionPlan::where('gap_id', $gapAssessment)->get()
        );
    }

    // ── History log ────────────────────────────────────────────────────────
    public function logs(ActionPlan $actionPlan)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        abort_if(
            $actionPlan->assessment?->organization_id !== $orgId,
            403
        );

        $logs = $actionPlan->logs()
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($log) => [
                'id'          => $log->id,
                'event'       => $log->event,
                'field'       => $log->field,
                'field_label' => $log->field_label,
                'old_value'   => $log->old_value,
                'new_value'   => $log->new_value,
                'user_name'   => $log->user?->name ?? 'System',
                'created_at'  => $log->created_at->format('Y-m-d H:i'),
            ]);

        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        $query = ActionPlan::whereHas('assessment', fn($q) =>
            $q->where('organization_id', $orgId)
        )
        ->with(['assessment:id,name,code', 'assignedUser:id,name']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('assessment', fn($q2) =>
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%")
                  );
            });
        }

        if ($status = $request->input('status')) {
            $query->whereIn('status', explode(',', $status));
        }

        $plans = $query->orderBy('step_level')->orderBy('step_index')->get()
            ->map(fn($ap) => [
                'Assessment Code' => $ap->assessment?->code,
                'Assessment'      => $ap->assessment?->name,
                'Title'           => $ap->title,
                'Description'     => $ap->description,
                'Assigned To'     => $ap->assignedUser?->name,
                'Due Date'        => $ap->due_date?->format('Y-m-d'),
                'Status'          => $ap->status,
            ]);

        return Excel::download(
            new \App\Exports\CollectionExport($plans, [
                'Assessment Code', 'Assessment', 'Title', 'Description',
                'Assigned To', 'Due Date', 'Status',
            ]),
            'action-plans-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function update(Request $request, ActionPlan $actionPlan)
    {
        $user  = Auth::user();
        $orgId = $user->current_organization_id;

        abort_if(
            $actionPlan->assessment?->organization_id !== $orgId,
            403
        );

        $validated = $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
            'due_date'    => 'nullable|date',
            'status'      => 'nullable|in:open,in_progress,done',
        ]);

        $actionPlan->update($validated);

        return response()->json([
            'success' => true,
            'plan'    => [
                'id'                 => $actionPlan->id,
                'assigned_to'        => $actionPlan->assigned_to,
                'assigned_user_name' => $actionPlan->assignedUser?->name,
                'due_date'           => $actionPlan->due_date?->format('Y-m-d'),
                'status'             => $actionPlan->status,
            ],
        ]);
    }
    
}