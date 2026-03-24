import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Building2,
    CheckCircle2,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import DateTimeColumn from '@/components/date-time';
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { DataTableFacetedFilter, type FacetedFilterOption } from '@/components/server-data-table-faceted-filter';
import { DataTableRangeDateFilter } from '@/components/server-data-table-range-date-filter';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PaginatedData, PredefindTest } from '@/types';

interface PredefinedTestsIndexProps {
    tests: PaginatedData<PredefindTest>;
    stats: {
        total: number;
        active: number;
        inactive: number;
    };
    filters: Record<string, any>;
}

export default function PredefinedTestsIndex({
    tests,
    stats,
    filters,
}: PredefinedTestsIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState<PredefindTest | null>(null);
    const [exportLoading, setExportLoading] = useState(false)
 
     const handleExport = async () => {
            setExportLoading(true)
            try {
                const params = new URLSearchParams(window.location.search)
                const response = await fetch(`/predefined/export?${params.toString()}`)
    
                if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `predefined-${new Date().toISOString().split('T')[0]}.xlsx`
                    link.click()
                    window.URL.revokeObjectURL(url)
                }
            } catch (error) {
                console.error('Export error:', error)
            } finally {
                setExportLoading(false)
            }
        } 
    
    const statusOptions: FacetedFilterOption[] = [
        { label: 'Active', value: 'Active', icon: CheckCircle2 },
        { label: 'Inactive', value: 'Inactive', icon: XCircle },
    ]
    const columns: ColumnDef<PredefindTest>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            size: 140,
            cell: ({ row }) => (
                <span className="font-mono whitespace-nowrap">
                    {row.getValue('code')}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            size: 240,
            cell: ({ row }) => (
                <Link
                    href={`/predefined-tests/${row.original.id}`}
                    className="font-medium hover:underline whitespace-nowrap"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            size: 110,
            enableSorting: false,
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id) ? 'active' : 'inactive');
            },
            cell: ({ row }) => {
                const isActive = row.getValue('is_active') as boolean;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'updated_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            size: 160,
            cell: ({ row }) => {
                const date = new Date(row.getValue('updated_at'))
                return (
                    <div className="whitespace-nowrap">
                        {date.toLocaleDateString()}
                    </div>
                )
            },
        },
        {
            id: 'actions',
            size: 60,
            meta: { pinned: 'right' },
            cell: ({ row }) => {
                const test = row.original;
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
                                onClick={() => router.visit(`/predefined-tests/${test.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => router.visit(`/predefined-tests/${test.id}/edit`)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                    setTestToDelete(test);
                                    setDeleteDialogOpen(true);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Predefined Tests', href: '/predefined-tests' }]}
        >
            <Head title="Predefined Tests" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Predefined Tests
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your organization's predefined tests and mitigation measures
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/predefined-tests/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Test
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Total Predefined Tests
                                </p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Active Predefined Tests</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">{stats.active}</p>
                                    {stats.total > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round((stats.active / stats.total) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Inactive Predefined Tests</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">{stats.inactive}</p>
                                    {stats.total > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round((stats.inactive / stats.total) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <XCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <ServerDataTable
                    columns={columns}
                    data={tests}
                    searchPlaceholder="Search tests..."
                    onExport={handleExport} 
                    exportLoading={exportLoading}
                    filters={
                        <>
                            <DataTableFacetedFilter
                                filterKey="status"
                                title="Status"
                                options={statusOptions}
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

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the predefined test "
                                {testToDelete?.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                    if (testToDelete) {
                                        router.delete(`/predefined-tests/${testToDelete.id}`, {
                                            onSuccess: () => setDeleteDialogOpen(false),
                                        });
                                    }
                                }}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}