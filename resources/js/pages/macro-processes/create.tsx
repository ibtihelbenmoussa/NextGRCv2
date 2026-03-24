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
import { BusinessUnit, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, FileText, Folder } from 'lucide-react';
import { useEffect } from 'react';

interface MacroProcessCreateProps {
    businessUnits: BusinessUnit[];
    managers: User[];
    selectedBusinessUnitId?: number;
}

export default function MacroProcessCreate({
    businessUnits,
    managers,
    selectedBusinessUnitId,
}: MacroProcessCreateProps) {
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
    }>({
        business_unit_id: selectedBusinessUnitId?.toString() || '',
        name: '',
        code: '',
        description: '',
        manager_ids: [],
        is_active: true,
    });

    // Update business_unit_id if selectedBusinessUnitId prop changes
    useEffect(() => {
        if (selectedBusinessUnitId && !data.business_unit_id) {
            setData('business_unit_id', selectedBusinessUnitId.toString());
        }
    }, [selectedBusinessUnitId, data.business_unit_id, setData]);

    const handleFilesChange = (files: FileUploadItem[]) => {
        setData({
            ...data,
            documents: files.map((f) => f.file),
            document_categories: files.map(() => null),
            document_descriptions: files.map(() => null),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/macro-processes', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Macro Processes', href: '/macro-processes' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Macro Process" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Macro Process
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new macro process to a business unit
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/macro-processes">
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
                                Documents (Optional)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Upload Documents</Label>
                                <p className="text-sm text-muted-foreground">
                                    Attach relevant documents related to this
                                    macro process
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
                            <Link href="/macro-processes">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Creating...'
                                : 'Create Macro Process'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
