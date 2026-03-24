import DateTimeColumn from '@/components/date-time';
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
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
import { BusinessUnit, PaginatedData, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Building2,
    CheckCircle2,
    Eye,
    Folder,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface BusinessUnitsIndexProps {
    businessUnits: PaginatedData<BusinessUnit>;
    stats: {
        total: number;
        active: number;
        macro_processes: number;
    };
    managers: User[];
}

export default function BusinessUnitsIndex({
    businessUnits,
    stats,
    managers,
}: BusinessUnitsIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [businessUnitToDelete, setBusinessUnitToDelete] =
        useState<BusinessUnit | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    // Handle export functionality
    const handleExport = async () => {
        setExportLoading(true);

        try {
            // Get current URL parameters to maintain filters/search in export
            const params = new URLSearchParams(window.location.search);

            // Make request to export endpoint
            const response = await fetch(
                `/business-units/export?${params.toString()}`,
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
                link.download = `business-units-${new Date().toISOString().split('T')[0]}.xlsx`;
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

    // Define table columns
    const columns: ColumnDef<BusinessUnit>[] = [
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
                    href={`/business-units/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
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
                const maxVisible = 3;
                const visibleManagers = managers.slice(0, maxVisible);
                const extraCount = managers.length - maxVisible;
                return (
                    <div className="flex flex-wrap gap-1">
                        {visibleManagers.map((manager) => (
                            <Badge key={manager.id} variant="secondary">
                                {manager.name}
                            </Badge>
                        ))}
                        {extraCount > 0 && (
                            <Badge variant="outline" className="px-2 text-xs">
                                +{extraCount}
                            </Badge>
                        )}
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'macro_processes_count',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Macro Processes"
                />
            ),
            meta: {
                title: 'Macro Processes',
            },
            cell: ({ row }) => (
                <div className="text-center">
                    {row.getValue('macro_processes_count') || 0}
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
            meta: {
                title: 'Last Updated',
            },
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
                const businessUnit = row.original;
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
                                    router.visit(
                                        `/business-units/${businessUnit.id}`,
                                    )
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        `/business-units/${businessUnit.id}/edit`,
                                    )
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setBusinessUnitToDelete(businessUnit);
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
            meta: {
                pinned: 'right',
            },
        },
    ];

    const handleDeleteConfirm = () => {
        if (businessUnitToDelete) {
            router.delete(`/business-units/${businessUnitToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setBusinessUnitToDelete(null);
                },
            });
        }
    };

    // Pin the actions column to the right using initialState
    return (
        <AppLayout
            breadcrumbs={[{ title: 'Business Units', href: '/business-units' }]}
        >
            <Head title="Business Units" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Business Units
                        </h1>
                        <p className="text-muted-foreground">
                            Manage organizational business units and structure
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/business-units/create')}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Business Unit
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Business Units */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Business Units
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Active Units */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Active Units
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

                    {/* Macro Processes */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Macro Processes
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.macro_processes}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {(
                                                stats.macro_processes /
                                                stats.total
                                            ).toFixed(1)}{' '}
                                            avg
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Folder className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* DataTable */}
                <ServerDataTable
                    columns={columns}
                    data={businessUnits}
                    searchPlaceholder="Search business units..."
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
                                filterKey="manager"
                                title="Manager"
                                placeholder="Select manager..."
                                searchPlaceholder="Search managers..."
                                emptyMessage="No managers found."
                                options={managerOptions}
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
                        <AlertDialogTitle>
                            Delete Business Unit
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {businessUnitToDelete?.name}"? This action cannot be
                            undone and will also remove all associated macro
                            processes.
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
    );
}
