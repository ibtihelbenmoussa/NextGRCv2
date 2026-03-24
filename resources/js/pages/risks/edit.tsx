import { CardUpload, type FileUploadItem } from '@/components/card-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import AppLayout from '@/layouts/app-layout'
import { Process, User, AppSetting } from '@/types'
import { Head, Link, useForm } from '@inertiajs/react'
import {
    AlertTriangle,
    ChevronLeft,
    FileText,
    Shield,
    TrendingDown,
    TrendingUp,
    Minus,
    Plus, RotateCcw
} from 'lucide-react'
import { router } from '@inertiajs/react'
import React, { useMemo } from 'react'

interface RiskCategory {
    id: number
    name: string
    parent_id: number | null
}

interface RiskEditProps {
    risk: {
        id: number
        name: string
        code: string
        description?: string | null
        category?: number | null
        inherent_likelihood: number
        inherent_impact: number
        residual_likelihood: number
        residual_impact: number
        owner_id?: number | null
        is_active: boolean
        processes: { id: number }[]
        kri?: {
            id: number
            name: string
            owner_id?: number | null
            description?: string | null
            threshold?: number | null
            status?: string | null
        } | null
    }
    owners: User[]
    processes: Process[]
    categories: RiskCategory[]
    settings: AppSetting[]
}

const statusOptions = [
    {
        value: 'low',
        label: 'Low',
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'green',
    },
    {
        value: 'medium',
        label: 'Medium',
        icon: <Minus className="w-4 h-4" />,
        color: 'yellow',
    },
    {
        value: 'high',
        label: 'High',
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'red',
    },
]

function getCategoryPath(categories: RiskCategory[], selectedId?: string) {
    if (!selectedId) return ''
    const map = new Map(categories.map((c) => [c.id, c]))
    let current = map.get(Number(selectedId))
    const path: string[] = []
    while (current) {
        path.unshift(current.name)
        current = current.parent_id ? map.get(current.parent_id) : undefined
    }
    return path.join(' ↳ ')
}

function renderTree(
    categories: RiskCategory[],
    parentId: number | null = null,
    level = 0,
) {
    return categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => (
            <React.Fragment key={c.id}>
                <SelectItem value={String(c.id)}>
                    <span
                        className="flex items-center"
                        style={{ paddingLeft: level * 16 }}
                    >
                        {level > 0 && (
                            <span className="mr-1 text-muted-foreground">↳</span>
                        )}
                        {c.name}
                    </span>
                </SelectItem>
                {renderTree(categories, c.id, level + 1)}
            </React.Fragment>
        ))
}

