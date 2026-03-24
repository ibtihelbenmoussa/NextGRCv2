'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface RiskLevel {
    name: string;
    color: string;
    min: number;
    max: number;
}

import { RiskConfiguration } from '@/types/risk-configuration';

interface RiskMatrixCanvasProps {
    width?: number;
    height?: number;
    showScores?: boolean;
    activeConfiguration: RiskConfiguration;
    onCellClick?: (
        likelihood: number,
        consequence: number,
        score: number,
    ) => void;
    className?: string;
}

interface TooltipInfo {
    visible: boolean;
    likelihood: number;
    consequence: number;
    score: number;
    riskLevel: RiskLevel | null;
}

interface CellInfo {
    likelihood: number;
    consequence: number;
    score: number;
    riskLevel: RiskLevel | null;
}

export default function RiskMatrixCanvas({
    width = 600,
    height = 600,
    showScores = true,
    activeConfiguration,
    onCellClick,
    className = '',
}: RiskMatrixCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo>({
        visible: false,
        likelihood: 0,
        consequence: 0,
        score: 0,
        riskLevel: null,
    });
    const cellInfoCache = useRef<Map<string, CellInfo>>(new Map());
    const tooltipRef = useRef<HTMLDivElement>(null);
    const currentCellKey = useRef<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width, height });

    // Extract dimensions from impacts and probabilities arrays
    const rows = activeConfiguration.probabilities.length;
    const columns = activeConfiguration.impacts.length;

    // Calculate maxScore using multiplication (likelihood * consequence)
    const maxScore = rows * columns;

    // Responsive canvas sizing
    const updateCanvasSize = useCallback(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const maxWidth = Math.min(containerWidth - 32, 800); // 32px for padding
            const minWidth = 320;
            const responsiveWidth = Math.max(minWidth, maxWidth);
            const responsiveHeight = responsiveWidth;

            setCanvasSize({
                width: responsiveWidth,
                height: responsiveHeight,
            });
        }
    }, []);

    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);

    // Convert activeConfiguration score_levels to RiskLevel format
    const riskLevels: RiskLevel[] = (activeConfiguration.score_levels || [])
        .sort((a, b) => a.order - b.order)
        .map(level => ({
            name: level.label,
            color: level.color,
            min: level.min,
            max: level.max,
        }));

    const getRiskLevelForScore = (score: number): RiskLevel | null => {
        // For non-overlapping intervals, find the exact level that contains the score
        // Use the original score_levels for proper ordering
        const sortedScoreLevels = [...(activeConfiguration.score_levels || [])].sort((a, b) => a.order - b.order);

        // Find the level that contains this score
        const matchingLevel = sortedScoreLevels.find(level =>
            score >= level.min && score <= level.max
        );

        if (matchingLevel) {
            return {
                name: matchingLevel.label,
                color: matchingLevel.color,
                min: matchingLevel.min,
                max: matchingLevel.max,
            };
        }

        return null;
    };

    const calculateScore = (likelihood: number, consequence: number): number => {
        // Always use multiplication (likelihood * consequence)
        return likelihood * consequence;
    };

    const getCellInfo = (likelihood: number, consequence: number): CellInfo => {
        const key = `${likelihood}-${consequence}`;
        let cellInfo = cellInfoCache.current.get(key);

        if (!cellInfo) {
            const score = calculateScore(likelihood, consequence);
            const riskLevel = getRiskLevelForScore(score);
            cellInfo = { likelihood, consequence, score, riskLevel };
            cellInfoCache.current.set(key, cellInfo);
        }

        return cellInfo;
    };

    const getLikelihoodLabel = (likelihood: number): string => {
        const probability = activeConfiguration.probabilities.find(p => parseFloat(p.score) === likelihood);
        return probability?.label || `Level ${likelihood}`;
    };

    const getConsequenceLabel = (consequence: number): string => {
        const impact = activeConfiguration.impacts.find(i => parseFloat(i.score) === consequence);
        return impact?.label || `Level ${consequence}`;
    };

    const updateTooltipPosition = (x: number, y: number) => {
        if (tooltipRef.current) {
            const transform = `translate3d(${x + 10}px, ${y - 60}px, 0)`;
            tooltipRef.current.style.transform = transform;
        }
    };

    const showTooltip = (x: number, y: number) => {
        if (tooltipRef.current) {
            tooltipRef.current.style.left = `${x + 10}px`;
            tooltipRef.current.style.top = `${y - 60}px`;
            tooltipRef.current.style.display = 'block';
        }
    };

    const hideTooltip = () => {
        if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Update tooltip position and show it
        showTooltip(event.clientX, event.clientY);

        // Scale coordinates to canvas size
        const canvasX = (x / rect.width) * width;
        const canvasY = (y / rect.height) * height;

        const cellWidth = width / columns;
        const cellHeight = height / rows;

        const col = Math.floor(canvasX / cellWidth);
        const row = Math.floor(canvasY / cellHeight);

        // Check if mouse is within canvas bounds
        if (col >= 0 && col < columns && row >= 0 && row < rows) {
            const likelihood = rows - row;
            const consequence = col + 1;
            const cellKey = `${likelihood}-${consequence}`;

            // Only update React state when cell actually changes
            if (currentCellKey.current !== cellKey) {
                currentCellKey.current = cellKey;
                const cellInfo = getCellInfo(likelihood, consequence);

                setTooltipInfo({
                    visible: true,
                    likelihood: cellInfo.likelihood,
                    consequence: cellInfo.consequence,
                    score: cellInfo.score,
                    riskLevel: cellInfo.riskLevel,
                });
            }
        } else {
            if (currentCellKey.current !== null) {
                currentCellKey.current = null;
                setTooltipInfo((prev) => ({ ...prev, visible: false }));
            }
        }
    };

    const handleMouseLeave = () => {
        currentCellKey.current = null;
        setTooltipInfo((prev) => ({ ...prev, visible: false }));
        hideTooltip();
    };

    const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onCellClick) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Scale coordinates to canvas size
        const canvasX = (x / rect.width) * canvasSize.width;
        const canvasY = (y / rect.height) * canvasSize.height;

        const cellWidth = canvasSize.width / columns;
        const cellHeight = canvasSize.height / rows;

        const col = Math.floor(canvasX / cellWidth);
        const row = Math.floor(canvasY / cellHeight);

        // Check if click is within canvas bounds
        if (col >= 0 && col < columns && row >= 0 && row < rows) {
            const likelihood = rows - row;
            const consequence = col + 1;
            const score = calculateScore(likelihood, consequence);

            onCellClick(likelihood, consequence, score);
        }
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width: canvasWidth, height: canvasHeight } = canvasSize;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const cellWidth = canvasWidth / columns;
        const cellHeight = canvasHeight / rows;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // ============================
        // DRAW CELLS (SOLID COLORS)
        // ============================
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const likelihood = rows - row;
                const consequence = col + 1;
                const score = calculateScore(likelihood, consequence);

                const riskLevel = getRiskLevelForScore(score);

                ctx.fillStyle = riskLevel?.color || '#22c55e';

                ctx.fillRect(
                    col * cellWidth,
                    row * cellHeight,
                    cellWidth,
                    cellHeight
                );
            }
        }

        // ============================
        // GRID LINES
        // ============================
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;

        for (let i = 1; i < columns; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellWidth, 0);
            ctx.lineTo(i * cellWidth, canvasHeight);
            ctx.stroke();
        }

        for (let i = 1; i < rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellHeight);
            ctx.lineTo(canvasWidth, i * cellHeight);
            ctx.stroke();
        }

        // ============================
        // DRAW SCORES
        // ============================
        if (showScores) {
            const fontSize = Math.max(
                12,
                Math.min(cellWidth / 3, cellHeight / 3)
            );

            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const likelihood = rows - row;
                    const consequence = col + 1;
                    const score = calculateScore(likelihood, consequence);

                    const x = col * cellWidth + cellWidth / 2;
                    const y = row * cellHeight + cellHeight / 2;

                    ctx.fillText(score.toString(), x, y);
                }
            }
        }

        // ============================
        // AXIS LABELS
        // ============================
        const labelFontSize = Math.max(14, canvasWidth / 30);

        ctx.font = `600 ${labelFontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelOffset = Math.max(20, labelFontSize);

        // Likelihood (vertical)
        ctx.save();
        ctx.translate(labelOffset, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('', 0, 0);
        ctx.restore();

        // Consequence (horizontal)
        ctx.fillText(
            '',
            canvasWidth / 2,
            canvasHeight - labelOffset
        );

    }, [
        rows,
        columns,
        canvasSize.width,
        canvasSize.height,
        riskLevels,
        showScores,
    ]);


    useEffect(() => {
        cellInfoCache.current.clear();
    }, [rows, columns, riskLevels]);

    return (
        <div
            className={`flex flex-col items-center gap-4 px-4 py-2 ${className}`}
        >
            <div className="space-y-2 text-center">
                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                    {activeConfiguration.name} ({rows}×{columns})
                </h1>
                <p className="text-sm font-medium text-muted-foreground sm:text-base">
                    {riskLevels.length} Risk Levels | Score Range: 1-{maxScore}
                </p>
            </div>

            <div ref={containerRef} className="w-full max-w-4xl">
                <div className="relative flex justify-center">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="h-auto max-w-full cursor-pointer rounded-lg border-2 border-border"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleClick}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            aspectRatio: '1',
                        }}
                    />
                    <div
                        ref={tooltipRef}
                        className="pointer-events-none fixed z-50 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md sm:px-3 sm:py-2 sm:text-sm"
                        style={{
                            display: 'none',
                            position: 'fixed',
                            zIndex: 9999,
                        }}
                    >
                        <div className="space-y-1">
                            <div className="font-medium">
                                Risk Level:{' '}
                                {tooltipInfo.riskLevel?.name || 'Unknown'}
                            </div>
                            <div className="hidden sm:block">
                                Likelihood: {tooltipInfo.likelihood} (
                                {getLikelihoodLabel(tooltipInfo.likelihood)})
                            </div>
                            <div className="hidden sm:block">
                                Consequence: {tooltipInfo.consequence} (
                                {getConsequenceLabel(tooltipInfo.consequence)})
                            </div>
                            <div className="sm:hidden">
                                L:{tooltipInfo.likelihood} C:
                                {tooltipInfo.consequence}
                            </div>
                            <div>Score: {tooltipInfo.score}</div>
                            {tooltipInfo.riskLevel && (
                                <div className="flex items-center gap-2 border-t pt-1">
                                    <div
                                        className="h-2 w-2 rounded sm:h-3 sm:w-3"
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
                    {riskLevels.map((level) => (
                        <div
                            key={level.name}
                            className="flex min-w-0 flex-shrink-0 items-center gap-1.5 rounded-md bg-background/50 px-2 py-1.5 text-center shadow-sm ring-1 ring-border sm:gap-2 sm:px-3 sm:py-2"
                        >
                            <div
                                className="h-3 w-3 flex-shrink-0 rounded-full sm:h-4 sm:w-4"
                                style={{ backgroundColor: level.color }}
                            />
                            <span className="min-w-0 text-xs font-medium tracking-wide sm:text-sm">
                                <span className="block truncate sm:inline">
                                    {level.name}
                                </span>
                                <span className="block text-xs text-muted-foreground sm:ml-1 sm:inline">
                                    ({level.min}-{level.max})
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}