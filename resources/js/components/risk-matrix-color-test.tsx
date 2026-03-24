import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskRange {
    min: number;
    max: number;
    label: string;
    color: string;
}

const getDefaultRiskRanges = (
    numLevels: number,
    maxScore: number,
): RiskRange[] => {
    const baseColors = [
        '#22c55e', // Green
        '#84cc16', // Light green
        '#eab308', // Yellow
        '#f97316', // Orange
        '#ef4444', // Red
        '#dc2626', // Dark red
        '#b91c1c', // Darker red
        '#991b1b', // Very dark red
        '#7f1d1d', // Darkest red
        '#450a0a', // Maroon
    ];

    const getBaseNames = (numLevels: number): string[] => {
        switch (numLevels) {
            case 3:
                return ['Low', 'Medium', 'High'];
            case 4:
                return ['Low', 'Medium', 'High', 'Extreme'];
            case 5:
                return ['Low', 'Medium', 'High', 'Extreme', 'Critical'];
            default:
                // For other levels, use default naming
                return [
                    'Very Low',
                    'Low',
                    'Low-Medium',
                    'Medium',
                    'Medium-High',
                    'High',
                    'Very High',
                    'Extreme',
                    'Critical',
                    'Catastrophic',
                ];
        }
    };

    const baseNames = getBaseNames(numLevels);
    const levels: RiskRange[] = [];
    const scorePerLevel = maxScore / numLevels;

    for (let i = 0; i < numLevels; i++) {
        levels.push({
            min: Math.floor(i * scorePerLevel) + (i === 0 ? 1 : 0),
            max:
                i === numLevels - 1
                    ? maxScore
                    : Math.floor((i + 1) * scorePerLevel),
            label: baseNames[i] || `Level ${i + 1}`,
            color: baseColors[i] || baseColors[baseColors.length - 1],
        });
    }

    return levels;
};

const DEFAULT_RISK_RANGES: RiskRange[] = getDefaultRiskRanges(4, 25);

const getTextColor = (backgroundColor: string): string => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
};

const getRiskLevel = (
    score: number,
    ranges: RiskRange[],
): RiskRange | undefined => {
    return ranges.find((range) => score >= range.min && score <= range.max);
};

const getLikelihoodLabel = (likelihood: number): string => {
    switch (likelihood) {
        case 1:
            return 'Very Low';
        case 2:
            return 'Low';
        case 3:
            return 'Medium';
        case 4:
            return 'High';
        case 5:
            return 'Very High';
        default:
            return 'Unknown';
    }
};

const getImpactLabel = (impact: number): string => {
    switch (impact) {
        case 1:
            return 'Very Low';
        case 2:
            return 'Low';
        case 3:
            return 'Medium';
        case 4:
            return 'High';
        case 5:
            return 'Very High';
        default:
            return 'Unknown';
    }
};

interface ColorTestCellProps {
    impact: number;
    probability: number;
    riskRanges: RiskRange[];
}

