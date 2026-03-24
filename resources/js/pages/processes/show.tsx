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
import { Process } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    ChevronRight,
    Download,
    Edit,
    FileText,
    Folder,
    ImageIcon,
    Loader2,
    Network,
    Plus,
    Shield,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface ProcessShowProps {
    process: Process;
}

export default function ProcessShow({ process }: ProcessShowProps) {
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
                { title: 'Processes', href: '/processes' },
                { title: process.name, href: '' },
            ]}
        >
            <Head title={process.name} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold md:text-2xl">
                                {process.name}
                            </h1>
                            <Badge
                                variant={
                                    process.is_active ? 'default' : 'secondary'
                                }
                            >
                                {process.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>Code: {process.code}</span>
                            {process.macro_process && (
                                <>
                                    <span className="hidden md:inline">•</span>
                                    <span>{process.macro_process.name}</span>
                                </>
                            )}
                            {process.macro_process?.business_unit && (
                                <>
                                    <span className="hidden md:inline">•</span>
                                    <span>
                                        {
                                            process.macro_process.business_unit
                                                .name
                                        }
                                    </span>
                                </>
                            )}
                        </div>
                        {process.description && (
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                {process.description}
                            </p>
                        )}
                        {process.objectives && (
                            <div className="mt-2 max-w-2xl rounded-lg border bg-muted/50 p-3">
                                <h3 className="mb-1 text-sm font-semibold">
                                    Objectives
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {process.objectives}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 md:flex-none"
                        >
                            <Link href={`/processes/${process.id}/edit`}>
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
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Risks</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {process.risks_count || 0}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Managers</span>
                        </div>
                        <div className="mt-1">
                            {process.managers && process.managers.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {process.managers.map((manager) => (
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
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Folder className="h-4 w-4" />
                            <span>Macro Process</span>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                            {process.macro_process?.name || '-'}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>Business Unit</span>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                            {process.macro_process?.business_unit?.name || '-'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="risks" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="risks">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Risks
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                        </TabsTrigger>
                        <TabsTrigger value="bpmn">
                            <Network className="mr-2 h-4 w-4" />
                            BPMN Diagrams
                        </TabsTrigger>
                    </TabsList>

                    {/* Risks Tab */}
                    <TabsContent value="risks" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">Risks</h2>
                            <Button
                                size="sm"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link
                                    href={`/risks/create?process_id=${process.id}`}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Risk
                                </Link>
                            </Button>
                        </div>

                        {process.risks && process.risks.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden rounded-lg border md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {process.risks.map((risk) => (
                                                <TableRow
                                                    key={risk.id}
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        (window.location.href = `/risks/${risk.id}`)
                                                    }
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                            {risk.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {risk.code}
                                                    </TableCell>
                                                    <TableCell>
                                                        {risk.category ? (
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                                <span>
                                                                    {
                                                                        risk.category
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {risk.inherent_score ? (
                                                            <Badge
                                                                variant={
                                                                    risk.inherent_score >
                                                                    15
                                                                        ? 'destructive'
                                                                        : risk.inherent_score >
                                                                            8
                                                                          ? 'default'
                                                                          : 'secondary'
                                                                }
                                                            >
                                                                {
                                                                    risk.inherent_score
                                                                }
                                                            </Badge>
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
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="space-y-3 md:hidden">
                                    {process.risks.map((risk) => (
                                        <Link
                                            key={risk.id}
                                            href={`/risks/${risk.id}`}
                                            className="block"
                                        >
                                            <div className="rounded-lg border p-4 hover:bg-accent">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {risk.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {risk.code}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {risk.category && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    <Shield className="mr-1 h-3 w-3" />
                                                                    {
                                                                        risk.category
                                                                    }
                                                                </Badge>
                                                            )}
                                                            {risk.inherent_score && (
                                                                <Badge
                                                                    variant={
                                                                        risk.inherent_score >
                                                                        15
                                                                            ? 'destructive'
                                                                            : risk.inherent_score >
                                                                                8
                                                                              ? 'default'
                                                                              : 'secondary'
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    Score:{' '}
                                                                    {
                                                                        risk.inherent_score
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                                <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                                <h3 className="mt-4 text-base font-semibold md:text-lg">
                                    No risks yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Get started by creating your first risk.
                                </p>
                                <Button className="mt-4" size="sm" asChild>
                                    <Link
                                        href={`/risks/create?process_id=${process.id}`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create First Risk
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">Documents</h2>
                        </div>

                        {process.documents && process.documents.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {process.documents.map((document) => (
                                    <div
                                        key={document.id}
                                        className="group relative flex h-20 flex-col items-center justify-center rounded-lg border bg-card p-2 transition-colors hover:border-primary"
                                    >
                                        <div className="flex h-full w-full flex-col items-center justify-center">
                                            {getFileIcon(document.mime_type)}
                                            <p className="mt-1 w-full truncate text-center text-xs font-medium">
                                                {document.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatFileSize(
                                                    document.file_size,
                                                )}
                                            </p>
                                        </div>
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-sm bg-background/80 backdrop-blur-sm hover:bg-background"
                                                onClick={() => {
                                                    window.location.href = `/documents/${document.id}/download`;
                                                }}
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-sm bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() =>
                                                    handleDeleteDocument(
                                                        document.id,
                                                    )
                                                }
                                                disabled={
                                                    deletingDocId ===
                                                    document.id
                                                }
                                            >
                                                {deletingDocId ===
                                                document.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
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
                                    Upload documents from the edit page.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* BPMN Diagrams Tab */}
                    <TabsContent value="bpmn" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">
                                BPMN Diagrams
                            </h2>
                            <Button
                                size="sm"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link
                                    href={`/bpmn-diagrams/create?process_id=${process.id}`}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Diagram
                                </Link>
                            </Button>
                        </div>

                        {process.bpmn_diagrams &&
                        process.bpmn_diagrams.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden rounded-lg border md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>
                                                    Description
                                                </TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {process.bpmn_diagrams.map(
                                                (diagram) => (
                                                    <TableRow
                                                        key={diagram.id}
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            (window.location.href = `/bpmn-diagrams/${diagram.id}`)
                                                        }
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Network className="h-4 w-4 text-muted-foreground" />
                                                                {diagram.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {diagram.description ||
                                                                '-'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {new Date(
                                                                diagram.created_at,
                                                            ).toLocaleDateString()}
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
                                    {process.bpmn_diagrams.map((diagram) => (
                                        <Link
                                            key={diagram.id}
                                            href={`/bpmn-diagrams/${diagram.id}`}
                                            className="block"
                                        >
                                            <div className="rounded-lg border p-4 hover:bg-accent">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Network className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {diagram.name}
                                                            </span>
                                                        </div>
                                                        {diagram.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    diagram.description
                                                                }
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            Created:{' '}
                                                            {new Date(
                                                                diagram.created_at,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                                <Network className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                                <h3 className="mt-4 text-base font-semibold md:text-lg">
                                    No BPMN diagrams yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Create BPMN diagrams to visualize your
                                    process flows.
                                </p>
                                <Button className="mt-4" size="sm" asChild>
                                    <Link
                                        href={`/bpmn-diagrams/create?process_id=${process.id}`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create First Diagram
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
