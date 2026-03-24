import DateTimeColumn from '@/components/date-time';
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
import { DataTableFilterItem } from '@/components/server-data-table-filter-item';
import { DataTableRangeDateFilter } from '@/components/server-data-table-range-date-filter';
import {
    DataTableSelectFilter,
    type SelectOption,
} from '@/components/server-data-table-select-filter';
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
import AppLayout from '@/layouts/app-layout';
import {
    BusinessUnit,
    MacroProcess,
    PaginatedData,
    Process,
    User,
} from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    FileText,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ProcessesIndexProps {
    processes: PaginatedData<Process>;
    stats: {
        total: number;
        active: number;
        risks: number;
    };
    managers: User[];
    macroProcesses: Pick<MacroProcess, 'id' | 'name'>[];
    businessUnits: Pick<BusinessUnit, 'id' | 'name'>[];
}

export default function ProcessesIndex({
    processes,
    stats,
    managers,
    macroProcesses,
    businessUnits,
}: ProcessesIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [processToDelete, setProcessToDelete] = useState<Process | null>(
        null,
    );
    const [exportLoading, setExportLoading] = useState(false);

    // Handle export functionality
    const handleExport = async () => {
        setExportLoading(true);

        try {
            // Get current URL parameters to maintain filters/search in export
            const params = new URLSearchParams(window.location.search);

            // Make request to export endpoint
            const response = await fetch(
                `/processes/export?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (response.ok) {
                // Create blob and download file
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `processes-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setExportLoading(false);
        }
    };

    // Status filter options
    const statusOptions: FacetedFilterOption[] = [
        {
            label: 'Active',
            value: 'Active',
            icon: CheckCircle2,
        },
        {
            label: 'Inactive',
            value: 'Inactive',
            icon: XCircle,
        },
    ];

    // Manager filter options
    const managerOptions: SelectOption[] = managers.map((manager) => ({
        value: String(manager.id),
        label: manager.name,
    }));

    // Macro Process filter options
    const macroProcessOptions: SelectOption[] = macroProcesses.map((mp) => ({
        value: String(mp.id),
        label: mp.name,
    }));

    // Business Unit filter options
    const businessUnitOptions: SelectOption[] = businessUnits.map((bu) => ({
        value: String(bu.id),
        label: bu.name,
    }));

    // Define table columns
    const columns: ColumnDef<Process>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            cell: ({ row }) => (
                <div className="font-mono">{row.getValue('code')}</div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <Link
                    href={`/processes/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },
        {
            accessorKey: 'macro_process',
            header: 'Macro Process',
            cell: ({ row }) => {
                const macroProcess = row.original.macro_process;
                if (!macroProcess) {
                    return (
                        <span className="text-muted-foreground">
                            No macro process
                        </span>
                    );
                }
                return (
                    <Link
                        href={`/macro-processes/${macroProcess.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        {macroProcess.name}
                    </Link>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'business_unit',
            header: 'Business Unit',
            cell: ({ row }) => {
                const businessUnit = row.original.macro_process?.business_unit;
                if (!businessUnit) {
                    return (
                        <span className="text-muted-foreground">
                            No business unit
                        </span>
                    );
                }
                return (
                    // <span className="text-sm text-muted-foreground">
                    //     {businessUnit.name}
                    // </span>
                    <Link
                        href={`/business-units/${businessUnit.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        {businessUnit.name}
                    </Link>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'managers',
            header: 'Managers',
            cell: ({ row }) => {
                const managers = row.original.managers || [];
                if (managers.length === 0) {
                    return (
                        <span className="text-muted-foreground">
                            No managers
                        </span>
                    );
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {managers.map((manager) => (
                            <Badge key={manager.id} variant="secondary">
                                {manager.name}
                            </Badge>
                        ))}
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'risks_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Risks" />
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.getValue('risks_count') || 0}
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.getValue('is_active');
                return (
                    <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className="capitalize"
                    >
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'updated_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('updated_at'));
                return <DateTimeColumn date={date} />;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const process = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-4 w-4 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(`/processes/${process.id}`)
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        `/processes/${process.id}/edit`,
                                    )
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setProcessToDelete(process);
                                    setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
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

    const handleDeleteConfirm = () => {
        if (processToDelete) {
            router.delete(`/processes/${processToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setProcessToDelete(null);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Processes', href: '/processes' }]}>
            <Head title="Processes" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Processes
                        </h1>
                        <p className="text-muted-foreground">
                            Manage processes across macro processes
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/processes/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Process
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Processes */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Processes
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Active */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Active
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.active}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (stats.active / stats.total) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Risks */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Risks
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.risks}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {(
                                                stats.risks / stats.total
                                            ).toFixed(1)}{' '}
                                            avg
                                        </span>
                                    )}
                                </div>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* DataTable */}
                <ServerDataTable
                    columns={columns}
                    data={processes}
                    searchPlaceholder="Search processes..."
                    onExport={handleExport}
                    exportLoading={exportLoading}
                    filters={
                        <>
                            <DataTableFilterItem>
                                <DataTableFacetedFilter
                                    filterKey="status"
                                    title="Status"
                                    options={statusOptions}
                                />
                            </DataTableFilterItem>
                            <DataTableFilterItem>
                                <DataTableSelectFilter
                                    filterKey="manager"
                                    title="Manager"
                                    placeholder="Select manager..."
                                    searchPlaceholder="Search managers..."
                                    emptyMessage="No managers found."
                                    options={managerOptions}
                                    showIcon={false}
                                />
                            </DataTableFilterItem>
                            <DataTableFilterItem>
                                <DataTableSelectFilter
                                    filterKey="macro_process"
                                    title="Macro Process"
                                    placeholder="Select macro process..."
                                    searchPlaceholder="Search macro processes..."
                                    emptyMessage="No macro processes found."
                                    options={macroProcessOptions}
                                    showIcon={false}
                                />
                            </DataTableFilterItem>
                            <DataTableFilterItem>
                                <DataTableSelectFilter
                                    filterKey="business_unit"
                                    title="Business Unit"
                                    placeholder="Select business unit..."
                                    searchPlaceholder="Search business units..."
                                    emptyMessage="No business units found."
                                    options={businessUnitOptions}
                                    showIcon={false}
                                />
                            </DataTableFilterItem>
                            <DataTableFilterItem>
                                <DataTableRangeDateFilter
                                    filterFromKey="date_from"
                                    filterToKey="date_to"
                                    title="Date Range"
                                    placeholder="Pick date range"
                                />
                            </DataTableFilterItem>
                        </>
                    }
                    initialState={{
                        columnPinning: {
                            right: ['actions'],
                        },
                    }}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Process</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {processToDelete?.name}"? This action cannot be
                            undone and will also remove all associated risks and
                            controls relationships.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
