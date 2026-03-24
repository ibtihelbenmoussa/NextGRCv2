import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter'
import { DataTableRangeDateFilter } from '@/components/server-data-table-range-date-filter'
import {
    DataTableSelectFilter,
    type SelectOption,
} from '@/components/server-data-table-select-filter'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AppLayout from '@/layouts/app-layout'
import { PaginatedData, User, Control } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import {
    CheckCircle2,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
    LayoutGrid,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Activity, LucideIcon
} from 'lucide-react'


import { useState, useMemo } from 'react'
import { AppSetting } from '@/types';
interface ScoreLevel {
    id: number
    label: string
    min: number
    max: number
    color: string
}

interface Risk {
    id: number
    name: string
    residual_impact?: number | null
    residual_likelihood?: number | null
}

interface ControlsIndexProps {
    controls: PaginatedData<Control>
    stats: {
        total: number
        active: number
        inactive: number
    }
    efficiencyStats: {
        effective: number
        partially_effective: number
        ineffective: number
    }
    owners: User[]
    activeConfiguration: {
        calculation_method: string
        score_levels: ScoreLevel[]
    }
    settings: AppSetting[]
}

export default function ControlsIndex({
    controls,
    stats,
    efficiencyStats,
    owners,
    settings,
    activeConfiguration,
}: ControlsIndexProps) {

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [controlToDelete, setControlToDelete] = useState<Control | null>(null)
    const [exportLoading, setExportLoading] = useState(false)

    /* ================= EXPORT ================= */

    const handleExport = async () => {
        setExportLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            const response = await fetch(`/controls/export?${params.toString()}`)

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `controls-${new Date().toISOString().split('T')[0]}.xlsx`
                link.click()
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setExportLoading(false)
        }
    }


    const currentMode = useMemo(() => {

        const modeSetting = settings?.find((s) => s.key === 'mode');

        return modeSetting?.value ?? null;

    }, [settings]);

    const isAuditMode = currentMode === 'audit';

    


    /* ================= SCORE ================= */

    const scoreLevels = useMemo(
        () => activeConfiguration?.score_levels ?? [],
        [activeConfiguration]
    )

    const getResidualLevel = (
        impact?: number | null,
        likelihood?: number | null
    ) => {
        if (!impact || !likelihood) return null
        const score = impact * likelihood
        return scoreLevels.find((l) => score >= l.min && score <= l.max)
    }

    /* ================= FILTERS ================= */

    const statusOptions: FacetedFilterOption[] = [
        { label: 'Active', value: 'Active', icon: CheckCircle2 },
        { label: 'Inactive', value: 'Inactive', icon: XCircle },
    ]

    const ownerOptions: SelectOption[] = owners.map((o) => ({
        value: String(o.id),
        label: o.name,
    }))

    /* ================= COLUMNS ================= */

    const columns: ColumnDef<Control>[] = [

        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            size: 150,
        },

        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            size: 220,
            cell: ({ row }) => (
                <Link
                    href={`/controls/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },

        {
            accessorKey: 'owner.name',
            header: 'Owner',
            size: 180,
            enableSorting: false,
        },

        {
            id: 'risks',
            header: 'Risks',
            size: 300,
            cell: ({ row }) => {
                const risks: Risk[] = row.original.risks ?? []

                if (!risks.length) {
                    return <span className="text-muted-foreground text-sm">No risks</span>
                }

                return (
                    <div className="flex gap-2 flex-wrap">
                        {risks.map((r) => {
                            const level = getResidualLevel(
                                r.residual_impact,
                                r.residual_likelihood
                            )

                            const baseColor = level?.color ?? '#e5e7eb'

                            return (
                                <Link key={r.id} href={`/risks/${r.id}`}>
                                    <Badge
                                        style={{
                                            backgroundColor: `${baseColor}20`,
                                            color: baseColor,
                                            border: `1px solid ${baseColor}`,
                                        }}
                                    >
                                        {r.name}
                                    </Badge>
                                </Link>
                            )
                        })}
                    </div>
                )
            },
        },

        {
            accessorKey: 'is_active',
            header: 'Status',
            size: 120,
            enableSorting: false,
            cell: ({ row }) => (
                <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
                    {row.getValue('is_active') ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },

        {
            accessorKey: 'updated_at',
            meta: {
                title: 'Last Updated',
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('updated_at'));
                return <div>{date.toLocaleDateString()}</div>;
            },
        },

        {
            id: 'actions',
            size: 70,
            meta: { pinned: 'right' },
            cell: ({ row }) => {
                const control = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem
                                onClick={() => router.visit(`/controls/${control.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => router.visit(`/controls/${control.id}/edit`)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                    setControlToDelete(control)
                                    setDeleteDialogOpen(true)
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    /* ================= DELETE ================= */

    const handleDeleteConfirm = () => {
        if (!controlToDelete) return

        router.delete(`/controls/${controlToDelete.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false)
                setControlToDelete(null)
            },
        })
    }

    /* ================= RENDER ================= */

    return (
        <AppLayout breadcrumbs={[{ title: 'Controls', href: '/controls' }]}>
            <Head title="Controls" />

            <div className="space-y-6 p-4">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Controls</h1>
                        <p className="text-muted-foreground">
                            Manage organizational controls and mitigation measures
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        {!isAuditMode && (
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/controls/settings')}
                                className="w-full sm:w-auto"
                            >
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                <span className="sm:inline">Control Settings</span>
                            </Button>
                        )}
                        <Button
                            onClick={() => router.visit('/controls/create')}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Control
                        </Button>
                    </div>

                </div>

                {/*  <div className="grid gap-3 md:grid-cols-3">
                    <StatCard label="Total Controls" value={stats.total} />
                    <StatCard label="Active Controls" value={stats.active} />
                    <StatCard label="Inactive Controls" value={stats.inactive} />
                </div> */}
                <div
                    className={`grid gap-3 ${isAuditMode ? "md:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-6"
                        }`}
                >
                    <StatCard
                        label="Total Controls"
                        value={stats.total}
                        icon={Activity}
                    />

                    <StatCard
                        label="Active Controls"
                        value={stats.active}
                        icon={CheckCircle2}
                    />

                    <StatCard
                        label="Inactive Controls"
                        value={stats.inactive}
                        icon={XCircle}
                    />

                    {!isAuditMode && (
                        <>
                            <StatCard
                                label="Effective Controls"
                                value={efficiencyStats.effective}
                                icon={ShieldCheck}
                            />

                            <StatCard
                                label="Partially Effective"
                                value={efficiencyStats.partially_effective}
                                icon={ShieldAlert}
                            />

                            <StatCard
                                label="Ineffective Controls"
                                value={efficiencyStats.ineffective}
                                icon={ShieldX}
                            />
                        </>
                    )}
                </div>
                <ServerDataTable
                    columns={columns}
                    data={controls}
                    searchPlaceholder="Search controls..."
                    onExport={handleExport}
                    exportLoading={exportLoading}
                    filters={
                        <>
                            <DataTableFacetedFilter
                                filterKey="status"
                                title="Status"
                                options={statusOptions}
                            />
                            <DataTableSelectFilter
                                filterKey="owner"
                                title="Owner"
                                placeholder="Select owner..."
                                searchPlaceholder="Search owners..."
                                emptyMessage="No owners found."
                                options={ownerOptions}
                                showIcon={false}
                            />
                            <DataTableRangeDateFilter
                                filterFromKey="date_from"
                                filterToKey="date_to"
                                title="Date Range"
                                placeholder="Pick date range"
                            />
                        </>
                    }
                    initialState={{
                        columnPinning: { right: ['actions'] },
                    }}
                />
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Control</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{controlToDelete?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: number
    icon?: LucideIcon
}) {
    return (
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>

            {Icon && (
                <Icon className="h-8 w-8 text-muted-foreground opacity-70" />
            )}
        </div>
    )
}
