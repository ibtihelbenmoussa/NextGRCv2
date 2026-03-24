<?php

namespace App\Models;

use App\Enums\TestReviewStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_mission_id',
        'control_id',
        'risk_id',
        'name',
        'objective',
        'test_procedure',
        'sample_description',
        'sample_size',
        'test_result',
        'findings',
        'recommendations',
        'review_status',
        'review_comments',
        'reviewed_by',
        'reviewed_at',
        'performed_by',
        'test_date',
    ];

    protected $casts = [
        'review_status' => TestReviewStatus::class,
        'reviewed_at' => 'datetime',
        'test_date' => 'date',
        'sample_size' => 'integer',
    ];

    /**
     * Get the audit mission that owns the test.
     */
    public function auditMission(): BelongsTo
    {
        return $this->belongsTo(AuditMission::class);
    }

    /**
     * Get the control being tested.
     */
    public function control(): BelongsTo
    {
        return $this->belongsTo(Control::class);
    }

    /**
     * Get the risk associated with the test.
     */
    public function risk(): BelongsTo
    {
        return $this->belongsTo(Risk::class);
    }

    /**
     * Get the user who reviewed the test.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the user who performed the test.
     */
    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
