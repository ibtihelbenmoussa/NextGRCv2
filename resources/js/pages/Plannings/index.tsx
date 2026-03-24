import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter'
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
import { PaginatedData } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

/* ================= TYPES ================= */

interface Planning {
    id: number
    name: string
    code?: string
    year: number
    start_date: string
    end_date: string
    is_active: boolean
    updated_at: string
}

interface PlanningsIndexProps {
    plannings: PaginatedData<Planning>
    stats: {
        total: number
        active: number
        inactive: number
    }
}

/* ================= COMPONENT ================= */

export default function PlanningsIndex({
    plannings,
    stats,
}: PlanningsIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [planningToDelete, setPlanningToDelete] = useState<Planning | null>(null)
    const [exportLoading, setExportLoading] = useState(false)



    /*============== Eport ==================*/

    const handleExport = async () => {
        setExportLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            const response = await fetch(`/plan/export?${params.toString()}`)

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `plannings-${new Date().toISOString().split('T')[0]}.xlsx`
                link.click()
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setExportLoading(false)
        }
    }
    /* ================= FILTERS ================= */

    const statusOptions: FacetedFilterOption[] = [
        { label: 'Active', value: '1', icon: CheckCircle2 },
        { label: 'Inactive', value: '0', icon: XCircle },
    ]

    /* ================= COLUMNS ================= */

    const columns: ColumnDef<Planning>[] = [

        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            size: 140,
        },

        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            size: 220,
            cell: ({ row }) => (
                <Link
                    href={`/planning/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },

        {
            accessorKey: 'year',
            header: 'Year',
            size: 100,
        },

        {
            id: 'period',
            header: 'Period',
            size: 200,
            cell: ({ row }) => {
                const { start_date, end_date } = row.original

                if (!start_date || !end_date) {
                    return <span>-</span>
                }

                return (
                    <span>
                        {format(new Date(start_date), 'dd/MM/yyyy')} →{' '}
                        {format(new Date(end_date), 'dd/MM/yyyy')}
                    </span>
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
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('updated_at'))
                return <div>{date.toLocaleDateString()}</div>
            },
        },

        {
            id: 'actions',
            size: 70,
            meta: { pinned: 'right' },
            cell: ({ row }) => {
                const planning = row.original

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
                                onClick={() => router.visit(`/planning/${planning.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => router.visit(`/planning/${planning.id}/edit`)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                    setPlanningToDelete(planning)
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
        if (!planningToDelete) return

        router.delete(`/planning/${planningToDelete.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false)
                setPlanningToDelete(null)
            },
        })
    }

    /* ================= RENDER ================= */

    return (
        <AppLayout breadcrumbs={[{ title: 'Plannings', href: '/plannings' }]}>
            <Head title="Plannings" />

            <div className="space-y-6 p-4">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Plannings</h1>
                        <p className="text-muted-foreground">
                            Manage organization yearly plannings
                        </p>
                    </div>

                    <Button onClick={() => router.visit('/planning/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Planning
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <StatCard label="Total Plannings" value={stats.total} />
                    <StatCard label="Active Plannings" value={stats.active} />
                    <StatCard label="Inactive Plannings" value={stats.inactive} />
                </div>

                <ServerDataTable
                    columns={columns}
                    data={plannings}
                    searchPlaceholder="Search plannings..."
                    onExport={handleExport}
                    exportLoading={exportLoading}
                    filters={
                        <>
                            <DataTableFacetedFilter
                                filterKey="is_active"
                                title="Status"
                                options={statusOptions}
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
                        <AlertDialogTitle>Delete Planning</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{planningToDelete?.name}"?
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

/* ================= STAT CARD ================= */

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    )
}