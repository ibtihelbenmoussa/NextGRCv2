<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionPlanLog extends Model
{
    protected $fillable = [
        'action_plan_id',
        'user_id',
        'event',
        'field',
        'old_value',
        'new_value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function actionPlan(): BelongsTo
    {
        return $this->belongsTo(ActionPlan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Label lisible pour le champ modifié
    public function getFieldLabelAttribute(): string
    {
        return match($this->field) {
            'status'      => 'Status',
            'assigned_to' => 'Assigned to',
            'due_date'    => 'Due date',
            default       => ucfirst($this->field ?? $this->event),
        };
    }
}