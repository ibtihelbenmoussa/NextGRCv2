import { BpmnViewerWithProperties } from '@/components/bpmn-viewer';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { BPMNDiagram, PaginatedData, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    CheckCircle2,
    ChevronLeftIcon,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function BPMNIndex({
    diagrams,
    stats,
    users,
}: {
    diagrams: PaginatedData<BPMNDiagram>;
    stats?: {
        total: number;
        process_diagrams: number;
        macro_process_diagrams: number;
    };
    users?: User[];
}) {
    // Handle loading states and provide defaults
    const isLoading = !diagrams || !diagrams.data;
    const statsData = stats || {
        total: 0,
        process_diagrams: 0,
        macro_process_diagrams: 0,
    };
    const usersData = users || [];
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [diagramToDelete, setDiagramToDelete] = useState<BPMNDiagram | null>(
        null,
    );
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [diagramToPreview, setDiagramToPreview] =
        useState<BPMNDiagram | null>(null);
    const [dialogTitle, setDialogTitle] = useState<string | null>(null);

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

    // Owner filter options
    const ownerOptions: SelectOption[] = usersData.map((user) => ({
        value: String(user.id),
        label: user.name,
    }));

    // Define table columns
    const columns: ColumnDef<BPMNDiagram>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
                const diagram = row.original;
                return (
                    <div
                        className="flex cursor-pointer items-center gap-2 font-medium hover:underline"
                        onClick={() => {
                            setDiagramToPreview(diagram);
                            setPreviewDialogOpen(true);
                            setDialogTitle(diagram.name);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                        {row.getValue('name')}
                    </div>
                );
            },
        },
        // {
        //     id: 'preview',
        //     header: 'Preview',
        //     cell: ({ row }) => {
        //         const diagram = row.original;
        //         return (
        //             <Button
        //                 variant="ghost"
        //                 className="h-4 w-4 cursor-pointer"
        //                 onClick={() => {
        //                     setDiagramToPreview(diagram);
        //                     setPreviewDialogOpen(true);
        //                     setDialogTitle(diagram.name);
        //                 }}
        //             >
        //                 <Eye />
        //             </Button>
        //         );
        //     },
        // },
        {
            accessorKey: 'diagramable_type',
            meta: {
                title: 'Type',
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
            cell: ({ row }) => <div>{row.getValue('diagramable_type')}</div>,
        },
        {
            accessorKey: 'uploaded_by',
            header: 'Created By',
            cell: ({ row }) => {
                const uploader = usersData.find(
                    (u) => u.id === row.getValue('uploaded_by'),
                );
                return <div>{uploader?.name || '-'}</div>;
            },
        },
        {
            accessorKey: 'diagramable_name',
            meta: {
                title: 'Associated With',
            },
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Associated With"
                />
            ),
            cell: ({ row }) => (
                <>
                    <a
                        href={`/${row.original.diagramable_type === 'Macro Process' ? 'macro-processes' : 'processes'}/${row.original.diagramable_id}`}
                        className="hover:underline"
                    >
                        {row.getValue('diagramable_name') ||
                            row.original.diagramable_type}
                    </a>
                </>
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
                const updatedAt = new Date(row.getValue('updated_at'));
                return <DateTimeColumn date={updatedAt} />;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const diagram = row.original;
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
                                    router.visit(`/bpmn-diagrams/${diagram.id}`)
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        `/bpmn-diagrams/${diagram.id}/edit`,
                                    )
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setDiagramToDelete(diagram);
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
        if (diagramToDelete) {
            router.delete(`/bpmn-diagrams/${diagramToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setDiagramToDelete(null);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'BPMN Diagrams', href: '/bpmn' }]}>
            <Head title="BPMN Diagrams" />
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            BPMN Diagrams
                        </h1>
                        <p className="text-muted-foreground">
                            Manage BPMN diagrams for processes and macro
                            processes
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/bpmn-diagrams/create')}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add BPMN Diagram
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Diagrams
                            </p>
                            <p className="text-2xl font-bold">
                                {statsData.total}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Process Diagrams
                            </p>
                            <p className="text-2xl font-bold">
                                {statsData.process_diagrams}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Macro Process Diagrams
                            </p>
                            <p className="text-2xl font-bold">
                                {statsData.macro_process_diagrams}
                            </p>
                        </div>
                    </div>
                </div>

                {/* DataTable */}
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <p className="text-muted-foreground">
                            Loading BPMN diagrams...
                        </p>
                    </div>
                ) : (
                    <ServerDataTable
                        columns={columns}
                        data={diagrams}
                        searchPlaceholder="Search BPMN diagrams..."
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
                            columnPinning: {
                                right: ['actions'],
                            },
                        }}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete BPMN Diagram</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {diagramToDelete?.name}"? This action cannot be
                            undone.
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

            {/* Preview Dialog */}
            <Dialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
            >
                <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
                    <ScrollArea className="flex flex-col justify-between overflow-hidden">
                        <DialogHeader className="contents space-y-0 text-left">
                            <DialogTitle className="px-6 pt-6">
                                {dialogTitle || 'BPMN Diagram Preview'}
                            </DialogTitle>
                            <DialogDescription asChild>
                                <div className="p-6">
                                    {diagramToPreview &&
                                    diagramToPreview.bpmn_xml ? (
                                        <BpmnViewerWithProperties
                                            xml={diagramToPreview.bpmn_xml}
                                        />
                                    ) : (
                                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                                            No BPMN diagram content available
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                    </ScrollArea>
                    <DialogFooter className="px-6 pb-6 sm:justify-end">
                        <DialogClose asChild>
                            <Button variant="outline">
                                <ChevronLeftIcon />
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
