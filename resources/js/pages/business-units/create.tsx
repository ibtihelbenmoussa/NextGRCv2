import { CardUpload, type FileUploadItem } from '@/components/card-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, ChevronLeft, FileText } from 'lucide-react';

interface BusinessUnitCreateProps {
    managers: User[];
}

export default function BusinessUnitCreate({
    managers,
}: BusinessUnitCreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        manager_ids: string[];
        is_active: boolean;
        documents?: File[];
        document_categories?: (string | null)[];
        document_descriptions?: (string | null)[];
    }>({
        name: '',
        code: '',
        description: '',
        manager_ids: [],
        is_active: true,
    });

    const handleFilesChange = (files: FileUploadItem[]) => {
        // Store all files regardless of status
        // The actual files will be uploaded when form is submitted
        setData({
            ...data,
            documents: files.map((f) => f.file),
            document_categories: files.map(() => null),
            document_descriptions: files.map(() => null),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/business-units', {
            forceFormData: true, // Force multipart/form-data for file uploads
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Business Units', href: '/business-units' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Business Unit" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Business Unit
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new business unit to your organization
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/business-units">
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
                                <Building2 className="h-5 w-5" />
                                Business Unit Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    placeholder="Human Resources"
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
                                    placeholder="HR"
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
                                    placeholder="Brief description of the business unit"
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
                                        Set whether this business unit is
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
                                Documents (Optional)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Upload Documents</Label>
                                <p className="text-sm text-muted-foreground">
                                    Attach relevant documents related to this
                                    business unit
                                </p>
                                <CardUpload
                                    maxFiles={10}
                                    maxSize={10 * 1024 * 1024} // 10MB
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
                            <Link href="/business-units">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Creating...'
                                : 'Create Business Unit'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
