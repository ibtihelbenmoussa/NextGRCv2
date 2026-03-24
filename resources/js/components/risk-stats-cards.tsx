import { Shield, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import React from 'react';

interface RiskStatsCardsProps {
    total: number;
    active: number;
    high_inherent: number;
    high_residual: number;
}

export function RiskStatsCards({ total, active, high_inherent, high_residual }: RiskStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Total Risks */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Total Risks
                        </p>
                        <p className="text-xl font-bold sm:text-2xl">{total}</p>
                    </div>
                    <Shield className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
            </div>
            {/* Active Risks */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Active Risks
                        </p>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                            <p className="text-xl font-bold sm:text-2xl">{active}</p>
                            {total > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {Math.round((active / total) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
            </div>
            {/* High Inherent Risks */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            High Inherent
                        </p>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                            <p className="text-xl font-bold sm:text-2xl">{high_inherent}</p>
                            {total > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {Math.round((high_inherent / total) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
            </div>
            {/* High Residual Risks */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            High Residual
                        </p>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                            <p className="text-xl font-bold sm:text-2xl">{high_residual}</p>
                            {total > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {Math.round((high_residual / total) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
            </div>
        </div>
    );
}
