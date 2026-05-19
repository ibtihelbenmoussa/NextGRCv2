<?php

namespace App\Services;

use App\Models\RiskConfiguration;
use App\Models\RiskImpact;
use App\Models\RiskProbability;
use App\Models\RiskCriteria;
use App\Models\CriteriaImpact;

class RiskCalculationService
{
    /**
     * Calculate risk score using the organization's risk configuration
     */
    public function calculateRiskScore(int $organizationId, float $impactScore, float $probabilityScore): array
    {
        $configuration = RiskConfiguration::forOrganization($organizationId)
            ->with(['impacts', 'probabilities'])
            ->first();

        if (!$configuration) {
            throw new \InvalidArgumentException('No risk configuration found for organization');
        }

        $riskScore = $configuration->calculateRiskScore($impactScore, $probabilityScore);
        $impact = $configuration->getImpactForScore($impactScore);
        $probability = $configuration->getProbabilityForScore($probabilityScore);

        return [
            'risk_score' => $riskScore,
            'impact_score' => $impactScore,
            'probability_score' => $probabilityScore,
            'impact_level' => $impact,
            'probability_level' => $probability,
            'configuration' => $configuration,
        ];
    }

    /**
     * Calculate risk score with criteria
     */
    public function calculateRiskScoreWithCriteria(int $organizationId, array $criteriaScores): array
    {
        $configuration = RiskConfiguration::forOrganization($organizationId)
            ->with(['criterias.impacts'])
            ->first();

        if (!$configuration) {
            throw new \InvalidArgumentException('No risk configuration found for organization');
        }

        if (!$configuration->use_criterias) {
            throw new \InvalidArgumentException('Risk configuration does not use criteria');
        }

        $riskScore = $configuration->calculateRiskScoreWithCriteria($criteriaScores);

        return [
            'risk_score' => $riskScore,
            'criteria_scores' => $criteriaScores,
            'configuration' => $configuration,
        ];
    }

    /**
     * Get risk matrix data for visualization
     */
    public function getRiskMatrixData(int $organizationId): array
    {
        $configuration = RiskConfiguration::forOrganization($organizationId)
            ->with(['impacts', 'probabilities', 'criterias.impacts'])
            ->first();

        if (!$configuration) {
            throw new \InvalidArgumentException('No risk configuration found for organization');
        }

        return $configuration->toConfigArray();
    }

    /**
     * Get available risk configurations for an organization
     */
    public function getRiskConfigurations(int $organizationId): array
    {
        $configurations = RiskConfiguration::forOrganization($organizationId)
            ->with(['impacts', 'probabilities', 'criterias.impacts'])
            ->get();

        return $configurations->map(function (RiskConfiguration $config) {
            return $config->toConfigArray();
        })->toArray();
    }

    /**
     * Create a new risk configuration
     */
    public function createRiskConfiguration(array $configData, array $impactsData, array $probabilitiesData, array $criteriasData = [], array $scoreLevelsData = []): RiskConfiguration
    {
        return RiskConfiguration::createWithData($configData, $impactsData, $probabilitiesData, $criteriasData, $scoreLevelsData);
    }

    /**
     * Update an existing risk configuration
     */
    public function updateRiskConfiguration(RiskConfiguration $configuration, array $configData, array $impactsData, array $probabilitiesData, array $criteriasData = [], array $scoreLevelsData = []): RiskConfiguration
    {
        return \DB::transaction(function () use ($configuration, $configData, $impactsData, $probabilitiesData, $criteriasData, $scoreLevelsData) {
            // Update configuration
            $configuration->update($configData);

            // Delete existing related data
            $configuration->impacts()->delete();
            $configuration->probabilities()->delete();
            $configuration->criterias()->delete();
            $configuration->scoreLevels()->delete();

            // Create new impacts
            foreach ($impactsData as $impactData) {
                $configuration->impacts()->create($impactData);
            }

            // Create new probabilities
            foreach ($probabilitiesData as $probabilityData) {
                $configuration->probabilities()->create($probabilityData);
            }

            // Create new score levels
            foreach ($scoreLevelsData as $scoreLevelData) {
                $configuration->scoreLevels()->create($scoreLevelData);
            }

            // Create new criterias if provided
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

            return $configuration->fresh(['impacts', 'probabilities', 'criterias.impacts', 'scoreLevels']);
        });
    }

    /**
     * Validate risk configuration data
     */
    public function validateRiskConfiguration(array $configData, array $impactsData, array $probabilitiesData, array $criteriasData = []): array
    {
        $errors = [];

        // Validate configuration data
        if (empty($configData['name'])) {
            $errors[] = 'Configuration name is required';
        }

        if (!isset($configData['impact_scale_max']) || $configData['impact_scale_max'] < 2 || $configData['impact_scale_max'] > 10) {
            $errors[] = 'Impact scale max must be between 2 and 10';
        }

        if (!isset($configData['probability_scale_max']) || $configData['probability_scale_max'] < 2 || $configData['probability_scale_max'] > 10) {
            $errors[] = 'Probability scale max must be between 2 and 10';
        }

        if (!in_array($configData['calculation_method'] ?? '', ['avg', 'max'])) {
            $errors[] = 'Calculation method must be either "avg" or "max"';
        }

        // Validate impacts data
        if (count($impactsData) !== $configData['impact_scale_max']) {
            $errors[] = "Number of impact levels must match impact_scale_max ({$configData['impact_scale_max']})";
        }

        // Validate probabilities data
        if (count($probabilitiesData) !== $configData['probability_scale_max']) {
            $errors[] = "Number of probability levels must match probability_scale_max ({$configData['probability_scale_max']})";
        }

        // Validate criterias if provided
        if (!empty($criteriasData) && ($configData['use_criterias'] ?? false)) {
            foreach ($criteriasData as $index => $criteriaData) {
                if (empty($criteriaData['name'])) {
                    $errors[] = "Criteria #{$index} name is required";
                }

                if (empty($criteriaData['impacts'])) {
                    $errors[] = "Criteria #{$index} must have impact levels";
                }
            }
        }

        return $errors;
    }
}
