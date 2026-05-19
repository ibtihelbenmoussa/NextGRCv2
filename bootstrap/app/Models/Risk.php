<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Risk extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'risk_category_id',
        'code',
        'name',
        'description',
        'category',
        'inherent_likelihood',
        'inherent_impact',
        'residual_likelihood',
        'residual_impact',
        'owner_id',
        'is_active',
        'kri_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'inherent_likelihood' => 'integer',
        'inherent_impact' => 'integer',
        'residual_likelihood' => 'integer',
        'residual_impact' => 'integer',
    ];

    /**
     * Get the organization that owns the risk.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the risk category.
     */
    public function riskCategory(): BelongsTo
    {
        return $this->belongsTo(RiskCategory::class, 'risk_category_id');
    }

    /**
     * Get the owner of the risk.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the processes associated with the risk.
     */
    public function processes(): BelongsToMany
    {
        return $this->belongsToMany(Process::class, 'process_risk')
            ->withTimestamps();
    }

    /**
     * Get the controls associated with the risk.
     */
    public function controls(): BelongsToMany
    {
        return $this->belongsToMany(Control::class, 'control_risk')
            ->withTimestamps();
    }

    /**
     * Get the tests for the risk.
     */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    /**
     * Calculate the inherent risk score.
     */
    public function getInherentScoreAttribute(): ?int
    {
        if ($this->inherent_likelihood && $this->inherent_impact) {
            return $this->inherent_likelihood * $this->inherent_impact;
        }

        return null;
    }
public function histories()
{
    return $this->hasMany(RiskHistory::class);
}
    /**
     * Calculate the residual risk score.
     */
    public function getResidualScoreAttribute(): ?int
    {
        if ($this->residual_likelihood && $this->residual_impact) {
            return $this->residual_likelihood * $this->residual_impact;
        }

        return null;
    }


    public function kri(): BelongsTo
{
    return $this->belongsTo(KRI::class, 'kri_id');
}
}
