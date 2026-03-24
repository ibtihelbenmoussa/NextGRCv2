import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TooltipCellProps {
    /**
     * The main content to display in the cell
     */
    children: React.ReactNode;
    /**
     * Impact value (1-5)
     */
    impact?: number;
    /**
     * Probability/Likelihood value (1-5)
     */
    probability?: number;
    /**
     * Risk score (calculated or provided)
     */
    riskScore?: number;
    /**
     * Risk level label (e.g., "Low", "Medium", "High", "Critical")
     */
    riskLevel?: string;
    /**
     * Additional tooltip content
     */
    tooltipContent?: React.ReactNode;
    /**
     * Cell styling classes
     */
    className?: string;
    /**
     * Click handler for the cell
     */
    onClick?: () => void;
    /**
     * Whether the cell is selected/active
     */
    isSelected?: boolean;
    /**
     * Whether the cell is disabled
     */
    disabled?: boolean;
}

/**
 * Get descriptive label for impact/probability values
 */
const getScaleLabel = (value: number): string => {
    switch (value) {
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

/**
 * Get risk level color based on score
 */
const getRiskColor = (score: number): string => {
    if (score >= 15) return 'bg-red-500 hover:bg-red-600';
    if (score >= 10) return 'bg-orange-500 hover:bg-orange-600';
    if (score >= 5) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-green-500 hover:bg-green-600';
};

/**
 * A reusable cell component with tooltip functionality for displaying
 * risk-related information on hover
 */
export function TooltipCell({
    children,
    impact,
    probability,
    riskScore,
    riskLevel,
    tooltipContent,
    className,
    onClick,
    isSelected = false,
    disabled = false,
}: TooltipCellProps) {
    const calculatedRiskScore = riskScore || (impact && probability ? impact * probability : undefined);

    const cellContent = (
        <div
            className={cn(
                'relative min-h-[60px] rounded border p-2 transition-all',
                calculatedRiskScore && getRiskColor(calculatedRiskScore),
                onClick && !disabled && 'cursor-pointer',
                isSelected && 'ring-2 ring-primary ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed',
                className,
            )}
            onClick={onClick && !disabled ? onClick : undefined}
        >
            {children}
        </div>
    );

    // If no tooltip data is provided, return cell without tooltip
    if (!impact && !probability && !riskScore && !riskLevel && !tooltipContent) {
        return cellContent;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {cellContent}
            </TooltipTrigger>
            <TooltipContent>
                <div className="space-y-1">
                    {riskLevel && (
                        <div className="font-medium">
                            Risk Level: {riskLevel}
                        </div>
                    )}
                    {impact && (
                        <div>
                            Impact: {impact} ({getScaleLabel(impact)})
                        </div>
                    )}
                    {probability && (
                        <div>
                            Probability: {probability} ({getScaleLabel(probability)})
                        </div>
                    )}
                    {calculatedRiskScore && (
                        <div>
                            Risk Score: {calculatedRiskScore}
                        </div>
                    )}
                    {tooltipContent && (
                        <div className="mt-2 pt-2 border-t">
                            {tooltipContent}
                        </div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * Example usage component demonstrating different tooltip cell configurations
 */
export function TooltipCellExample() {
    return (
        <TooltipProvider>
            <div className="space-y-6 p-6">
                <h2 className="text-2xl font-bold">Tooltip Cell Examples</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Risk Matrix Cells</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((impact) => (
                            [1, 2, 3, 4, 5].map((probability) => (
                                <TooltipCell
                                    key={`${impact}-${probability}`}
                                    impact={impact}
                                    probability={probability}
                                    className="text-white text-xs font-bold"
                                    onClick={() => console.log(`Selected cell: ${impact}x${probability}`)}
                                >
                                    <div className="text-center">
                                        {impact * probability}
                                    </div>
                                </TooltipCell>
                            ))
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Custom Tooltip Content</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <TooltipCell
                            riskLevel="High"
                            riskScore={12}
                            className="bg-orange-100 border-orange-300"
                            tooltipContent={
                                <div>
                                    <div className="font-medium">Risk Details:</div>
                                    <div className="text-xs">
                                        • Requires immediate attention
                                        • Review quarterly
                                        • Assign risk owner
                                    </div>
                                </div>
                            }
                        >
                            <div className="text-center font-bold text-orange-800">
                                RISK-001
                            </div>
                        </TooltipCell>

                        <TooltipCell
                            impact={2}
                            probability={3}
                            riskLevel="Medium"
                            className="bg-yellow-100 border-yellow-300"
                            tooltipContent={
                                <div>
                                    <div className="font-medium">Control Information:</div>
                                    <div className="text-xs">
                                        • 2 controls implemented
                                        • Last tested: 2024-01-15
                                        • Effectiveness: 85%
                                    </div>
                                </div>
                            }
                        >
                            <div className="text-center font-bold text-yellow-800">
                                CTRL-005
                            </div>
                        </TooltipCell>

                        <TooltipCell
                            impact={1}
                            probability={2}
                            riskLevel="Low"
                            className="bg-green-100 border-green-300"
                            isSelected={true}
                        >
                            <div className="text-center font-bold text-green-800">
                                Selected Cell
                            </div>
                        </TooltipCell>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Disabled State</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <TooltipCell
                            impact={3}
                            probability={4}
                            disabled={true}
                            className="bg-gray-100 border-gray-300"
                        >
                            <div className="text-center text-gray-500">
                                Disabled Cell
                            </div>
                        </TooltipCell>

                        <TooltipCell
                            impact={2}
                            probability={2}
                            className="bg-blue-100 border-blue-300"
                            onClick={() => alert('Cell clicked!')}
                        >
                            <div className="text-center font-bold text-blue-800">
                                Clickable Cell
                            </div>
                        </TooltipCell>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

/**
 * Higher-order component to wrap any component with tooltip functionality
 */
export function withTooltip<T extends object>(
    Component: React.ComponentType<T>,
    tooltipProps: Omit<TooltipCellProps, 'children' | 'className' | 'onClick'>
) {
    return function WrappedComponent(props: T & { className?: string; onClick?: () => void }) {
        return (
            <TooltipCell
                {...tooltipProps}
                className={props.className}
                onClick={props.onClick}
            >
                <Component {...props} />
            </TooltipCell>
        );
    };
}
