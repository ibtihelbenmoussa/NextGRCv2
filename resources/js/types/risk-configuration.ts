// New Risk Configuration Types for ORM System

export interface RiskImpact {
    id?: number;
    label: string;
    score: string;
    order: number;
    color?: string;
}

export interface RiskProbability {
    id?: number;
    label: string;
    score: string;
    order: number;
    color?: string;
}

export interface CriteriaImpact {
    id?: number;
    label?: string;
    score: string;
    order: number;
    impact_label?: string;
}

export interface RiskCriteria {
    id?: number;
    name: string;
    description?: string;
    order: number;
    impacts: CriteriaImpact[];
}

export interface RiskConfiguration {
    id?: number;
    name: string;
    impact_scale_max: number;
    probability_scale_max: number;
    calculation_method: 'avg' | 'max';
    use_criterias: boolean;
    impacts: RiskImpact[];
    probabilities: RiskProbability[];
    criterias?: RiskCriteria[];
    score_levels?: RiskScoreLevel[];
}

// Legacy types for backward compatibility (to be removed)
export interface LegacyRiskLevel {
    id?: number;
    name: string;
    color: string;
    min_score: number;
    max_score: number;
    order: number;
}

export interface LegacyRiskMatrixConfiguration {
    id?: number;
    name: string;
    matrix_dimensions: {
        rows: number;
        columns: number;
        max_score: number;
    };
    scoring_configuration: {
        number_of_levels: number;
        levels: LegacyRiskLevel[];
    };
    metadata?: {
        is_active?: boolean;
        is_custom?: boolean;
        preset_used?: string;
        created_at?: string;
        updated_at?: string;
    };
}

export interface RiskScoreLevel {
    label: string;
    min: number;
    max: number;
    color: string;
    order: number;
}
