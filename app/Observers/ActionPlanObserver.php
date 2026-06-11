<?php

namespace App\Observers;

use App\Models\ActionPlan;
use App\Models\ActionPlanLog;
use App\Notifications\ActionPlanDueReminder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ActionPlanObserver
{
    private array $tracked = ['status', 'assigned_to', 'due_date'];

    // ── History log (avant save) ───────────────────────────────────────────
    public function updating(ActionPlan $actionPlan): void
    {
        $userId = Auth::id();

        foreach ($this->tracked as $field) {
            if (!$actionPlan->isDirty($field)) continue;

            $old = $actionPlan->getOriginal($field);
            $new = $actionPlan->getAttribute($field);

            if ($field === 'due_date') {
                $old = $old ? Carbon::parse($old)->format('Y-m-d') : null;
                $new = $new ? Carbon::parse($new)->format('Y-m-d') : null;
            }

            if ($field === 'assigned_to') {
                $old = $old ? \App\Models\User::find($old)?->name : null;
                $new = $new ? \App\Models\User::find($new)?->name : null;
            }

            ActionPlanLog::create([
                'action_plan_id' => $actionPlan->id,
                'user_id'        => $userId,
                'event'          => $field . '_changed',
                'field'          => $field,
                'old_value'      => $old,
                'new_value'      => $new,
            ]);
        }
    }

    // ── Created log ────────────────────────────────────────────────────────
    public function created(ActionPlan $actionPlan): void
    {
        ActionPlanLog::create([
            'action_plan_id' => $actionPlan->id,
            'user_id'        => Auth::id() ?? $actionPlan->assigned_to,
            'event'          => 'created',
            'field'          => null,
            'old_value'      => null,
            'new_value'      => null,
        ]);
    }

    // ── Due date reminder (après save) ────────────────────────────────────
    public function updated(ActionPlan $plan): void
    {
        if (!$plan->isDirty('due_date')) return;
        if (!$plan->assignedUser) return;
        if (in_array($plan->status, ['closed', 'done'])) return;

        $days = (int) Carbon::today()->diffInDays(Carbon::parse($plan->due_date), false);

        if (!in_array($days, [0, 3, 7, 15])) return;

        $plan->assignedUser->notify(new ActionPlanDueReminder($plan, $days));
    }
}