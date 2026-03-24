import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskMatrixORM } from '@/components/risk-matrix-orm';
import React from 'react';
import { RiskConfiguration } from '@/types/risk-configuration';

interface RiskMatrixCardProps {
    activeConfiguration: RiskConfiguration | null | undefined;
    risks: any[];
    canManageRiskMatrix: boolean;
    onRiskClick: (risk: any) => void;
    onManageMatrixClick: () => void;
    className?: string;
}

export function RiskMatrixCard({
    activeConfiguration,
    risks,
    canManageRiskMatrix,
    onRiskClick,
    onManageMatrixClick,
    className = '',
}: RiskMatrixCardProps) {
    return (
        <Card className={`shadow-none ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Risk Matrix
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
                {activeConfiguration ? (
                    <div className="flex w-full justify-center">
                        <div className="w-full overflow-x-auto">
                            <div className="mx-auto max-w-sm min-w-[250px] sm:max-w-md md:max-w-lg">
                                <RiskMatrixORM
                                    configuration={activeConfiguration}
                                    risks={risks}
                                    onRiskClick={onRiskClick}
                                    onCellClick={(impact, probability) => {
                                        // TODO: Optionally expose cell click handler
                                        console.log(`Cell clicked: Impact ${impact}, Probability ${probability}`);
                                    }}
                                    showScores={true}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                        <div className="max-w-sm space-y-3 text-center">
                            <Grid3x3 className="mx-auto h-12 w-12 opacity-30" />
                            <div className="space-y-2">
                                <p className="font-medium text-foreground">Risk Matrix Not Available</p>
                                <p className="text-sm">
                                    A risk matrix configuration is required to visualize risks. This defines
                                    impact and likelihood scales for risk assessment.
                                </p>
                            </div>
                            {canManageRiskMatrix ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onManageMatrixClick}
                                    className="mt-3"
                                >
                                    <Grid3x3 className="mr-2 h-4 w-4" />
                                    Set Up Risk Matrix
                                </Button>
                            ) : (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Contact your administrator to configure the risk matrix
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
