<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ActionPlan;
use App\Notifications\ActionPlanDueReminder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CheckActionPlanDeadlines extends Command
{
    protected $signature = 'actionplans:check-deadlines';
    protected $description = 'Send deadline reminders for action plans due in 15, 7, 3, or 0 days';

    public function handle(): void
    {
        $thresholds = [15, 7, 3, 0];
        $today = Carbon::today();
        $sent = 0;

        $plans = ActionPlan::whereNotNull('due_date')
            ->whereNotIn('status', ['closed', 'done'])
            ->whereNotNull('assigned_to')
            ->with('assignedUser')
            ->get();

        foreach ($plans as $plan) {
            $daysRemaining = (int) $today->diffInDays(
                Carbon::parse($plan->due_date), false
            );

            if (!in_array($daysRemaining, $thresholds)) {
                continue;
            }

            // éviter les doublons
            $alreadySent = DB::table('notifications')
                ->where('notifiable_id', $plan->assigned_to)
                ->where('notifiable_type', 'App\\Models\\User')
                ->whereRaw("JSON_EXTRACT(data, '$.action_plan_id') = ?", [$plan->id])
                ->whereRaw("JSON_EXTRACT(data, '$.days_remaining') = ?", [$daysRemaining])
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $plan->assignedUser->notify(
                new ActionPlanDueReminder($plan, $daysRemaining)
            );

            $sent++;
        }

        $this->info("Done — {$sent} notification(s) sent.");
    }
}