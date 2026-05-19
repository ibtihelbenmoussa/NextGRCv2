<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class RiskProbability extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_configuration_id',
        'label',
        'score',
        'order',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'order' => 'integer',
    ];

    /**
     * Get the risk configuration that owns this probability
     */
    public function riskConfiguration(): BelongsTo
    {
        return $this->belongsTo(RiskConfiguration::class);
    }

    /**
     * Scope to get probabilities ordered by their order field
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order');
    }

    /**
     * Scope to get probabilities for a specific risk configuration
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
            'label' => $this->label,
            'score' => $this->score,
            'order' => $this->order,
        ];
    }
}
