import { CardUpload, type FileUploadItem } from '@/components/card-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Process, User, Category, AppSetting } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft, FileText, Shield } from 'lucide-react';
import React from 'react'
import { Fragment } from 'react'
import { useMemo } from 'react'

import { TrendingDown, Minus, TrendingUp } from "lucide-react"
interface RiskCreateProps {
    owners: User[];
    processes: Process[];
    category: Category[];
    settings: AppSetting[];
}
const statusOptions = [
    {
        value: "low",
        label: "Low",
        icon: <TrendingDown className="w-4 h-4" />,
        color: "green",
    },
    {
        value: "medium",
        label: "Medium",
        icon: <Minus className="w-4 h-4" />,
        color: "yellow",
    },
    {
        value: "high",
        label: "High",
        icon: <TrendingUp className="w-4 h-4" />,
        color: "red",
    },
]
function getCategoryPath(
    categories: Category[],
    id?: string,
) {
    if (!id) return ''

    const map = new Map(categories.map(c => [c.id, c]))
    let current = map.get(Number(id))
    const path: string[] = []

    while (current) {
        path.unshift(current.name)
        current = current.parent_id
            ? map.get(current.parent_id)
            : undefined
    }

    return path.join(' ↳ ')
}
function renderTree(categories: Category[], parentId: number | null = null, level = 0) {
    return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => (
            <React.Fragment key={cat.id}>
                <SelectItem value={cat.id.toString()}>
                    <span style={{ paddingLeft: level * 16 }}>
                        {level > 0 ? '↳ ' : ''}{cat.name}
                    </span>
                </SelectItem>
                {renderTree(categories, cat.id, level + 1)}
            </React.Fragment>
        ))
}
// Removed unused likelihoodLevels and impactLevels

