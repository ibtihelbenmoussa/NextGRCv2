# Risk Configuration ORM System

## Overview

This document describes the implementation of a configurable ORM (Operational Risk Management) setup that allows defining customizable risk scoring frameworks per organization or project.

## 🧱 Goal

Support:
- Custom scales (2–10)
- Custom impact levels and probabilities
- Configurable calculation method (avg / max)
- Optional criterias, each with its own impact scale mapping

## 🗃️ Database Schema

### 1. risk_configurations

Main table controlling the entire configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID / bigIncrements | Primary key |
| organization_id | FK | (If multi-org system) |
| name | string | Name like "Default Risk Config" |
| impact_scale_max | integer | Max number of levels (2–10) |
| probability_scale_max | integer | Max number of levels (2–10) |
| calculation_method | enum('avg','max') | How risk score is calculated |
| use_criterias | boolean | Whether criteria are used |
| created_at | timestamp | |
| updated_at | timestamp | |

### 2. risk_impacts

Stores the impact scale values.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID / bigIncrements | |
| risk_configuration_id | FK | belongsTo risk_configurations |
| label | string | e.g. "Minor", "Moderate", "Critical" |
| score | float | numerical value for impact (1.0, 2.5, etc.) |
| color | string (nullable) | optional color code for UI (e.g., #FF0000) |
| order | integer | order of scale (1 = lowest, N = highest) |

### 3. risk_probabilities

Stores the probability scale.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID / bigIncrements | |
| risk_configuration_id | FK | belongsTo risk_configurations |
| label | string | e.g. "Rare", "Likely", "Almost Certain" |
| score | float | numeric value |
| order | integer | display order |

### 4. risk_criterias

Only used if use_criterias = true.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID / bigIncrements | |
| risk_configuration_id | FK | belongsTo risk_configurations |
| name | string | e.g. "Financial", "Reputation", "Compliance" |
| description | text (nullable) | optional description |
| order | integer | display order |

### 5. criteria_impacts

Mapping of impact levels per criteria.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID / bigIncrements | |
| criteria_id | FK | belongsTo risk_criterias |
| impact_label | string | e.g. "Low", "Medium", "High" |
| score | float | numeric value for this criteria-impact |
| order | integer | display order |

## 🔗 Relationships (Eloquent / ORM)

```php
// RiskConfiguration.php
public function impacts() { return $this->hasMany(RiskImpact::class); }
public function probabilities() { return $this->hasMany(RiskProbability::class); }
public function criterias() { return $this->hasMany(RiskCriteria::class); }

// RiskCriteria.php
public function impacts() { return $this->hasMany(CriteriaImpact::class); }
```

## 🧮 Risk Calculation Example

### If use_criterias = false:
Risk Score = f(impact_score, probability_score)
→ either (impact + probability) / 2 (avg) or max(impact, probability)

### If use_criterias = true:
Each criteria gives a sub-score, then global risk = avg or max across criteria.

## 🧩 Example JSON Config (for API/frontend)

```json
{
  "id": 1,
  "name": "Default Risk Config",
  "impact_scale_max": 5,
  "probability_scale_max": 5,
  "calculation_method": "avg",
  "use_criterias": true,
  "impacts": [
    { "label": "Minor", "score": 1 },
    { "label": "Moderate", "score": 2 },
    { "label": "Critical", "score": 5 }
  ],
  "probabilities": [
    { "label": "Rare", "score": 1 },
    { "label": "Likely", "score": 4 }
  ],
  "criterias": [
    {
      "name": "Financial",
      "impacts": [
        { "label": "Low", "score": 1 },
        { "label": "High", "score": 5 }
      ]
    },
    {
      "name": "Reputation",
      "impacts": [
        { "label": "Low", "score": 1.5 },
        { "label": "High", "score": 4.5 }
      ]
    }
  ]
}
```

## 🚀 API Endpoints

### Risk Configuration Management

- `GET /risk-configurations` - List all configurations for organization
- `POST /risk-configurations` - Create new configuration
- `GET /risk-configurations/{id}` - Get specific configuration
- `PUT /risk-configurations/{id}` - Update configuration
- `DELETE /risk-configurations/{id}` - Delete configuration

### Risk Calculation

- `POST /risk-configurations/calculate-risk-score` - Calculate risk score
- `GET /risk-configurations/matrix-data` - Get matrix data for visualization

## 🔧 Usage Examples

### Creating a Risk Configuration

```php
use App\Services\RiskCalculationService;

$service = new RiskCalculationService();

$configData = [
    'organization_id' => 1,
    'name' => 'Custom Risk Config',
    'impact_scale_max' => 5,
    'probability_scale_max' => 5,
    'calculation_method' => 'avg',
    'use_criterias' => false,
];

$impactsData = [
    ['label' => 'Minor', 'score' => 1.0, 'color' => '#90EE90', 'order' => 1],
    ['label' => 'Moderate', 'score' => 2.0, 'color' => '#FFD700', 'order' => 2],
    ['label' => 'Significant', 'score' => 3.0, 'color' => '#FFA500', 'order' => 3],
    ['label' => 'Major', 'score' => 4.0, 'color' => '#FF6347', 'order' => 4],
    ['label' => 'Critical', 'score' => 5.0, 'color' => '#FF0000', 'order' => 5],
];

$probabilitiesData = [
    ['label' => 'Rare', 'score' => 1.0, 'order' => 1],
    ['label' => 'Unlikely', 'score' => 2.0, 'order' => 2],
    ['label' => 'Possible', 'score' => 3.0, 'order' => 3],
    ['label' => 'Likely', 'score' => 4.0, 'order' => 4],
    ['label' => 'Almost Certain', 'score' => 5.0, 'order' => 5],
];

$configuration = $service->createRiskConfiguration(
    $configData,
    $impactsData,
    $probabilitiesData
);
```

### Calculating Risk Score

```php
// Simple calculation (without criteria)
$result = $service->calculateRiskScore(1, 3.0, 4.0);

// With criteria
$criteriaScores = [
    'financial' => 2.5,
    'reputation' => 3.0,
    'compliance' => 1.5
];
$result = $service->calculateRiskScoreWithCriteria(1, $criteriaScores);
```

## 🎯 Key Features

1. **Flexible Scale Configuration**: Support for 2-10 levels for both impact and probability
2. **Custom Calculation Methods**: Average or maximum scoring
3. **Criteria-Based Assessment**: Optional multi-criteria risk evaluation
4. **Organization-Specific**: Each organization can have its own risk configurations
5. **Color-Coded Visualization**: Support for color coding in risk matrices
6. **Validation**: Comprehensive validation of configuration data
7. **API-Ready**: Full REST API for frontend integration

## 🔒 Permissions

The system includes proper authorization policies:

- `view risk configurations` - View risk configurations
- `manage risk configurations` - Create, update, delete risk configurations

## 📊 Summary

| Table | Purpose |
|-------|---------|
| risk_configurations | main configuration |
| risk_impacts | defines global impact scale |
| risk_probabilities | defines probability scale |
| risk_criterias | optional criteria list |
| criteria_impacts | impact scale per criteria |

This system provides a complete, scalable, and flexible risk management framework that can be customized per organization while maintaining data integrity and proper relationships.
