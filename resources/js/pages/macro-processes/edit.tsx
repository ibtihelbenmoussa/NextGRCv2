import { CardUpload, type FileUploadItem } from '@/components/card-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BusinessUnit, MacroProcess, User } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    Download,
    FileText,
    Folder,
    Image as ImageIcon,
    Loader2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface MacroProcessEditProps {
    macroProcess: MacroProcess;
    businessUnits: BusinessUnit[];
    managers: User[];
}

export default function MacroProcessEdit({
    macroProcess,
    businessUnits,
    managers,
}: MacroProcessEditProps) {
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm<{
        business_unit_id: string;
        name: string;
        code: string;
        description: string;
        manager_ids: string[];
        is_active: boolean;
        documents?: File[];
        document_categories?: (string | null)[];
        document_descriptions?: (string | null)[];
        _method: string;
    }>({
        business_unit_id: macroProcess.business_unit_id.toString(),
        name: macroProcess.name,
        code: macroProcess.code,
        description: macroProcess.description || '',
        manager_ids: macroProcess.managers?.map((m) => m.id.toString()) || [],
        is_active: macroProcess.is_active,
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
        post(`/macro-processes/${macroProcess.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Macro Processes', href: '/macro-processes' },
                {
                    title: macroProcess.name,
                    href: `/macro-processes/${macroProcess.id}`,
                },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit ${macroProcess.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Macro Process
                        </h1>
                        <p className="text-muted-foreground">
                            Update macro process details
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/macro-processes/${macroProcess.id}`}>
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
                                <Folder className="h-5 w-5" />
                                Macro Process Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Business Unit */}
                            <SelectWithSearch
                                label="Business Unit"
                                placeholder="Select a business unit"
                                searchPlaceholder="Search business units..."
                                emptyMessage="No business unit found."
                                options={businessUnits.map((bu) => ({
                                    value: bu.id.toString(),
                                    label: `${bu.name} (${bu.code})`,
                                }))}
                                value={data.business_unit_id}
                                onValueChange={(value) =>
                                    setData('business_unit_id', value)
                                }
                                required
                                allowClear={false}
                            />
                            {errors.business_unit_id && (
                                <p className="text-sm text-destructive">
                                    {errors.business_unit_id}
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
                                    placeholder="Sales Management"
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
                                        setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="SM"
                                    maxLength={50}
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
                                    placeholder="Brief description of the macro process"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
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

                            {/* Active Status */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">
                                        Active Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Set whether this macro process is
                                        currently active
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>
                            {errors.is_active && (
                                <p className="text-sm text-destructive">
                                    {errors.is_active}
                                </p>
                            )}
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
                            {macroProcess.documents &&
                                macroProcess.documents.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Existing Documents</Label>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {macroProcess.documents.map(
                                                (doc) => (
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
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Upload New Documents */}
                            <div className="space-y-2">
                                <Label>Upload New Documents</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add new documents related to this macro
                                    process
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
                            <Link href={`/macro-processes/${macroProcess.id}`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Updating...'
                                : 'Update Macro Process'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
