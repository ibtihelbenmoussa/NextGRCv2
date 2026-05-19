<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_mission_id',
        'title',
        'report_type',
        'executive_summary',
        'introduction',
        'scope_and_methodology',
        'findings',
        'recommendations',
        'conclusion',
        'status',
        'prepared_by',
        'reviewed_by',
        'approved_by',
        'issue_date',
        'file_path',
    ];

    protected $casts = [
        'issue_date' => 'date',
    ];

    /**
     * Get the audit mission that owns the report.
     */
    public function auditMission(): BelongsTo
    {
        return $this->belongsTo(AuditMission::class);
    }

    /**
     * Get the user who prepared the report.
     */
    public function preparer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    /**
     * Get the user who reviewed the report.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the user who approved the report.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
