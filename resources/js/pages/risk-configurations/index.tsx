import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AppLayout from '@/layouts/app-layout'
import { RiskConfiguration } from '@/types/risk-configuration'
import { Head, Link, router } from '@inertiajs/react'
import {
    AlertTriangle,
    BarChart3,
    Edit3,
    Eye,
    MoreVertical,
    Plus,
    Settings,
    Shield,
    Trash2,
    TrendingUp,
    Zap, ChevronLeft
} from 'lucide-react'
import { useState } from 'react'

/* ---------------- COLORS ---------------- */

const getProgressiveColors = (count: number): string[] => {
    const colorSchemes: Record<number, string[]> = {
        2: ['#10b981', '#ef4444'],
        3: ['#10b981', '#f59e0b', '#ef4444'],
        4: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        5: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626'],
        6: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b'],
        7: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d'],
        8: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a'],
        9: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000000'],
        10: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000000', '#000000'],
    }
    return colorSchemes[count] || colorSchemes[3]
}

/* ---------------- BADGES ---------------- */

const getCalculationMethodBadge = (method: string) => {
    if (method === 'avg') return <Badge variant="secondary">Average</Badge>
    if (method === 'max') return <Badge variant="outline">Maximum</Badge>
    return <Badge variant="outline">{method}</Badge>
}

const getCriteriaBadge = (useCriterias: boolean) => {
    return useCriterias
        ? <Badge>With Criteria</Badge>
        : <Badge variant="secondary">Simple</Badge>
}

/* ---------------- TYPES ---------------- */

interface Props {
    configurations: RiskConfiguration[]
    canManageRiskConfigurations: boolean
}

/* ---------------- INFO BLOCK ---------------- */

function InfoBlock({
    title,
    icon,
    children,
}: {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-slate-900 dark:border-slate-600 bg-card p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </span>
            </div>
            {children}
        </div>
    )
}

/* ---------------- CARD ---------------- */

function RiskConfigCard({
    config,
    canManage,
    onDeleteClick,
}: {
    config: RiskConfiguration
    canManage: boolean
    onDeleteClick: (id: number) => void
}) {
    const progressiveColors = getProgressiveColors(config.score_levels?.length || 3)

    return (
        <div className="text-sm font-normal text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-card shadow-sm">

            {/* HEADER */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-base font-bold">{config.name}</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            {/*   <Link href={`/risk-configurations/${config.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link> */}
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuItem onClick={() => router.visit(`/risk-configurations/${config.id}/edit`)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => onDeleteClick(config.id!)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* SETTINGS + IMPACTS + PROBABILITIES */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <InfoBlock title="Settings" icon={<Zap className="w-4 h-4 text-blue-500" />}>
                    <div className="flex justify-between text-sm">
                        <span>Method</span>
                        {getCalculationMethodBadge(config.calculation_method)}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                        <span>Assessment</span>
                        {getCriteriaBadge(config.use_criterias)}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Impact Scale</span>
                        <span className="text-sm text-muted-foreground">{config.impact_scale_max} levels</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Probability Scale</span>
                        <span className="text-sm text-muted-foreground">{config.probability_scale_max} levels</span>
                    </div>
                </InfoBlock>

                <InfoBlock title="Impacts" icon={<TrendingUp className="w-4 h-4 text-orange-500" />}>
                    {config.impacts?.map((impact, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span>{impact.label}</span>
                            <span className="font-semibold">{impact.score}</span>
                        </div>
                    ))}
                </InfoBlock>

                <InfoBlock title="Probabilities" icon={<BarChart3 className="w-4 h-4 text-violet-500" />}>
                    {config.probabilities?.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span>{p.label}</span>
                            <span className="font-semibold">{p.score}</span>
                        </div>
                    ))}
                </InfoBlock>
            </div>

            {/* SCORE LEVELS */}
            {config.score_levels?.length > 0 && (
                <div className="mb-4">
                    <InfoBlock title="Risk Score Levels" icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}>
                        {config.score_levels.map((level, i) => {
                            const color = level.color || progressiveColors[i]
                            return (
                                <div key={i} className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                        <span className="text-sm font-medium">
                                            {level.label}
                                            <p className="text-xs text-muted-foreground">Level {i + 1} · Order: {level.order}</p>
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {level.min} - {level.max}
                                        <p className="text-xs text-muted-foreground">Score Range</p>
                                    </span>
                                </div>
                            )
                        })}
                    </InfoBlock>
                </div>
            )}

            {/* CRITERIAS */}
            {config.use_criterias && config.criterias?.length > 0 && (
                <InfoBlock title="Criteria Details" icon={<AlertTriangle className="w-4 h-4 text-blue-500" />}>
                    {config.criterias.map((criteria, criteriaIndex) => (
                        <div key={criteriaIndex} className="space-y-4">
                            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-sm font-semibold text-blue-700 dark:text-blue-300">
                                        {criteriaIndex + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                                            {criteria.name || '[No name]'}
                                        </h4>
                                        {criteria.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {criteria.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {criteria.impacts?.map((impact, impactIndex) => (
                                        <div key={impactIndex} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 border rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-400" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {impact.impact_label}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {impact.score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {criteriaIndex < config.criterias.length - 1 && <Separator />}
                        </div>
                    ))}
                </InfoBlock>
            )}
        </div>
    )
}

/* ---------------- PAGE ---------------- */

export default function RiskConfigurationsIndex({
    configurations,
    canManageRiskConfigurations,
}: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const handleConfirmDelete = () => {
        if (deletingId) {
            router.delete(`/risk-configurations/${deletingId}`)
            setDeletingId(null)
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Management', href: '/risks' },
                { title: 'Risk Configurations', href: '/risk-configurations' },
            ]}
        >
            <Head title="Risk Configurations" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-2 sm:flex-row justify-end">
                    <Button variant="outline" asChild>
                        <Link href="/risks">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>


                {configurations.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Risk Configurations</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Create your first risk configuration to start assessing risks with your organization's specific criteria.
                            </p>
                            {canManageRiskConfigurations && (
                                <Button asChild>
                                    <Link href="/risk-configurations/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Configuration
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {configurations.map((config) => (
                            <RiskConfigCard
                                key={config.id}
                                config={config}
                                canManage={canManageRiskConfigurations}
                                onDeleteClick={setDeletingId}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this configuration? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    )
}
