import { CardUpload, FileUploadItem } from '@/components/card-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { MacroProcess, Process, User } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    Download,
    FileText,
    ImageIcon,
    Loader2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface ProcessEditProps {
    process: Process;
    macroProcesses: MacroProcess[];
    managers: User[];
}

export default function ProcessEdit({
    process,
    macroProcesses,
    managers,
}: ProcessEditProps) {
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm<{
        macro_process_id: string;
        name: string;
        code: string;
        description: string;
        objectives: string;
        manager_ids: string[];
        is_active: boolean;
        documents?: File[];
        document_categories?: (string | null)[];
        document_descriptions?: (string | null)[];
        _method: string;
    }>({
        macro_process_id: process.macro_process_id.toString(),
        name: process.name,
        code: process.code,
        description: process.description || '',
        objectives: process.objectives || '',
        manager_ids: process.managers?.map((m) => m.id.toString()) || [],
        is_active: process.is_active,
        _method: 'PUT',
    });

    const handleFilesChange = (files: FileUploadItem[]) => {
        setData({
            ...data,
            documents: files.map((f) => f.file),
            document_categories: files.map(() => null),
            document_descriptions: files.map(() => null),
        });
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/processes/${process.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Processes', href: '/processes' },
                {
                    title: process.name,
                    href: `/processes/${process.id}`,
                },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit ${process.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Process
                        </h1>
                        <p className="text-muted-foreground">
                            Update process details
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/processes/${process.id}`}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Process Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Macro Process */}
                            <SelectWithSearch
                                label="Macro Process"
                                placeholder="Select a macro process"
                                searchPlaceholder="Search macro processes..."
                                emptyMessage="No macro process found."
                                options={macroProcesses.map((mp) => ({
                                    value: mp.id.toString(),
                                    label: `${mp.name} (${mp.code})${mp.business_unit ? ` - ${mp.business_unit.name}` : ''}`,
                                }))}
                                value={data.macro_process_id}
                                onValueChange={(value) =>
                                    setData('macro_process_id', value)
                                }
                                required
                                allowClear={false}
                            />
                            {errors.macro_process_id && (
                                <p className="text-sm text-destructive">
                                    {errors.macro_process_id}
                                </p>
                            )}

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Order Processing"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Code */}
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                    placeholder="PROC-001"
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Describe the process..."
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Objectives */}
                            <div className="space-y-2">
                                <Label htmlFor="objectives">Objectives</Label>
                                <Textarea
                                    id="objectives"
                                    value={data.objectives}
                                    onChange={(e) =>
                                        setData('objectives', e.target.value)
                                    }
                                    placeholder="Define process objectives..."
                                    rows={3}
                                />
                                {errors.objectives && (
                                    <p className="text-sm text-destructive">
                                        {errors.objectives}
                                    </p>
                                )}
                            </div>

                            {/* Managers */}
                            <div className="space-y-2">
                                <Label htmlFor="manager_ids">Managers</Label>
                                <MultiSelect
                                    options={managers.map((manager) => ({
                                        value: manager.id.toString(),
                                        label: manager.name,
                                    }))}
                                    defaultValue={data.manager_ids}
                                    onValueChange={(selected) =>
                                        setData('manager_ids', selected)
                                    }
                                    placeholder="Select managers"
                                />
                                {errors.manager_ids && (
                                    <p className="text-sm text-destructive">
                                        {errors.manager_ids}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">
                                        Active Status
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                        Enable or disable this process
                                    </div>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents Section */}
                    <Card className="my-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Existing Documents */}
                            {process.documents &&
                                process.documents.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Existing Documents</Label>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {process.documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                                                >
                                                    {/* File Icon */}
                                                    <div className="flex-shrink-0 text-muted-foreground">
                                                        {getFileIcon(
                                                            doc.mime_type,
                                                        )}
                                                    </div>

                                                    {/* File Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatFileSize(
                                                                doc.file_size,
                                                            )}
                                                        </p>
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
                                                                handleDeleteDocument(
                                                                    doc.id,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingDocId ===
                                                                doc.id
                                                            }
                                                        >
                                                            {deletingDocId ===
                                                            doc.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* Upload New Documents */}
                            <div className="space-y-2">
                                <Label>Upload New Documents</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add new documents related to this process
                                </p>
                                <CardUpload
                                    maxFiles={10}
                                    maxSize={10 * 1024 * 1024}
                                    accept="*"
                                    multiple={true}
                                    simulateUpload={true}
                                    onFilesChange={handleFilesChange}
                                    labels={{
                                        dropzone:
                                            'Drag & drop files here, or click to select',
                                        browse: 'Browse files',
                                        maxSize: 'Max file size: 10MB',
                                        filesCount: 'files uploaded',
                                        addFiles: 'Add more files',
                                        removeAll: 'Remove all',
                                    }}
                                />
                                {errors.documents && (
                                    <p className="text-sm text-destructive">
                                        {errors.documents}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/processes/${process.id}`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Process'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
