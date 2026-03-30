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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    ChevronLeft,
    Edit3,
    Grid3x3,
    MoreVertical,
    Plus,
    Shield,
    Trash2,
    TrendingUp,
    Zap,
} from 'lucide-react'
import { useState } from 'react'

/* ------------------------------------------------------------------ */
/* COLORS & HELPERS */
/* ------------------------------------------------------------------ */
const getScoreLevelColor = (score: number, scoreLevels: RiskConfiguration['score_levels']): string => {
    if (!scoreLevels?.length) return '#64748b'

    for (const level of scoreLevels) {
        if (score >= level.min && score <= level.max) {
            return level.color || '#64748b'
        }
    }
    return '#64748b'
}

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */
interface Props {
    configurations: RiskConfiguration[]
    canManageRiskConfigurations: boolean
}

/* ------------------------------------------------------------------ */
/* RISK MATRIX SIMPLE */
/* ------------------------------------------------------------------ */
function RiskMatrixSimple({ config }: { config: RiskConfiguration }) {
    const impacts = config.impacts ?? []
    const probs = config.probabilities ?? []

    if (!impacts.length || !probs.length) {
        return <p className="text-sm text-gray-500 py-6 text-center">Risk matrix not defined</p>
    }

    const sortedImpacts = [...impacts].sort((a, b) => b.score - a.score)
    const sortedProbs = [...probs].sort((a, b) => a.score - b.score)

    return (
        <div className="overflow-x-auto">
            <table
                className="border-separate border-spacing-1 text-xs"
                style={{ tableLayout: 'fixed', width: '100%' }}
            >
                <colgroup>
                    <col style={{ width: '90px' }} />
                    {sortedProbs.map((_, i) => (
                        <col key={i} />  
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th></th>
                        {sortedProbs.map((p, i) => (
                            <th
                                key={i}
                                className="text-center font-medium text-gray-500 dark:text-slate-400 pb-2"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {p.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedImpacts.map((imp, ri) => (
                        <tr key={ri}>
                            <td
                                className="font-medium text-gray-500 dark:text-slate-400 pr-2 text-right"
                                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                                {imp.label}
                            </td>
                            {sortedProbs.map((prob, ci) => {
                                const score = imp.score * prob.score
                                const color = getScoreLevelColor(score, config.score_levels)
                                return (
                                    <td
                                        key={ci}
                                        className="text-center font-semibold text-white rounded-md"
                                        style={{
                                            backgroundColor: color,
                                            height: '36px',
                                        }}
                                        title={`Score: ${score}`}
                                    >
                                        {score}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* CONFIG CARD - SIMPLE DESIGN */
/* ------------------------------------------------------------------ */
function RiskConfigCard({
    config,
    canManage,
    onDeleteClick,
}: {
    config: RiskConfiguration
    canManage: boolean
    onDeleteClick: (id: number) => void
}) {
    return (
        <Card className="overflow-hidden">

            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => router.visit(`/risk-configurations/${config.id}/edit`)}
                                >
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => onDeleteClick(config.id!)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500">Calculation Method</p>
                        <p className="font-medium">
                            {config.calculation_method}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Evaluation Type</p>
                        <p className="font-medium">
                            {config.use_criterias ? 'With Criteria' : 'Simple'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Impact Levels</p>
                        <p className="font-medium">{config.impact_scale_max}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Probability Levels</p>
                        <p className="font-medium">{config.probability_scale_max}</p>
                    </div>
                </div>

                <Separator />

                {/* Impacts & Probabilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                            <h4 className="font-medium">Impacts</h4>
                        </div>
                        <div className="space-y-2">
                            {config.impacts?.map((impact, i) => (
                                <div key={i} className="flex justify-between bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
                                    <span>{impact.label}</span>
                                    <span className="font-semibold">
                                        {impact.score != null && !isNaN(impact.score)
                                            ? Number(impact.score)
                                            : '-'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="h-4 w-4 text-violet-500" />
                            <h4 className="font-medium">Probabilities</h4>
                        </div>
                        <div className="space-y-2">
                            {config.probabilities?.map((p, i) => (
                                <div key={i} className="flex justify-between bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
                                    <span>{p.label}</span>
                                    <span className="font-semibold">
                                        {p.score != null && !isNaN(p.score)
                                            ? Number(p.score)
                                            : '-'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Risk Matrix */}
                {/* Risk Matrix + Score Levels - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Risk Matrix */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Grid3x3 className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium">Risk Matrix</h4>
                        </div>
                        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <RiskMatrixSimple config={config} />
                        </div>
                    </div>

                    {/* Risk Levels */}
                    {config.score_levels?.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                                <h4 className="font-medium">Risk Levels</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {config.score_levels.map((level, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl border
               bg-gray-50
               dark:bg-neutral-900
               border-gray-100 dark:border-neutral-800"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: level.color || '#64748b' }}
                                        />

                                        <div>
                                            <p className="text-sm font-semibold">
                                                {level.label}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {level.min} — {level.max}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    )
}

/* ------------------------------------------------------------------ */
/* MAIN PAGE */
/* ------------------------------------------------------------------ */
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

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Risk Configurations</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage risk assessment matrices and parameters
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/risks">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>


                    </div>
                </div>

                {/* Content */}
                {configurations.length === 0 ? (
                    <Card className="py-16">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                                <Shield className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">No configurations yet</h3>
                            <p className="text-gray-500 max-w-sm mb-8">
                                Create your first risk configuration to start assessing risks.
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

            {/* Delete Dialog */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Are you sure you want to delete this configuration?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    )
}
