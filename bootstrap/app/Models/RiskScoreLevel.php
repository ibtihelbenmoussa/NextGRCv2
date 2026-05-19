<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class RiskScoreLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_configuration_id',
        'label',
        'min',
        'max',
        'color',
        'order',
    ];

    protected $casts = [
        'min' => 'integer',
        'max' => 'integer',
        'order' => 'integer',
    ];

    /**
     * Get the risk configuration that owns this score level
     */
    public function riskConfiguration(): BelongsTo
    {
        return $this->belongsTo(RiskConfiguration::class);
    }

    /**
     * Scope to get score levels ordered by their order field
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order');
    }

    /**
     * Scope to get score levels for a specific risk configuration
     */
    public function scopeForConfiguration(Builder $query, int $configurationId): Builder
    {
        return $query->where('risk_configuration_id', $configurationId);
    }

    /**
     * Get CSS style for this score level's color
     */
    public function getColorStyleAttribute(): string
    {
        return $this->color ? "background-color: {$this->color}" : '';
    }

    /**
     * Export as array suitable for frontend
     */
    public function toConfigArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'min' => $this->min,
            'max' => $this->max,
            'color' => $this->color,
            'order' => $this->order,
        ];
    }
}
