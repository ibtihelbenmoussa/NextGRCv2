'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Risk } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RiskLevel {
    name: string;
    color: string;
    min: number;
    max: number;
}

interface RiskMatrixProps {
    risks: Risk[];
    type?: 'inherent' | 'residual';
    className?: string;
    onRiskClick?: (risk: Risk) => void;
    rows?: number;
    columns?: number;
    width?: number;
    height?: number;
    scoreScale?: number;
    showScores?: boolean;
    customLevels?: RiskLevel[];
}

interface TooltipInfo {
    visible: boolean;
    x: number;
    y: number;
    likelihood: number;
    consequence: number;
    score: number;
    riskLevel: RiskLevel | null;
    cellRisks: Risk[];
}

export function RiskMatrix({
    risks,
    type = 'inherent',
    className,
    onRiskClick,
    rows = 5,
    columns = 5,
    width = 600,
    height = 600,
    scoreScale = 4,
    showScores = true,
    customLevels,
}: RiskMatrixProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width, height });
    const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo>({
        visible: false,
        x: 0,
        y: 0,
        likelihood: 0,
        consequence: 0,
        score: 0,
        riskLevel: null,
        cellRisks: [],
    });

    // Handle responsive sizing
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const isMobile = window.innerWidth < 768;
                const isTablet =
                    window.innerWidth >= 768 && window.innerWidth < 1024;

                let newWidth, newHeight;

                if (isMobile) {
                    // On mobile, use full container width but cap at reasonable size
                    // Ensure minimum size of 250px for usability
                    newWidth = Math.max(
                        250,
                        Math.min(containerWidth - 20, 320),
                    );
                    newHeight = newWidth; // Keep square aspect ratio
                } else if (isTablet) {
                    // On tablet, slightly larger
                    newWidth = Math.max(
                        300,
                        Math.min(containerWidth - 40, 450),
                    );
                    newHeight = newWidth;
                } else {
                    // On desktop, use provided dimensions or container size
                    newWidth = Math.max(400, Math.min(containerWidth, width));
                    newHeight = Math.max(400, Math.min(containerWidth, height));
                }

                setDimensions({ width: newWidth, height: newHeight });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, [width, height]);

    // Use responsive dimensions instead of fixed props
    const actualWidth = dimensions.width;
    const actualHeight = dimensions.height;

    const maxScore = rows * columns;

    const getRiskScore = useCallback(
        (risk: Risk) => {
            if (type === 'inherent') {
                return {
                    likelihood: risk.inherent_likelihood || 0,
                    impact: risk.inherent_impact || 0,
                };
            }
            return {
                likelihood: risk.residual_likelihood || 0,
                impact: risk.residual_impact || 0,
            };
        },
        [type],
    );

    const getRiskLevels = (numLevels: number): RiskLevel[] => {
        if (customLevels && customLevels.length === numLevels) {
            return customLevels;
        }

        const getColorsForLevels = (numLevels: number): string[] => {
            switch (numLevels) {
                case 3:
                    return ['#22c55e', '#eab308', '#ef4444']; // Green, Yellow, Red
                case 4:
                    return ['#22c55e', '#eab308', '#f97316', '#ef4444']; // Green, Yellow, Orange, Red
                case 5:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                    ]; // Green, Light Green, Yellow, Orange, Red
                default:
                    return [
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
            }
        };

        const baseColors = getColorsForLevels(numLevels);

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

        const levels: RiskLevel[] = [];
        const scorePerLevel = maxScore / numLevels;

        for (let i = 0; i < numLevels; i++) {
            levels.push({
                name: baseNames[i] || `Level ${i + 1}`,
                color: baseColors[i] || baseColors[baseColors.length - 1],
                min: Math.floor(i * scorePerLevel) + (i === 0 ? 1 : 0),
                max:
                    i === numLevels - 1
                        ? maxScore
                        : Math.floor((i + 1) * scorePerLevel),
            });
        }

        return levels;
    };

    const riskLevels = getRiskLevels(scoreScale);

    const getRiskLevelForScore = (score: number): RiskLevel | null => {
        return (
            riskLevels.find(
                (level) => score >= level.min && score <= level.max,
            ) || null
        );
    };

    const getRisksInCell = useCallback(
        (likelihood: number, impact: number): Risk[] => {
            return risks.filter((risk) => {
                const scores = getRiskScore(risk);
                return (
                    scores.likelihood === likelihood && scores.impact === impact
                );
            });
        },

        [risks, getRiskScore],
    );

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
                return `Level ${likelihood}`;
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
                return `Level ${impact}`;
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Scale coordinates to canvas size
        const canvasX = (x / rect.width) * actualWidth;
        const canvasY = (y / rect.height) * actualHeight;

        const cellWidth = actualWidth / columns;
        const cellHeight = actualHeight / rows;

        const col = Math.floor(canvasX / cellWidth);
        const row = Math.floor(canvasY / cellHeight);

        // Check if mouse is within canvas bounds
        if (col >= 0 && col < columns && row >= 0 && row < rows) {
            const likelihood = rows - row;
            const consequence = col + 1;
            const score = likelihood * consequence;
            const riskLevel = getRiskLevelForScore(score);
            const cellRisks = getRisksInCell(likelihood, consequence);

            setTooltipInfo({
                visible: true,
                x: event.clientX,
                y: event.clientY,
                likelihood,
                consequence,
                score,
                riskLevel,
                cellRisks,
            });
        } else {
            setTooltipInfo((prev) => ({ ...prev, visible: false }));
        }
    };

    const handleMouseLeave = () => {
        setTooltipInfo((prev) => ({ ...prev, visible: false }));
    };

    const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onRiskClick) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Scale coordinates to canvas size
        const canvasX = (x / rect.width) * actualWidth;
        const canvasY = (y / rect.height) * actualHeight;

        const cellWidth = actualWidth / columns;
        const cellHeight = actualHeight / rows;

        const col = Math.floor(canvasX / cellWidth);
        const row = Math.floor(canvasY / cellHeight);

        // Check if click is within canvas bounds
        if (col >= 0 && col < columns && row >= 0 && row < rows) {
            const likelihood = rows - row;
            const consequence = col + 1;
            const cellRisks = getRisksInCell(likelihood, consequence);

            if (cellRisks.length > 0) {
                onRiskClick(cellRisks[0]);
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellWidth = actualWidth / columns;
        const cellHeight = actualHeight / rows;

        const interpolateColor = (
            color1: string,
            color2: string,
            t: number,
        ): string => {
            const r1 = Number.parseInt(color1.slice(1, 3), 16);
            const g1 = Number.parseInt(color1.slice(3, 5), 16);
            const b1 = Number.parseInt(color1.slice(5, 7), 16);

            const r2 = Number.parseInt(color2.slice(1, 3), 16);
            const g2 = Number.parseInt(color2.slice(3, 5), 16);
            const b2 = Number.parseInt(color2.slice(5, 7), 16);

            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);

            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };

        const getColorForScore = (score: number): string => {
            // Find which risk levels this score falls between
            for (let i = 0; i < riskLevels.length; i++) {
                const level = riskLevels[i];

                if (score >= level.min && score <= level.max) {
                    // Interpolate within this level
                    const levelProgress =
                        (score - level.min) / (level.max - level.min);

                    if (i < riskLevels.length - 1) {
                        // Interpolate between current and next level color
                        return interpolateColor(
                            level.color,
                            riskLevels[i + 1].color,
                            levelProgress,
                        );
                    } else {
                        return level.color;
                    }
                }
            }

            return riskLevels[0].color;
        };

        const imageData = ctx.createImageData(actualWidth, actualHeight);
        const data = imageData.data;

        for (let py = 0; py < actualHeight; py++) {
            for (let px = 0; px < actualWidth; px++) {
                // Calculate which cell this pixel belongs to
                const col = Math.floor(px / cellWidth);
                const row = Math.floor(py / cellHeight);

                // Calculate position within the cell (0-1)
                const cellX = (px % cellWidth) / cellWidth;
                const cellY = (py % cellHeight) / cellHeight;

                // Get scores for the four corners of the current cell
                const likelihood = rows - row;
                const consequence = col + 1;
                const score = likelihood * consequence;

                // Get scores for neighboring cells for interpolation
                const likelihoodNext = Math.max(1, rows - row - 1);
                const consequenceNext = Math.min(columns, col + 2);

                const scoreTopLeft = score;
                const scoreTopRight = likelihood * consequenceNext;
                const scoreBottomLeft = likelihoodNext * consequence;
                const scoreBottomRight = likelihoodNext * consequenceNext;

                // Bilinear interpolation of scores
                const scoreTop =
                    scoreTopLeft + (scoreTopRight - scoreTopLeft) * cellX;
                const scoreBottom =
                    scoreBottomLeft +
                    (scoreBottomRight - scoreBottomLeft) * cellX;
                const interpolatedScore =
                    scoreTop + (scoreBottom - scoreTop) * cellY;

                // Get color for interpolated score
                const color = getColorForScore(interpolatedScore);

                // Parse hex color to RGB
                const r = Number.parseInt(color.slice(1, 3), 16);
                const g = Number.parseInt(color.slice(3, 5), 16);
                const b = Number.parseInt(color.slice(5, 7), 16);

                // Set pixel color
                const index = (py * actualWidth + px) * 4;
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;

        for (let i = 1; i < columns; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellWidth, 0);
            ctx.lineTo(i * cellWidth, actualHeight);
            ctx.stroke();
        }

        for (let i = 1; i < rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellHeight);
            ctx.lineTo(actualWidth, i * cellHeight);
            ctx.stroke();
        }

        // Draw risk indicators
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const likelihood = rows - row;
                const consequence = col + 1;
                const cellRisks = getRisksInCell(likelihood, consequence);

                if (cellRisks.length > 0) {
                    const x = col * cellWidth + cellWidth - 15;
                    const y = row * cellHeight + 10;

                    // Draw indicator circle
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();

                    // Draw risk count
                    ctx.font = 'bold 10px "Instrument Sans"';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cellRisks.length.toString(), x, y);
                }
            }
        }

        if (showScores) {
            ctx.font = 'bold 16px "Instrument Sans"';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 4;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const likelihood = rows - row;
                    const consequence = col + 1;
                    const score = likelihood * consequence;

                    const x = col * cellWidth + cellWidth / 2;
                    const y = row * cellHeight + cellHeight / 2;

                    ctx.fillText(score.toString(), x, y);
                }
            }

            ctx.shadowBlur = 0;
        }

        // Draw axis labels
        ctx.font = 'bold 20px "Instrument Sans"';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;

        ctx.save();
        ctx.translate(20, actualHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Likelihood', 0, 0);
        ctx.restore();

        ctx.fillText('Impact', actualWidth / 2, actualHeight - 20);

        ctx.shadowBlur = 0;
    }, [
        rows,
        columns,
        actualWidth,
        actualHeight,
        scoreScale,
        maxScore,
        riskLevels,
        showScores,
        risks,
        type,
        getRisksInCell,
    ]);

    return (
        <TooltipProvider>
            <div className={cn('space-y-4', className)}>
                <div
                    ref={containerRef}
                    className="relative flex w-full justify-center"
                >
                    <Tooltip open={tooltipInfo.visible}>
                        <TooltipTrigger asChild>
                            <canvas
                                ref={canvasRef}
                                width={actualWidth}
                                height={actualHeight}
                                className="cursor-crosshair touch-manipulation rounded-lg border-2 border-border shadow-lg"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    aspectRatio: '1 / 1',
                                }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                                onTouchStart={(e) => {
                                    // Prevent default touch behavior on mobile
                                    e.preventDefault();
                                }}
                                onTouchEnd={(e) => {
                                    // Convert touch to click for mobile
                                    const touch = e.changedTouches[0];
                                    const canvas = canvasRef.current;
                                    if (canvas && onRiskClick) {
                                        // Create a synthetic click event
                                        const syntheticEvent = {
                                            clientX: touch.clientX,
                                            clientY: touch.clientY,
                                        } as React.MouseEvent<HTMLCanvasElement>;

                                        handleClick(syntheticEvent);
                                    }
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            style={{
                                position: 'fixed',
                                left: tooltipInfo.x + 10,
                                top: tooltipInfo.y - 10,
                                zIndex: 50,
                            }}
                        >
                            <div className="space-y-1">
                                <div className="font-medium">
                                    Risk Level:{' '}
                                    {tooltipInfo.riskLevel?.name || 'Unknown'}
                                </div>
                                <div>
                                    Likelihood: {tooltipInfo.likelihood} (
                                    {getLikelihoodLabel(tooltipInfo.likelihood)}
                                    )
                                </div>
                                <div>
                                    Impact: {tooltipInfo.consequence} (
                                    {getImpactLabel(tooltipInfo.consequence)})
                                </div>
                                <div>Risk Score: {tooltipInfo.score}</div>
                                {tooltipInfo.riskLevel && (
                                    <div className="flex items-center gap-2 border-t pt-1">
                                        <div
                                            className="h-3 w-3 rounded"
                                            style={{
                                                backgroundColor:
                                                    tooltipInfo.riskLevel.color,
                                            }}
                                        />
                                        <span className="text-xs">
                                            Range: {tooltipInfo.riskLevel.min}-
                                            {tooltipInfo.riskLevel.max}
                                        </span>
                                    </div>
                                )}
                                {tooltipInfo.cellRisks.length > 0 && (
                                    <div className="mt-2 border-t pt-2">
                                        <div className="font-medium">
                                            Risks in this cell:
                                        </div>
                                        {tooltipInfo.cellRisks.map((risk) => (
                                            <div
                                                key={risk.id}
                                                className="text-xs"
                                            >
                                                {risk.code}: {risk.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                    {riskLevels.map((level) => (
                        <div
                            key={level.name}
                            className="flex items-center gap-2"
                        >
                            <div
                                className="h-4 w-4 rounded"
                                style={{ backgroundColor: level.color }}
                            />
                            <span>
                                {level.name} ({level.min}-{level.max})
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
