<?php

namespace App\Models;

use App\Enums\AuditMissionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AuditMission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'planning_id',
        'name',
        'code',
        'description',
        'objectives',
        'scope',
        'start_date',
        'end_date',
        'status',
        'audit_chief_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => AuditMissionStatus::class,
    ];

    /**
     * Get the planning that owns the audit mission.
     */
    public function planning(): BelongsTo
    {
        return $this->belongsTo(Planning::class);
    }

    /**
     * Get the audit chief of the mission.
     */
    public function auditChief(): BelongsTo
    {
        return $this->belongsTo(User::class, 'audit_chief_id');
    }

    /**
     * Get the auditors assigned to the mission.
     */
    public function auditors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'audit_mission_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the requested documents for the audit mission.
     */
    public function requestedDocuments(): HasMany
    {
        return $this->hasMany(RequestedDocument::class);
    }

    /**
     * Get the interviews for the audit mission.
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }

    /**
     * Get the tests for the audit mission.
     */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    /**
     * Get the management comments for the audit mission.
     */
    public function managementComments(): HasMany
    {
        return $this->hasMany(ManagementComment::class);
    }

    /**
     * Get the reports for the audit mission.
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    /**
     * Get the organization through the planning.
     */
    public function organization(): BelongsTo
    {
        return $this->planning->organization();
    }

    /**
     * Get the organization_id through the planning.
     */
    public function getOrganizationIdAttribute(): ?int
    {
        return $this->planning?->organization_id;
    }
}
