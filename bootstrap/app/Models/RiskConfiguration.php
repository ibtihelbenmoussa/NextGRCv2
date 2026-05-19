<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class RiskConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'impact_scale_max',
        'probability_scale_max',
        'calculation_method',
        'use_criterias',
    ];

    protected $casts = [
        'impact_scale_max' => 'integer',
        'probability_scale_max' => 'integer',
        'use_criterias' => 'boolean',
    ];

    /**
     * Get the organization that owns the risk configuration
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get all impact levels for this configuration
     */
    public function impacts(): HasMany
    {
        return $this->hasMany(RiskImpact::class)->orderBy('order');
    }

    /**
     * Get all probability levels for this configuration
     */
    public function probabilities(): HasMany
    {
        return $this->hasMany(RiskProbability::class)->orderBy('order');
    }

    /**
     * Get all criteria for this configuration
     */
    public function criterias(): HasMany
    {
        return $this->hasMany(RiskCriteria::class)->orderBy('order');
    }

    /**
     * Get all score levels for this configuration
     */
    public function scoreLevels(): HasMany
    {
        return $this->hasMany(RiskScoreLevel::class)->orderBy('order');
    }

    /**
     * Scope to get configurations for a specific organization
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Calculate risk score based on impact and probability
     */
    public function calculateRiskScore(float $impactScore, float $probabilityScore): float
    {
        if ($this->calculation_method === 'max') {
            return max($impactScore, $probabilityScore);
        }

        return ($impactScore + $probabilityScore) / 2;
    }

    /**
     * Calculate risk score with criteria
     */
    public function calculateRiskScoreWithCriteria(array $criteriaScores): float
    {
        if (empty($criteriaScores)) {
            return 0;
        }

        if ($this->calculation_method === 'max') {
            return max($criteriaScores);
        }

        return array_sum($criteriaScores) / count($criteriaScores);
    }

    /**
     * Get impact level for a given score
     */
    public function getImpactForScore(float $score): ?RiskImpact
    {
        return $this->impacts()
            ->where('score', '<=', $score)
            ->orderBy('score', 'desc')
            ->first();
    }

    /**
     * Get probability level for a given score
     */
    public function getProbabilityForScore(float $score): ?RiskProbability
    {
        return $this->probabilities()
            ->where('score', '<=', $score)
            ->orderBy('score', 'desc')
            ->first();
    }

    /**
     * Export configuration as array suitable for frontend
     */
    public function toConfigArray(): array
    {
        $config = [
            'id' => $this->id,
            'name' => $this->name,
            'impact_scale_max' => $this->impact_scale_max,
            'probability_scale_max' => $this->probability_scale_max,
            'calculation_method' => $this->calculation_method,
            'use_criterias' => $this->use_criterias,
            'impacts' => $this->impacts->map(function (RiskImpact $impact) {
                return [
                    'id' => $impact->id,
                    'label' => $impact->label,
                    'score' => $impact->score,
                    'color' => $impact->color,
                    'order' => $impact->order,
                ];
            })->toArray(),
            'probabilities' => $this->probabilities->map(function (RiskProbability $probability) {
                return [
                    'id' => $probability->id,
                    'label' => $probability->label,
                    'score' => $probability->score,
                    'order' => $probability->order,
                ];
            })->toArray(),
            'score_levels' => $this->scoreLevels->map(function (RiskScoreLevel $scoreLevel) {
                return [
                    'id' => $scoreLevel->id,
                    'label' => $scoreLevel->label,
                    'min' => $scoreLevel->min,
                    'max' => $scoreLevel->max,
                    'color' => $scoreLevel->color,
                    'order' => $scoreLevel->order,
                ];
            })->toArray(),
        ];

        if ($this->use_criterias) {
            $config['criterias'] = $this->criterias->map(function (RiskCriteria $criteria) {
                return [
                    'id' => $criteria->id,
                    'name' => $criteria->name,
                    'description' => $criteria->description,
                    'order' => $criteria->order,
                    'impacts' => $criteria->impacts->map(function (CriteriaImpact $impact) {
                        return [
                            'id' => $impact->id,
                            'label' => $impact->impact_label,
                            'score' => $impact->score,
                            'order' => $impact->order,
                        ];
                    })->toArray(),
                ];
            })->toArray();
        }

        return $config;
    }

    /**
     * Create a new risk configuration with all related data
     */
    public static function createWithData(array $configData, array $impactsData, array $probabilitiesData, array $criteriasData = [], array $scoreLevelsData = []): self
    {
        return \DB::transaction(function () use ($configData, $impactsData, $probabilitiesData, $criteriasData, $scoreLevelsData) {
            $configuration = static::create($configData);

            // Create impacts
            foreach ($impactsData as $impactData) {
                $configuration->impacts()->create($impactData);
            }

            // Create probabilities
            foreach ($probabilitiesData as $probabilityData) {
                $configuration->probabilities()->create($probabilityData);
            }

            // Create score levels
            foreach ($scoreLevelsData as $scoreLevelData) {
                $configuration->scoreLevels()->create($scoreLevelData);
            }

            // Create criterias if provided
            if (!empty($criteriasData)) {
                foreach ($criteriasData as $criteriaData) {
                    // Handle both wrapped and direct criteria data structures
                    $criteriaInfo = isset($criteriaData['criteria']) ? $criteriaData['criteria'] : $criteriaData;
                    $impacts = isset($criteriaData['impacts']) ? $criteriaData['impacts'] : [];
                    
                    $criteria = $configuration->criterias()->create($criteriaInfo);
                    
                    // Create criteria impacts
                    if (!empty($impacts)) {
                        foreach ($impacts as $impactData) {
                            $criteria->impacts()->create($impactData);
                        }
                    }
                }
            }

            return $configuration;
        });
    }
}
