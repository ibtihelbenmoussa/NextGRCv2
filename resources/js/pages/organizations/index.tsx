import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
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
import AdminSettingsLayout from '@/layouts/admin-settings/layout';
import { Organization, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Building2,
    CheckCircle2,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface OrganizationsIndexProps {
    organizations: PaginatedData<Organization>;
    stats: {
        total: number;
        active: number;
        users: number;
    };
}

export default function OrganizationsIndex({
    organizations,
    stats,
}: OrganizationsIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [organizationToDelete, setOrganizationToDelete] =
        useState<Organization | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    // Handle export functionality
    const handleExport = async () => {
        setExportLoading(true);

        try {
            // Get current URL parameters to maintain filters/search in export
            const params = new URLSearchParams(window.location.search);

            // Make request to export endpoint
            const response = await fetch(
                `/organizations/export?${params.toString()}`,
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
                link.download = `organizations-${new Date().toISOString().split('T')[0]}.xlsx`;
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

    // Define table columns
    const columns: ColumnDef<Organization>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('code')}</div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => <div>{row.getValue('name')}</div>,
        },
        {
            accessorKey: 'business_units_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Business Units" />
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.getValue('business_units_count') || 0}
                </div>
            ),
        },
        {
            accessorKey: 'users_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Users" />
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.getValue('users_count') || 0}
                </div>
            ),
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
            accessorKey: 'created_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'));
                return <div>{date.toLocaleDateString()}</div>;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const organization = row.original;
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
                                        `/organizations/${organization.id}`,
                                    )
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        `/organizations/${organization.id}/edit`,
                                    )
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setOrganizationToDelete(organization);
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
        if (organizationToDelete) {
            router.delete(`/organizations/${organizationToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setOrganizationToDelete(null);
                },
            });
        }
    };
    return (
        <AdminSettingsLayout title="Organizations">
            <Head title="Organizations" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Organizations
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your organizations and their structures
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/organizations/create')}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Organization
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Organizations */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Organizations
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Active Organizations */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Active Organizations
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

                    {/* Total Users */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Users
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.users}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {(
                                                stats.users / stats.total
                                            ).toFixed(1)}{' '}
                                            avg
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* DataTable */}
                <ServerDataTable
                    columns={columns}
                    data={organizations}
                    searchPlaceholder="Search organizations..."
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
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {organizationToDelete?.name}"? This action cannot be
                            undone and will also remove all associated business
                            units and data.
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
        </AdminSettingsLayout>
    );
}
