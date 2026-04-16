<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'gap_id',
        'assigned_to',
        'title',
        'description',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    // ── Relations ──────────────────────────────────────────────

    public function gap(): BelongsTo
    {
        return $this->belongsTo(GapAssessment::class, 'gap_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // ── Helpers ────────────────────────────────────────────────

    public function isOverdue(): bool
    {
        return $this->status !== 'done'
            && $this->due_date->isPast();
    }
}