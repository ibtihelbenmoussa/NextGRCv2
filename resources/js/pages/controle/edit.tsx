import AppLayout from '@/layouts/app-layout'
import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Shield } from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'
import React from 'react'
import { useMemo } from 'react'
import { AppSetting } from '@/types';
type Risk = {
    id: number
    name: string
    code?: string
}

type Owner = {
    id: number
    name: string
}

type Control = {
    id: number
    code: string
    name: string
    description?: string
    control_type: string
    control_nature: string
    frequency: string
    owner_id: number
    is_active: boolean
    realite: string
    pertinance: string
    efficiency: string
}

const efficiencyScale = [
    { reality: 'Effective', pertinence: 'Effective', efficiency: 'efficient' },
    { reality: 'Effective', pertinence: 'Partially Effective', efficiency: 'partially-efficient' },
    { reality: 'Effective', pertinence: 'Ineffective', efficiency: 'inefficient' },

    { reality: 'Partially Effective', pertinence: 'Effective', efficiency: 'partially-efficient' },
    { reality: 'Partially Effective', pertinence: 'Partially Effective', efficiency: 'partially-efficient' },
    { reality: 'Partially Effective', pertinence: 'Ineffective', efficiency: 'inefficient' },

    { reality: 'Ineffective', pertinence: 'Effective', efficiency: 'inefficient' },
    { reality: 'Ineffective', pertinence: 'Partially Effective', efficiency: 'inefficient' },
    { reality: 'Ineffective', pertinence: 'Ineffective', efficiency: 'inefficient' },
]

const getEfficiencyStyle = (efficiency: string) => {

    switch (efficiency) {

        case 'efficient':
            return { label: 'Effective', class: 'bg-green-600 text-white' }

        case 'partially-efficient':
            return { label: 'Partially Effective', class: 'bg-yellow-500 text-white' }

        case 'inefficient':
            return { label: 'Ineffective', class: 'bg-red-600 text-white' }

        default:
            return {
                label: 'Please select Reality and Pertinence',
                class: 'bg-gray-200 text-black'
            }
    }
}