function ColorTestCell({
    impact,
    probability,
    riskRanges,
}: ColorTestCellProps) {
    const riskScore = impact * probability;
    const riskLevel = getRiskLevel(riskScore, riskRanges);
    const backgroundColor = riskLevel?.color || '#6b7280';
    const textColor = getTextColor(backgroundColor);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded border border-border/30 font-mono text-xs font-bold transition-all hover:border-foreground/60"
                    style={{
                        backgroundColor,
                        color: textColor,
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                >
                    <div className="text-lg">{riskScore}</div>
                    <div className="text-[10px] opacity-90">
                        {impact}×{probability}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <div className="space-y-1">
                    <div className="font-medium">
                        Risk Level: {riskLevel?.label || 'Unknown'}
                    </div>
                    <div>
                        Impact: {impact} ({getImpactLabel(impact)})
                    </div>
                    <div>
                        Probability: {probability} (
                        {getLikelihoodLabel(probability)})
                    </div>
                    <div>Risk Score: {riskScore}</div>
                    <div className="text-xs opacity-75">
                        Color: {backgroundColor}
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

export function RiskMatrixColorTest() {
    const maxImpact = 5;
    const maxProbability = 5;

    return (
        <TooltipProvider>
            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Risk Matrix Color Verification Test
                        </CardTitle>
                        <CardDescription>
                            This component verifies that colors are properly
                            mapped to risk scores. Each cell should display the
                            correct color based on its calculated risk score.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Risk Level Legend */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                                Risk Level Legend
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {DEFAULT_RISK_RANGES.map((range, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 rounded-lg border p-3"
                                    >
                                        <div
                                            className="h-4 w-4 rounded"
                                            style={{
                                                backgroundColor: range.color,
                                            }}
                                        />
                                        <span className="font-medium">
                                            {range.label}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            ({range.min}-{range.max})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Matrix */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                                5×5 Risk Matrix
                            </h3>
                            <div className="inline-block rounded-lg border-2 border-border p-4">
                                <div
                                    className="grid gap-1"
                                    style={{
                                        gridTemplateColumns: `60px repeat(${maxProbability}, minmax(60px, 1fr))`,
                                    }}
                                >
                                    {/* Header row */}
                                    <div className="flex items-center justify-center text-sm font-bold"></div>
                                    {Array.from(
                                        { length: maxProbability },
                                        (_, i) => i + 1,
                                    ).map((p) => (
                                        <div
                                            key={`prob-${p}`}
                                            className="flex items-center justify-center py-2 text-sm font-bold"
                                        >
                                            {p}
                                        </div>
                                    ))}

                                    {/* Matrix cells */}
                                    {Array.from(
                                        { length: maxImpact },
                                        (_, i) => maxImpact - i,
                                    ).map((impact) => [
                                        <div
                                            key={`impact-${impact}`}
                                            className="flex items-center justify-center px-2 text-sm font-bold"
                                        >
                                            {impact}
                                        </div>,
                                        ...Array.from(
                                            { length: maxProbability },
                                            (_, i) => i + 1,
                                        ).map((probability) => (
                                            <ColorTestCell
                                                key={`cell-${impact}-${probability}`}
                                                impact={impact}
                                                probability={probability}
                                                riskRanges={getDefaultRiskRanges(
                                                    4,
                                                    maxImpact * maxProbability,
                                                )}
                                            />
                                        )),
                                    ])}
                                </div>

                                {/* Labels */}
                                <div className="mt-4 space-y-2 text-center">
                                    <div className="text-sm font-medium">
                                        Impact →
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ↑ Probability
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                                Score Distribution Verification
                            </h3>
                            <div className="space-y-2 rounded-lg border p-4">
                                {getDefaultRiskRanges(
                                    4,
                                    maxImpact * maxProbability,
                                ).map((range) => {
                                    const scoresInRange: number[] = [];
                                    for (let i = 1; i <= maxImpact; i++) {
                                        for (
                                            let p = 1;
                                            p <= maxProbability;
                                            p++
                                        ) {
                                            const score = i * p;
                                            if (
                                                score >= range.min &&
                                                score <= range.max
                                            ) {
                                                scoresInRange.push(score);
                                            }
                                        }
                                    }
                                    const uniqueScores = [
                                        ...new Set(scoresInRange),
                                    ].sort((a, b) => a - b);

                                    return (
                                        <div
                                            key={range.label}
                                            className="flex items-center gap-3"
                                        >
                                            <div
                                                className="h-4 w-4 rounded"
                                                style={{
                                                    backgroundColor:
                                                        range.color,
                                                }}
                                            />
                                            <div className="min-w-[80px] font-medium">
                                                {range.label}:
                                            </div>
                                            <div className="text-sm">
                                                Scores {uniqueScores.join(', ')}
                                                <span className="ml-1 text-muted-foreground">
                                                    ({uniqueScores.length}{' '}
                                                    cells)
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Test Results */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                                Expected Results
                            </h3>
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <strong>Green cells:</strong> Scores 1,
                                        2, 3, 4 (Low risk)
                                    </li>
                                    <li>
                                        <strong>Yellow cells:</strong> Scores 5,
                                        6, 8, 9 (Medium risk)
                                    </li>
                                    <li>
                                        <strong>Orange cells:</strong> Scores
                                        10, 12 (High risk)
                                    </li>
                                    <li>
                                        <strong>Red cells:</strong> Scores 15,
                                        16, 20, 25 (Critical risk)
                                    </li>
                                </ul>
                                <p className="mt-3 text-xs text-muted-foreground">
                                    If any cell appears in the wrong color, the
                                    color mapping needs adjustment. Hover over
                                    cells to see detailed risk score
                                    information.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
