<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManagementComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_mission_id',
        'test_id',
        'finding',
        'management_response',
        'action_plan',
        'responsible_user_id',
        'target_date',
        'status',
        'submitted_by',
        'submitted_at',
    ];

    protected $casts = [
        'target_date' => 'date',
        'submitted_at' => 'datetime',
    ];

    /**
     * Get the audit mission that owns the management comment.
     */
    public function auditMission(): BelongsTo
    {
        return $this->belongsTo(AuditMission::class);
    }

    /**
     * Get the test related to the management comment.
     */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /**
     * Get the user responsible for the action plan.
     */
    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    /**
     * Get the user who submitted the comment.
     */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
