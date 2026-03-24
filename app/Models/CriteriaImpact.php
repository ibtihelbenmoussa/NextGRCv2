<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class CriteriaImpact extends Model
{
    use HasFactory;

    protected $fillable = [
        'criteria_id',
        'impact_label',
        'score',
        'order',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'order' => 'integer',
    ];

    /**
     * Get the criteria that owns this impact
     */
    public function criteria(): BelongsTo
    {
        return $this->belongsTo(RiskCriteria::class, 'criteria_id');
    }

    /**
     * Scope to get impacts ordered by their order field
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order');
    }

    /**
     * Scope to get impacts for a specific criteria
     */
    public function scopeForCriteria(Builder $query, int $criteriaId): Builder
    {
        return $query->where('criteria_id', $criteriaId);
    }

    /**
     * Export as array suitable for frontend
     */
    public function toConfigArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->impact_label,
            'score' => $this->score,
            'order' => $this->order,
        ];
    }
}