export default function Edit({
    risk,
    owners,
    processes,
    categories,
    settings,
}: RiskEditProps) {
    const { data, setData, processing, errors } = useForm({
        name: risk.name,
        code: risk.code,
        description: risk.description ?? '',
        category: risk.category ? String(risk.category) : '',
        inherent_likelihood: risk.inherent_likelihood ?? 1,
        inherent_impact: risk.inherent_impact ?? 1,
        residual_likelihood: risk.residual_likelihood ?? 1,
        residual_impact: risk.residual_impact ?? 1,
        owner_id: risk.owner_id ? String(risk.owner_id) : '',
        process_ids: risk.processes.map((p) => String(p.id)),
        is_active: Boolean(risk.is_active),
        kri_name: risk.kri?.name ?? '',
        kri_owner_id: risk.kri?.owner_id ? String(risk.kri.owner_id) : '',
        kri_description: risk.kri?.description ?? '',
        kri_threshold: risk.kri?.threshold ?? (undefined as number | undefined),
        status: risk.kri?.status ?? '',
        documents: [] as File[],
        document_categories: [] as (string | null)[],
        document_descriptions: [] as (string | null)[],
    })

    const resetKRI = () => {
        setData({
            ...data,
            kri_name: '',
            kri_owner_id: '',
            kri_description: '',
            kri_threshold: undefined,
            status: '',
        })
    }
    const [showKRI, setShowKRI] = React.useState(!!risk.kri)

    const currentMode = useMemo(() => {
        const modeSetting = settings?.find((s) => s.key === 'mode')
        return modeSetting?.value ?? null
    }, [settings])

    const isAuditMode = currentMode === 'audit'

    React.useEffect(() => {
        if (!isAuditMode) {
            setData('residual_likelihood', null as any)
            setData('residual_impact', null as any)
        }
    }, [isAuditMode])

    const handleFilesChange = (files: FileUploadItem[]) => {
        setData({
            ...data,
            documents: files.map((f) => f.file),
            document_categories: files.map(() => null),
            document_descriptions: files.map(() => null),
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('code', data.code)
        formData.append('description', data.description)
        formData.append('risk_category_id', data.category)
        formData.append('owner_id', data.owner_id ?? '')
        formData.append('inherent_likelihood', String(data.inherent_likelihood))
        formData.append('inherent_impact', String(data.inherent_impact))

        if (isAuditMode && data.residual_likelihood) {
            formData.append('residual_likelihood', String(data.residual_likelihood))
        }
        if (isAuditMode && data.residual_impact) {
            formData.append('residual_impact', String(data.residual_impact))
        }

        formData.append('is_active', data.is_active ? '1' : '0')

        data.process_ids.forEach((id) => {
            formData.append('process_ids[]', id)
        })

        if (showKRI) {
            formData.append('kri_name', data.kri_name)
            formData.append('kri_owner_id', data.kri_owner_id ?? '')
            formData.append('kri_description', data.kri_description)
            formData.append('kri_threshold', String(data.kri_threshold ?? ''))
            formData.append('status', data.status)
        }

        data.documents.forEach((file) => {
            formData.append('documents[]', file)
        })

        formData.append('_method', 'PUT')

        router.post(`/risks/${risk.id}`, formData, { preserveScroll: true })
    }

    const inherentScore = data.inherent_likelihood * data.inherent_impact
    const residualScore = data.residual_likelihood * data.residual_impact

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title="Edit Risk" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Risk
                        </h1>
                        <p className="text-muted-foreground">
                            Update an existing risk
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/risks">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ========================
                        Risk Details
                    ======================== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Risk Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Category{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(v) =>
                                        setData('category', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue>
                                            {data.category
                                                ? getCategoryPath(
                                                    categories,
                                                    data.category,
                                                )
                                                : 'Select category'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderTree(categories)}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-sm text-destructive">
                                        The category field is required.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Risk Owner{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.owner_id}
                                    onValueChange={(v) =>
                                        setData('owner_id', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {owners.map((o) => (
                                            <SelectItem
                                                key={o.id}
                                                value={String(o.id)}
                                            >
                                                {o.name}
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

                            <div className="space-y-2">
                                <Label>
                                    Related Processes{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <MultiSelect
                                    options={processes.map((p) => ({
                                        value: String(p.id),
                                        label: `${p.code} - ${p.name}`,
                                    }))}
                                    defaultValue={data.process_ids}
                                    onValueChange={(selected) =>
                                        setData('process_ids', selected)
                                    }
                                />
                                {errors.process_ids && (
                                    <p className="text-sm text-destructive">
                                        The process field is required.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label>Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable this risk
                                    </p>
                                </div>
                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(v) =>
                                        setData('is_active', v)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ========================
                        Risk Assessment
                    ======================== */}
                    <Card className="my-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Risk Assessment{' '}
                                <span className="text-destructive">*</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Inherent */}
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
                                        <Label>Likelihood</Label>
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
                                        <Label>Impact</Label>
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

                            {/* Residual */}
                            {isAuditMode && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">
                                            Residual Risk Assessment
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Risk level after considering
                                            controls
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Likelihood</Label>
                                            <Slider
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={[
                                                    data.residual_likelihood ??
                                                    1,
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
                                            <Label>Impact</Label>
                                            <Slider
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={[
                                                    data.residual_impact ?? 1,
                                                ]}
                                                onValueChange={([val]) =>
                                                    setData(
                                                        'residual_impact',
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

                    {/* ========================
                        KRI — toujours visible
                    ======================== */}
                    <Card className="my-6">

                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Key Risk Indicators (Optional)
                            </CardTitle>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (showKRI) {
                                            resetKRI()
                                        }
                                        setShowKRI(!showKRI)
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    {showKRI ? (
                                        <>
                                            <Minus className="w-4 h-4" />
                                            Hide KRI
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Add KRI
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={resetKRI}
                                    className="flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </Button>
                            </div>
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
                                            setData(
                                                'kri_threshold',
                                                Number(e.target.value),
                                            )
                                        }
                                        placeholder="Example: 10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={data.kri_description}
                                        onChange={(e) =>
                                            setData(
                                                'kri_description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Explain how this indicator measures the risk"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {statusOptions.map((item) => {
                                            const isActive =
                                                data.status === item.value
                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            'status',
                                                            item.value,
                                                        )
                                                    }
                                                    className={`
                                                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
                                                        transition-all duration-200
                                                        ${isActive
                                                            ? item.color === 'green'
                                                                ? 'bg-green-500 text-white border-green-500 shadow'
                                                                : item.color === 'yellow'
                                                                    ? 'bg-yellow-500 text-white border-yellow-500 shadow'
                                                                    : 'bg-red-500 text-white border-red-500 shadow'
                                                            : 'bg-background text-foreground border-border hover:bg-muted dark:hover:bg-muted/50'
                                                        }
                                                        focus:outline-none focus:ring-2 focus:ring-offset-2
                                                        ${item.color === 'green'
                                                            ? 'focus:ring-green-400'
                                                            : item.color === 'yellow'
                                                                ? 'focus:ring-yellow-400'
                                                                : 'focus:ring-red-400'
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
                                        <p className="text-sm text-destructive">
                                            {errors.status}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>KRI Owner</Label>
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
                                                    value={String(owner.id)}
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

                    {/* ========================
                        Documents
                    ======================== */}
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
                                    multiple
                                    maxFiles={10}
                                    maxSize={10 * 1024 * 1024}
                                    simulateUpload
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

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/risks">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
