<?php

namespace App\Notifications;

use App\Models\ActionPlan;
use Illuminate\Notifications\Notification;

class ActionPlanDueReminder extends Notification
{
    public function __construct(
        public ActionPlan $plan,
        public int $daysRemaining,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database']; 
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'action_plan_id' => $this->plan->id,
            'object'         => $this->buildMessage(),
            'days_remaining' => $this->daysRemaining,
            'due_date'       => $this->plan->due_date,
        ];
    }

    private function buildMessage(): string
    {
        return match($this->daysRemaining) {
            0  => "Due today: {$this->plan->title}",
            3  => "Due in 3 days: {$this->plan->title}",
            7  => "Due in 7 days: {$this->plan->title}",
            15 => "Due in 15 days: {$this->plan->title}",
            default => "Upcoming: {$this->plan->title}",
        };
    }
}