export default function RiskCreate({ owners, processes, category, settings }: RiskCreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        risk_category_id: string;
        inherent_likelihood?: number;
        inherent_impact?: number;
        residual_likelihood?: number;
        residual_impact?: number;
        owner_id?: string;
        kri_owner_id?: string;
        kri_name: string;
        status: string;
        kri_threshold: undefined;
        kri_description: string;
        process_ids: string[];
        is_active: boolean;
        documents?: File[];
        document_categories?: (string | null)[];
        document_descriptions?: (string | null)[];
    }>({
        name: '',
        code: '',
        description: '',
        risk_category_id: '',
        process_ids: [],
        is_active: true,
        kri_owner_id: '',
        kri_name: '',
        status: '',
        kri_threshold: undefined,
        kri_description: '',
    });

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
        post('/risks', {
            forceFormData: true,

        });
    };
    const currentMode = useMemo(() => {

        const modeSetting = settings?.find((s) => s.key === 'mode');

        return modeSetting?.value ?? null;

    }, [settings]);

    const isAuditMode = currentMode === 'audit';




    React.useEffect(() => {
        if (!isAuditMode) {
            setData('residual_likelihood', undefined);
            setData('residual_impact', undefined);
        }
    }, [isAuditMode]);
    const inherentScore =
        typeof data.inherent_likelihood === 'number' &&
            typeof data.inherent_impact === 'number'
            ? data.inherent_likelihood * data.inherent_impact
            : undefined;

    const residualScore =
        typeof data.residual_likelihood === 'number' &&
            typeof data.residual_impact === 'number'
            ? data.residual_likelihood * data.residual_impact
            : undefined;

    const [showKRI, setShowKRI] = React.useState(false);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Risk" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Risk
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new risk to your organization's risk registry
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/risks">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Risk Details
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
                                    placeholder="Data breach risk"
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
                                    placeholder="RISK-001"
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
                                    placeholder="Brief description of the risk"
                                    rows={3}
                                />

                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category   <span className="text-destructive">*</span></Label>

                                <Select
                                    value={data.risk_category_id || ''}
                                    onValueChange={(value) =>
                                        setData('risk_category_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" >
                                            {data.risk_category_id
                                                ? getCategoryPath(category, data.risk_category_id)
                                                : null}
                                        </SelectValue>
                                    </SelectTrigger>

                                    <SelectContent>
                                        {renderTree(category)}
                                    </SelectContent>
                                </Select>

                                {errors.risk_category_id && (
                                    <p className="text-sm text-destructive">
                                        The category field is required.

                                    </p>
                                )}
                            </div>

                            {/* Owner */}
                            <div className="space-y-2">
                                <Label htmlFor="owner_id">Risk Owner   <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.owner_id}
                                    onValueChange={(value) =>
                                        setData('owner_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a risk owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {owners.map((owner) => (
                                            <SelectItem
                                                key={owner.id}
                                                value={owner.id.toString()}
                                            >
                                                {owner.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.owner_id && (
                                    <p className="text-sm text-destructive">
                                        The owner field is required.

                                    </p>
                                )}
                            </div>

                            {/* Related Processes */}
                            <div className="space-y-2">
                                <Label htmlFor="process_ids">
                                    Related Processes  <span className="text-destructive">*</span>
                                </Label>
                                <MultiSelect
                                    options={processes.map((process) => ({
                                        value: process.id.toString(),
                                        label: `${process.code} - ${process.name}`,
                                    }))}
                                    defaultValue={data.process_ids}
                                    onValueChange={(selected) =>
                                        setData('process_ids', selected)
                                    }
                                    placeholder="Select related processes"
                                />
                                {errors.process_ids && (
                                    <p className="text-sm text-destructive">
                                        The process field is required.

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
                                        Set whether this risk is currently
                                        active
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

                    {/* Risk Assessment */}
                    <Card className="my-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Risk Assessment{/*  (Optional) */}   <span className="text-destructive">*</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Inherent Risk */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">
                                        Inherent Risk Assessment
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Risk level before considering controls
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="inherent_likelihood">
                                            Likelihood
                                        </Label>
                                        <Slider
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[
                                                data.inherent_likelihood ?? 1,
                                            ]}
                                            onValueChange={([val]) =>
                                                setData(
                                                    'inherent_likelihood',
                                                    val,
                                                )
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                            <span>Very Low</span>
                                            <span>Low</span>
                                            <span>Medium</span>
                                            <span>High</span>
                                            <span>Very High</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="inherent_impact">
                                            Impact
                                        </Label>
                                        <Slider
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[data.inherent_impact ?? 1]}
                                            onValueChange={([val]) =>
                                                setData('inherent_impact', val)
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                            <span>Very Low</span>
                                            <span>Low</span>
                                            <span>Medium</span>
                                            <span>High</span>
                                            <span>Very High</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Risk Score</Label>
                                        <div
                                            className={`rounded-md border px-3 py-2 text-center font-medium ${inherentScore
                                                ? inherentScore >= 15
                                                    ? 'border-red-200 bg-red-50 text-red-700'
                                                    : inherentScore >= 9
                                                        ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                                        : 'border-green-200 bg-green-50 text-green-700'
                                                : 'bg-gray-50 text-gray-500'
                                                }`}
                                        >
                                            {inherentScore || '-'}
                                        </div>
                                    </div>

                                    {errors.inherent_likelihood && (
                                        <p className="text-sm text-destructive">
                                            {errors.inherent_likelihood}
                                        </p>
                                    )}

                                    {errors.inherent_impact && (
                                        <p className="text-sm text-destructive">
                                            {errors.inherent_impact}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Residual Risk */}
                            {isAuditMode && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">
                                            Residual Risk Assessment
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Risk level after considering controls
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="residual_likelihood">
                                                Likelihood
                                            </Label>
                                            <Slider
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={[
                                                    data.residual_likelihood ?? 1,
                                                ]}
                                                onValueChange={([val]) =>
                                                    setData(
                                                        'residual_likelihood',
                                                        val,
                                                    )
                                                }
                                                className="w-full"
                                            />
                                            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                                <span>Very Low</span>
                                                <span>Low</span>
                                                <span>Medium</span>
                                                <span>High</span>
                                                <span>Very High</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="residual_impact">
                                                Impact
                                            </Label>
                                            <Slider
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={[data.residual_impact ?? 1]}
                                                onValueChange={([val]) =>
                                                    setData('residual_impact', val)
                                                }
                                                className="w-full"
                                            />
                                            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                                <span>Very Low</span>
                                                <span>Low</span>
                                                <span>Medium</span>
                                                <span>High</span>
                                                <span>Very High</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Risk Score</Label>
                                            <div
                                                className={`rounded-md border px-3 py-2 text-center font-medium ${residualScore
                                                    ? residualScore >= 15
                                                        ? 'border-red-200 bg-red-50 text-red-700'
                                                        : residualScore >= 9
                                                            ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                                            : 'border-green-200 bg-green-50 text-green-700'
                                                    : 'bg-gray-50 text-gray-500'
                                                    }`}
                                            >
                                                {residualScore || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="my-6">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Key Risk Indicators (Optional)
                            </CardTitle>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowKRI(!showKRI)}
                            >
                                {showKRI ? " - Hide KRI" : " + Add KRI"}
                            </Button>
                        </CardHeader>

                        {showKRI && (
                            <CardContent className="space-y-4">

                                <div className="space-y-2">
                                    <Label>KRI Name</Label>
                                    <Input
                                        value={data.kri_name}
                                        onChange={(e) =>
                                            setData('kri_name', e.target.value)
                                        }
                                        placeholder="Example: Number of security incidents"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label>Threshold</Label>
                                    <Input
                                        type="number"
                                        value={data.kri_threshold ?? ''}
                                        onChange={(e) =>
                                            setData('kri_threshold', Number(e.target.value))
                                        }
                                        placeholder="Example: 10"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={data.kri_description}
                                        onChange={(e) =>
                                            setData('kri_description', e.target.value)
                                        }
                                        placeholder="Explain how this indicator measures the risk"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>

                                    <div className="flex gap-2 flex-wrap">
                                        {statusOptions.map((item) => {
                                            const isActive = data.status === item.value

                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => setData("status", item.value)}
                                                    className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
                                    transition-all duration-200

                                    ${isActive
                                                            ? item.color === "green"
                                                                ? "bg-green-500 text-white border-green-500 shadow"
                                                                : item.color === "yellow"
                                                                    ? "bg-yellow-500 text-white border-yellow-500 shadow"
                                                                    : "bg-red-500 text-white border-red-500 shadow"
                                                            : `
                                            bg-background text-foreground border-border
                                            hover:bg-muted dark:hover:bg-muted/50
                                          `
                                                        }

                                    focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${item.color === "green"
                                                            ? "focus:ring-green-400"
                                                            : item.color === "yellow"
                                                                ? "focus:ring-yellow-400"
                                                                : "focus:ring-red-400"
                                                        }
                                `}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {errors.status && (
                                        <p className="text-sm text-destructive">{errors.status}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kri_owner_id">KRI Owner</Label>
                                    <Select
                                        value={data.kri_owner_id}
                                        onValueChange={(value) =>
                                            setData('kri_owner_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a kri owner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {owners.map((owner) => (
                                                <SelectItem
                                                    key={owner.id}
                                                    value={owner.id.toString()}
                                                >
                                                    {owner.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.kri_owner_id && (
                                        <p className="text-sm text-destructive">
                                            {errors.kri_owner_id}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        )}
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
                                    risk
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
                            <Link href="/risks">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Risk'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
