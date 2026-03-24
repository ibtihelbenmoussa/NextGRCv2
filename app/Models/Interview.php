<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_mission_id',
        'interviewee_id',
        'title',
        'purpose',
        'scheduled_at',
        'conducted_at',
        'location',
        'notes',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'conducted_at' => 'datetime',
    ];

    /**
     * Get the audit mission that owns the interview.
     */
    public function auditMission(): BelongsTo
    {
        return $this->belongsTo(AuditMission::class);
    }

    /**
     * Get the interviewee.
     */
    public function interviewee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'interviewee_id');
    }
}