export default function EditControl() {

    const { control, risks, owners, selectedRisks, settings } = usePage<{
        control: Control
        risks: Risk[]
        owners: Owner[]
        settings: AppSetting[]
        selectedRisks: number[]
    }>().props

    const { data, setData, put, processing, errors } = useForm({

        code: control.code || '',
        name: control.name || '',
        description: control.description || '',
        control_type: control.control_type || '',
        control_nature: control.control_nature || '',
        frequency: control.frequency || '',
        owner_id: control.owner_id?.toString() || '',
        is_active: control.is_active ?? true,

        reality: control.realite || '',
        pertinence: control.pertinance || '',
        efficiency: control.efficiency || '',

        risk_ids: selectedRisks.map(String),

    })

    /* auto calculate efficiency */

    React.useEffect(() => {

        if (!data.reality || !data.pertinence) {
            setData('efficiency', '')
            return
        }

        const found = efficiencyScale.find(
            (e) =>
                e.reality === data.reality &&
                e.pertinence === data.pertinence
        )

        if (found) {
            setData('efficiency', found.efficiency)
        }

    }, [data.reality, data.pertinence])

    const submit = (e: React.FormEvent) => {

        e.preventDefault()
        put(`/controls/${control.id}`)
    }

    const currentMode = useMemo(() => {

        const modeSetting = settings?.find((s) => s.key === 'mode');

        return modeSetting?.value ?? null;

    }, [settings]);

    const isAuditMode = currentMode === 'audit';
    function SelectField({ label, value, onChange, options }: any) {

        return (

            <div className="space-y-2">

                <Label>
                    {label} <span className="text-destructive">*</span>
                </Label>

                <Select value={value} onValueChange={onChange}>

                    <SelectTrigger>
                        <SelectValue placeholder={`Select ${label}`} />
                    </SelectTrigger>

                    <SelectContent>

                        {options.map((o: string) => (

                            <SelectItem key={o} value={o}>
                                {o}
                            </SelectItem>

                        ))}

                    </SelectContent>

                </Select>

            </div>

        )
    }
    return (

        <AppLayout
            breadcrumbs={[
                { title: 'Controls', href: '/controls' },
                { title: 'Edit', href: `/controls/${control.id}/edit` },
            ]}
        >

            <Head title="Edit Control" />

            <div className="space-y-6 p-4">

                {/* HEADER */}

                <div className="flex items-center justify-between">

                    <div>
                        <h1 className="text-3xl font-bold">Edit Control</h1>
                        <p className="text-muted-foreground">
                            Update control information and linked risks
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/controls">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>

                </div>

                <form onSubmit={submit} className="space-y-6">

                    <Card>

                        <CardHeader className="flex flex-row items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <CardTitle>Control Details</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">

                            {/* NAME */}

                            <div className="space-y-2">
                                <Label>Control Name  <span className="text-destructive">*</span></Label>

                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />

                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* CODE */}

                            <div className="space-y-2">

                                <Label>Control Code  <span className="text-destructive">*</span></Label>

                                <Input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value.toUpperCase())
                                    }
                                />

                                {errors.code && (
                                    <p className="text-sm text-destructive">{errors.code}</p>
                                )}
                            </div>

                            {/* DESCRIPTION */}

                            <div className="space-y-2">
                                <Label>Description</Label>

                                <Textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                            </div>

                            {/* OWNER */}

                            <div className="space-y-2">

                                <Label>Control Owner  <span className="text-destructive">*</span></Label>

                                <Select
                                    value={data.owner_id}
                                    onValueChange={(v) => setData('owner_id', v)}
                                >

                                    <SelectTrigger>
                                        <SelectValue placeholder="Select owner" />
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

                            {/* ACTIVE SWITCH */}

                            <div className="flex items-center justify-between rounded-lg border p-4">

                                <div>
                                    <Label>Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable this control
                                    </p>
                                </div>

                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />

                            </div>

                            {/* TYPE / NATURE / FREQUENCY */}

                            <div className="grid grid-cols-3 gap-4">

                                <SelectField
                                    label="Control Type"
                                    required
                                    value={data.control_type}
                                    onChange={(v: string) => setData('control_type', v)}
                                    options={['Preventive', 'Detective', 'Corrective']}
                                />
                                {errors.control_type && (
                                    <p className="text-sm text-destructive">
                                        {errors.control_type}

                                    </p>
                                )}

                                <SelectField
                                    label="Execution Nature"
                                    required
                                    value={data.control_nature}
                                    onChange={(v: string) => setData('control_nature', v)}
                                    options={['Automated', 'Manual', 'Semi-automated']}
                                />{errors.control_nature && (
                                    <p className="text-sm text-destructive">
                                        {errors.control_nature}

                                    </p>
                                )}

                                <SelectField
                                    label="Frequency"
                                    required
                                    value={data.frequency}
                                    onChange={(v: string) => setData('frequency', v)}
                                    options={['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Weekly', 'Daily']}
                                />
                                {errors.frequency && (
                                    <p className="text-sm text-destructive">
                                        {errors.frequency}

                                    </p>
                                )}
                            </div>

                            {/* REALITY */}
                            {!isAuditMode && (
                                <>
                                    <SelectField
                                        label="Reality"
                                        required
                                        value={data.reality}
                                        onChange={(v: string) => setData('reality', v)}
                                        options={[
                                            'Effective',
                                            'Partially Effective',
                                            'Ineffective'
                                        ]}
                                    />
                                    {errors.reality && (
                                        <p className="text-sm text-destructive">
                                            {errors.reality}

                                        </p>
                                    )}

                                    {/* PERTINENCE */}

                                    <SelectField
                                        label="Pertinence"
                                        required
                                        value={data.pertinence}
                                        onChange={(v: string) => setData('pertinence', v)}
                                        options={[
                                            'Effective',
                                            'Partially Effective',
                                            'Ineffective'
                                        ]}
                                    />
                                    {errors.pertinence && (
                                        <p className="text-sm text-destructive">
                                            {errors.pertinence}

                                        </p>
                                    )}

                                    {/* EFFICIENCY */}

                                    <div className="space-y-2">

                                        <Label>Efficiency</Label>

                                        <div
                                            className={`rounded-md px-4 py-2 text-center font-semibold ${getEfficiencyStyle(data.efficiency).class}`}
                                        >
                                            {getEfficiencyStyle(data.efficiency).label}
                                        </div>

                                    </div>
                                </>
                            )}
                            {/* RISKS */}

                            <div className="space-y-2">

                                <Label>Related Risks <span className="text-destructive">*</span></Label>

                                <MultiSelect
                                    options={risks.map((risk) => ({
                                        value: risk.id.toString(),
                                        label: `${risk.code ?? ''} ${risk.name}`,
                                    }))}
                                    defaultValue={data.risk_ids}
                                    onValueChange={(selected) =>
                                        setData('risk_ids', selected)
                                    }
                                    searchable
                                />
                                {errors.risk_ids && (
                                    <p className="text-sm text-destructive">
                                        The risks field is required.

                                    </p>
                                )}

                            </div>

                        </CardContent>

                    </Card>

                    {/* BUTTONS */}

                    <div className="flex justify-end gap-3">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/controls')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            Update Control
                        </Button>

                    </div>

                </form>

            </div>

        </AppLayout>
    )
}

function SelectField({ label, value, onChange, options }: any) {

    return (

        <div className="space-y-2">

            <Label>{label} *</Label>

            <Select value={value} onValueChange={onChange}>

                <SelectTrigger>
                    <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>

                <SelectContent>

                    {options.map((o: string) => (

                        <SelectItem key={o} value={o}>
                            {o}
                        </SelectItem>

                    ))}

                </SelectContent>

            </Select>

        </div>

    )
}
