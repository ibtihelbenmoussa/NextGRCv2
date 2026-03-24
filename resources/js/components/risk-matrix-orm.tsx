import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskConfiguration, RiskImpact, RiskProbability } from '@/types/risk-configuration';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Risk {
    id: number;
    name: string;
    inherent_impact: number;
    inherent_likelihood: number;
    residual_impact?: number;
    residual_likelihood?: number;
}

interface RiskMatrixORMProps {
    configuration: RiskConfiguration;
    risks?: Risk[];
    onRiskClick?: (risk: Risk) => void;
    onCellClick?: (impact: number, probability: number) => void;
    showScores?: boolean;
    className?: string;
}

export function RiskMatrixORM({
    configuration,
    risks = [],
    onRiskClick,
    onCellClick,
    showScores = true,
    className = '',
}: RiskMatrixORMProps) {
    const [selectedCell, setSelectedCell] = useState<{ impact: number; probability: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Calculate risk score for a given impact and probability
    const calculateRiskScore = useCallback((impactScore: number, probabilityScore: number): number => {
        if (configuration.calculation_method === 'max') {
            return Math.max(impactScore, probabilityScore);
        }
        return (impactScore + probabilityScore) / 2;
    }, [configuration.calculation_method]);

    // Get risk level for a given score
    const getRiskLevelForScore = useCallback((score: number): RiskImpact | null => {
        return configuration.impacts
            .sort((a, b) => b.score - a.score)
            .find(impact => score >= impact.score) || null;
    }, [configuration.impacts]);

    // Get risks in a specific cell
    const getRisksInCell = useCallback((impact: number, probability: number): Risk[] => {
        return risks.filter(risk => 
            risk.inherent_impact === impact && risk.inherent_likelihood === probability
        );
    }, [risks]);

    // Draw the risk matrix
    const drawMatrix = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellWidth = canvas.width / configuration.probability_scale_max;
        const cellHeight = canvas.height / configuration.impact_scale_max;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw cells
        for (let impact = 0; impact < configuration.impact_scale_max; impact++) {
            for (let probability = 0; probability < configuration.probability_scale_max; probability++) {
                const x = probability * cellWidth;
                const y = (configuration.impact_scale_max - 1 - impact) * cellHeight;
                
                const impactScore = configuration.impacts[impact]?.score || (impact + 1);
                const probabilityScore = configuration.probabilities[probability]?.score || (probability + 1);
                const riskScore = calculateRiskScore(impactScore, probabilityScore);
                const riskLevel = getRiskLevelForScore(riskScore);

                // Set cell color
                if (riskLevel?.color) {
                    ctx.fillStyle = riskLevel.color;
                } else {
                    // Default color based on score
                    const intensity = Math.min(riskScore / 5, 1);
                    const red = Math.floor(255 * intensity);
                    const green = Math.floor(255 * (1 - intensity));
                    ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
                }

                ctx.fillRect(x, y, cellWidth, cellHeight);

                // Draw border
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellWidth, cellHeight);

                // Draw score if enabled
                if (showScores) {
                    ctx.fillStyle = '#000';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        riskScore.toFixed(1),
                        x + cellWidth / 2,
                        y + cellHeight / 2
                    );
                }

                // Draw risk count
                const cellRisks = getRisksInCell(impact + 1, probability + 1);
                if (cellRisks.length > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(
                        cellRisks.length.toString(),
                        x + cellWidth / 2,
                        y + cellHeight - 5
                    );
                }
            }
        }
    }, [configuration, calculateRiskScore, getRiskLevelForScore, getRisksInCell, showScores]);

    // Handle canvas click
    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const cellWidth = canvas.width / configuration.probability_scale_max;
        const cellHeight = canvas.height / configuration.impact_scale_max;

        const probability = Math.floor(x / cellWidth) + 1;
        const impact = configuration.impact_scale_max - Math.floor(y / cellHeight);

        if (probability >= 1 && probability <= configuration.probability_scale_max &&
            impact >= 1 && impact <= configuration.impact_scale_max) {
            setSelectedCell({ impact, probability });
            onCellClick?.(impact, probability);
        }
    }, [configuration, onCellClick]);

    // Update canvas size
    const updateCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        const size = Math.min(container.clientWidth - 40, 600);
        canvas.width = size;
        canvas.height = size;
        drawMatrix();
    }, [drawMatrix]);

    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);

    useEffect(() => {
        drawMatrix();
    }, [drawMatrix]);

    return (
        <div className={`space-y-4 ${className}`}>
            <Card>
                <CardHeader>
                    <CardTitle>Risk Assessment Matrix</CardTitle>
                    <CardDescription>
                        {configuration.name} - {configuration.impact_scale_max}×{configuration.probability_scale_max} Matrix
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className="border border-gray-300 cursor-pointer"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                            
                            {/* Labels */}
                            <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-sm font-medium">
                                {configuration.impacts.map((impact, index) => (
                                    <div key={index} className="flex items-center">
                                        <div 
                                            className="w-3 h-3 mr-2 rounded"
                                            style={{ backgroundColor: impact.color }}
                                        />
                                        {impact.label}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="absolute -bottom-8 left-0 w-full flex justify-between text-sm font-medium">
                                {configuration.probabilities.map((probability, index) => (
                                    <div key={index}>
                                        {probability.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Levels Legend */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Levels</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {configuration.impacts.map((impact, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: impact.color }}
                                />
                                <span className="text-sm font-medium">{impact.label}</span>
                                <span className="text-sm text-muted-foreground">({impact.score})</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Cell Information */}
            {selectedCell && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selected Cell</CardTitle>
                        <CardDescription>
                            Impact: {selectedCell.impact}, Probability: {selectedCell.probability}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Risk Score:</span>
                                <span className="font-medium">
                                    {calculateRiskScore(
                                        configuration.impacts[selectedCell.impact - 1]?.score || selectedCell.impact,
                                        configuration.probabilities[selectedCell.probability - 1]?.score || selectedCell.probability
                                    ).toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Risk Level:</span>
                                <span className="font-medium">
                                    {getRiskLevelForScore(
                                        calculateRiskScore(
                                            configuration.impacts[selectedCell.impact - 1]?.score || selectedCell.impact,
                                            configuration.probabilities[selectedCell.probability - 1]?.score || selectedCell.probability
                                        )
                                    )?.label || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Risks in Cell:</span>
                                <span className="font-medium">
                                    {getRisksInCell(selectedCell.impact, selectedCell.probability).length}
                                </span>
                            </div>
                        </div>
                        
                        {getRisksInCell(selectedCell.impact, selectedCell.probability).length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Risks in this cell:</h4>
                                <div className="space-y-1">
                                    {getRisksInCell(selectedCell.impact, selectedCell.probability).map((risk) => (
                                        <Button
                                            key={risk.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onRiskClick?.(risk)}
                                            className="w-full justify-start"
                                        >
                                            {risk.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
