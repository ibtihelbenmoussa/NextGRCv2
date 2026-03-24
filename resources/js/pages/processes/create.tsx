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
import { MacroProcess, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, FileText } from 'lucide-react';
import { useEffect } from 'react';

interface ProcessCreateProps {
    macroProcesses: MacroProcess[];
    managers: User[];
    selectedMacroProcessId?: number;
}

export default function ProcessCreate({
    macroProcesses,
    managers,
    selectedMacroProcessId,
}: ProcessCreateProps) {
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
    }>({
        macro_process_id: selectedMacroProcessId?.toString() || '',
        name: '',
        code: '',
        description: '',
        objectives: '',
        manager_ids: [],
        is_active: true,
    });

    // Update macro_process_id if selectedMacroProcessId prop changes
    useEffect(() => {
        if (selectedMacroProcessId && !data.macro_process_id) {
            setData('macro_process_id', selectedMacroProcessId.toString());
        }
    }, [selectedMacroProcessId, data.macro_process_id, setData]);

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
        post('/processes', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Processes', href: '/processes' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Process" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Process
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new process to a macro process
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/processes">
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

                    {/* Documents */}
                    <Card className="my-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardUpload
                                onFilesChange={handleFilesChange}
                                maxFiles={10}
                                maxSize={10 * 1024 * 1024}
                            />
                            {errors.documents && (
                                <p className="mt-2 text-sm text-destructive">
                                    {errors.documents}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/processes">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Process'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
