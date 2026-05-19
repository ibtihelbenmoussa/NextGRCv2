<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'email',
        'phone',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the business units for the organization.
     */
    public function businessUnits(): HasMany
    {
        return $this->hasMany(BusinessUnit::class);
    }

    /**
     * Get the users for the organization.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('role', 'is_default')
            ->withTimestamps();
    }

    /**
     * Get the plannings for the organization.
     */
    public function plannings(): HasMany
    {
        return $this->hasMany(Planning::class);
    }

    /**
     * Get the risk categories for the organization.
     */
    public function riskCategories(): HasMany
    {
        return $this->hasMany(RiskCategory::class);
    }

    /**
     * Get the risks for the organization.
     */
    public function risks(): HasMany
    {
        return $this->hasMany(Risk::class);
    }

    /**
     * Get the controls for the organization.
     */
    public function controls(): HasMany
    {
        return $this->hasMany(Control::class);
    }

    /**
     * Get the audit missions for the organization through plannings.
     */
    public function auditMissions(): HasManyThrough
    {
        return $this->hasManyThrough(AuditMission::class, Planning::class);
    }
}
