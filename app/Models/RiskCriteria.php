<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class RiskCriteria extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_configuration_id',
        'name',
        'description',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * Get the risk configuration that owns this criteria
     */
    public function riskConfiguration(): BelongsTo
    {
        return $this->belongsTo(RiskConfiguration::class);
    }

    /**
     * Get all impacts for this criteria
     */
    public function impacts(): HasMany
    {
        return $this->hasMany(CriteriaImpact::class, 'criteria_id')->orderBy('order');
    }

    /**
     * Scope to get criterias ordered by their order field
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order');
    }

    /**
     * Scope to get criterias for a specific risk configuration
     */
    public function scopeForConfiguration(Builder $query, int $configurationId): Builder
    {
        return $query->where('risk_configuration_id', $configurationId);
    }

    /**
     * Export as array suitable for frontend
     */
    public function toConfigArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'order' => $this->order,
            'impacts' => $this->impacts->map(function (CriteriaImpact $impact) {
                return $impact->toConfigArray();
            })->toArray(),
        ];
    }
}
