import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { RiskConfiguration } from '@/types/risk-configuration';
import { Head, Link } from '@inertiajs/react';
import { Edit, Settings } from 'lucide-react';

const getProgressiveColors = (count: number): string[] => {
    const colorSchemes: Record<number, string[]> = {
        2: ['#10b981', '#ef4444'],
        3: ['#10b981', '#f59e0b', '#ef4444'],
        4: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        5: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626'],
        6: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b'],
        7: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d'],
        8: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a'],
        9: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#1c1917'],
        10: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#1c1917', '#0c0a09'],
    };
    return colorSchemes[count] ?? colorSchemes[3];
};

interface Props {
    configuration: RiskConfiguration;
}

export default function RiskConfigurationShow({ configuration }: Props) {
    const getCalculationMethodBadge = (method: string) => {
        switch (method) {
            case 'avg':
                return <Badge variant="secondary">Average</Badge>;
            case 'max':
                return <Badge variant="outline">Maximum</Badge>;
            default:
                return <Badge variant="outline">{method}</Badge>;
        }
    };

    const getCriteriaBadge = (useCriterias: boolean) =>
        useCriterias ? (
            <Badge variant="default">With Criteria</Badge>
        ) : (
            <Badge variant="secondary">Simple</Badge>
        );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Management', href: '/risks' },
                { title: 'Risk Configurations', href: '/risk-configurations' },
                { title: configuration.name, href: `/risk-configurations/${configuration.id}` },
            ]}
        >
            <Head title={`${configuration.name} - Risk Configuration`} />

            <div className="space-y-6 p-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {configuration.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Risk assessment configuration details
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/risk-configurations/${configuration.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>

                {/* Basic Info + Matrix */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Configuration parameters and settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Calculation Method</span>
                                {getCalculationMethodBadge(configuration.calculation_method)}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Assessment Type</span>
                                {getCriteriaBadge(configuration.use_criterias)}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Impact Scale</span>
                                <span className="text-sm text-muted-foreground">
                                    {configuration.impact_scale_max} levels
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Probability Scale</span>
                                <span className="text-sm text-muted-foreground">
                                    {configuration.probability_scale_max} levels
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Matrix Preview</CardTitle>
                            <CardDescription>
                                {configuration.impact_scale_max}×{configuration.probability_scale_max} Risk Matrix
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                                <Settings className="h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    Matrix visualization would be displayed here
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href="/risks/matrix">View Matrix</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Impact Levels */}
                <Card>
                    <CardHeader>
                        <CardTitle>Impact Levels</CardTitle>
                        <CardDescription>Defined impact levels and their scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {configuration.impacts.map((impact, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border text-sm font-semibold text-foreground">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{impact.label}</p>
                                            <p className="text-sm text-muted-foreground">Order: {impact.order}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-foreground">{impact.score}</p>
                                        <p className="text-xs text-muted-foreground">Score</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Probability Levels */}
                <Card>
                    <CardHeader>
                        <CardTitle>Probability Levels</CardTitle>
                        <CardDescription>Defined probability levels and their scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {configuration.probabilities.map((probability, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border text-sm font-semibold text-foreground">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{probability.label}</p>
                                            <p className="text-sm text-muted-foreground">Order: {probability.order}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-foreground">{probability.score}</p>
                                        <p className="text-xs text-muted-foreground">Score</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Score Levels */}
                {configuration.score_levels && configuration.score_levels.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Score Levels</CardTitle>
                            <CardDescription>Color-coded risk levels with their score ranges</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {configuration.score_levels.map((level: any, index: number) => {
                                    const progressiveColors = getProgressiveColors(configuration.score_levels!.length);
                                    const color = level.color || progressiveColors[index] || '#6b7280';

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 border rounded-lg bg-background"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-5 h-5 rounded-full ring-2 ring-background ring-offset-1 ring-offset-background flex-shrink-0"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <div>
                                                    <p className="font-semibold text-foreground">{level.label}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Level {index + 1} · Order: {level.order}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-foreground">
                                                    {level.min} – {level.max}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Score Range</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assessment Criteria */}
                {configuration.use_criterias &&
                    configuration.criterias &&
                    configuration.criterias.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assessment Criteria</CardTitle>
                                <CardDescription>Multi-dimensional assessment criteria</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {configuration.criterias.map((criteria, criteriaIndex) => (
                                        <div key={criteriaIndex} className="space-y-4">
                                            <div className="p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                                                        {criteriaIndex + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">
                                                            {criteria.name || '[No name]'}
                                                        </h4>
                                                        {criteria.description && (
                                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                                {criteria.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                                    {criteria.impacts.map((impact, impactIndex) => (
                                                        <div
                                                            key={impactIndex}
                                                            className="flex items-center justify-between p-3 bg-background border rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {impact.label}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-foreground">
                                                                {impact.score}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {criteriaIndex < (configuration.criterias?.length || 0) - 1 && (
                                                <Separator />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

            </div>
        </AppLayout>
    );
}
