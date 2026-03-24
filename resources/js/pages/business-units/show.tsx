import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BusinessUnit } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    ChevronRight,
    Download,
    Edit,
    FileText,
    Folder,
    Image as ImageIcon,
    Loader2,
    Plus,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface BusinessUnitShowProps {
    businessUnit: BusinessUnit;
}

export default function BusinessUnitShow({
    businessUnit,
}: BusinessUnitShowProps) {
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

    const handleDeleteDocument = (documentId: number) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        setDeletingDocId(documentId);
        router.delete(`/documents/${documentId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingDocId(null),
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <ImageIcon className="h-8 w-8" />;
        }
        return <FileText className="h-8 w-8" />;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Business Units', href: '/business-units' },
                { title: businessUnit.name, href: '' },
            ]}
        >
            <Head title={businessUnit.name} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold md:text-2xl">
                                {businessUnit.name}
                            </h1>
                            <Badge
                                variant={
                                    businessUnit.is_active
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {businessUnit.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:gap-4">
                            <span>Code: {businessUnit.code}</span>
                            {businessUnit.organization && (
                                <>
                                    <span className="hidden md:inline">•</span>
                                    <span>
                                        {businessUnit.organization.name}
                                    </span>
                                </>
                            )}
                        </div>
                        {businessUnit.description && (
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                {businessUnit.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 md:flex-none"
                        >
                            <Link
                                href={`/business-units/${businessUnit.id}/edit`}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 md:flex-none"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Folder className="h-4 w-4" />
                            <span>Macro Processes</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {businessUnit.macro_processes_count || 0}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Managers</span>
                        </div>
                        <div className="mt-1">
                            {businessUnit.managers &&
                            businessUnit.managers.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {businessUnit.managers.map((manager) => (
                                        <Badge
                                            key={manager.id}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {manager.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No managers assigned
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-lg border p-3 sm:col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>Organization</span>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                            {businessUnit.organization?.name || '-'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="macro-processes" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="macro-processes">
                            <Folder className="mr-2 h-4 w-4" />
                            Macro Processes
                            {businessUnit.macro_processes_count !== undefined &&
                                businessUnit.macro_processes_count > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {businessUnit.macro_processes_count}
                                    </Badge>
                                )}
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                            {businessUnit.documents &&
                                businessUnit.documents.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {businessUnit.documents.length}
                                    </Badge>
                                )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Macro Processes Tab */}
                    <TabsContent value="macro-processes" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">
                                Macro Processes
                            </h2>
                            <Button
                                size="sm"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link
                                    href={`/macro-processes/create?business_unit_id=${businessUnit.id}`}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Macro Process
                                </Link>
                            </Button>
                        </div>

                        {businessUnit.macro_processes &&
                        businessUnit.macro_processes.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden rounded-lg border md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Managers</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {businessUnit.macro_processes.map(
                                                (macroProcess) => (
                                                    <TableRow
                                                        key={macroProcess.id}
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            (window.location.href = `/macro-processes/${macroProcess.id}`)
                                                        }
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Folder className="h-4 w-4 text-muted-foreground" />
                                                                {
                                                                    macroProcess.name
                                                                }
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {macroProcess.code}
                                                        </TableCell>
                                                        <TableCell>
                                                            {macroProcess.managers &&
                                                            macroProcess
                                                                .managers
                                                                .length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {macroProcess.managers.map(
                                                                        (
                                                                            manager,
                                                                        ) => (
                                                                            <Badge
                                                                                key={
                                                                                    manager.id
                                                                                }
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                {
                                                                                    manager.name
                                                                                }
                                                                            </Badge>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">
                                                                    -
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="space-y-3 md:hidden">
                                    {businessUnit.macro_processes.map(
                                        (macroProcess) => (
                                            <Link
                                                key={macroProcess.id}
                                                href={`/macro-processes/${macroProcess.id}`}
                                                className="block"
                                            >
                                                <div className="rounded-lg border p-4 hover:bg-accent">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Folder className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    {
                                                                        macroProcess.name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    macroProcess.code
                                                                }
                                                            </p>
                                                            {macroProcess.managers &&
                                                                macroProcess
                                                                    .managers
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {macroProcess.managers.map(
                                                                            (
                                                                                manager,
                                                                            ) => (
                                                                                <Badge
                                                                                    key={
                                                                                        manager.id
                                                                                    }
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        manager.name
                                                                                    }
                                                                                </Badge>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ),
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                                <Folder className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                                <h3 className="mt-4 text-base font-semibold md:text-lg">
                                    No macro processes yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Get started by creating your first macro
                                    process.
                                </p>
                                <Button className="mt-4" size="sm" asChild>
                                    <Link
                                        href={`/macro-processes/create?business_unit_id=${businessUnit.id}`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create First Macro Process
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">Documents</h2>
                            <Button
                                size="sm"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link
                                    href={`/business-units/${businessUnit.id}/edit`}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Upload Documents
                                </Link>
                            </Button>
                        </div>

                        {businessUnit.documents &&
                        businessUnit.documents.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {businessUnit.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                                    >
                                        {/* File Icon */}
                                        <div className="flex-shrink-0 text-muted-foreground">
                                            {getFileIcon(doc.mime_type)}
                                        </div>

                                        {/* File Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {doc.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(doc.file_size)}
                                            </p>
                                            {doc.category && (
                                                <Badge
                                                    variant="outline"
                                                    className="mt-1 text-xs"
                                                >
                                                    {doc.category}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                asChild
                                            >
                                                <a
                                                    href={`/documents/${doc.id}/download`}
                                                    download
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleDeleteDocument(doc.id)
                                                }
                                                disabled={
                                                    deletingDocId === doc.id
                                                }
                                            >
                                                {deletingDocId === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                                <FileText className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                                <h3 className="mt-4 text-base font-semibold md:text-lg">
                                    No documents yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Upload documents related to this business
                                    unit.
                                </p>
                                <Button className="mt-4" size="sm" asChild>
                                    <Link
                                        href={`/business-units/${businessUnit.id}/edit`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Upload First Document
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
