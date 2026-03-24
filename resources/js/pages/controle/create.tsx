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
            return {
                label: 'Effective',
                class: 'bg-green-600 text-white'
            }

        case 'partially-efficient':
            return {
                label: 'Partially Effective',
                class: 'bg-yellow-500 text-white'
            }

        case 'inefficient':
            return {
                label: 'Ineffective',
                class: 'bg-red-600 text-white'
            }

        default:
            return {
                label: 'Please select Reality and Pertinence',
                class: 'bg-gray-200 text-black'
            }
    }
}
export default function CreateControl() {
    const { risks, owners, settings } = usePage<{
        risks: Risk[]
        owners: Owner[]
        settings: AppSetting[]
    }>().props

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        description: '',
        control_type: '',
        control_nature: '',
        frequency: '',
        owner_id: '',
        reality: '',
        pertinence: '',
        efficiency: '',
        is_active: true,
        risk_ids: [] as string[],
    })

    const currentMode = useMemo(() => {

        const modeSetting = settings?.find((s) => s.key === 'mode');

        return modeSetting?.value ?? null;

    }, [settings]);

    const isAuditMode = currentMode === 'audit';
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
        post('/controls')
    }



    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Controls', href: '/controls' },
                { title: 'Create', href: '/controls/create' },
            ]}
        >
            <Head title="Create Control" />

            <div className="space-y-6 p-4">

                {/* HEADER */}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Control</h1>
                        <p className="text-muted-foreground">
                            Define a new control and link it to risks
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
                                    placeholder="Control Name"
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
                                    placeholder="CTRL-001"
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
                                    placeholder="Provide a detailed description of the control objective and scope..."
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
                            {/* Active Switch */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5"> <Label htmlFor="is_active">
                                    Active Status </Label> <p className="text-sm text-muted-foreground">
                                        Enable or disable this control </p> </div> <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />

                            </div>


                            {/* TYPE / NATURE / FREQUENCY */}

                            <div className="grid grid-cols-3 gap-4">

                                <div className="space-y-2">
                                    <Label>Control Type  <span className="text-destructive">*</span></Label>

                                    <Select
                                        value={data.control_type}
                                        onValueChange={(v) =>
                                            setData('control_type', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Preventive">
                                                Preventive
                                            </SelectItem>
                                            <SelectItem value="Detective">
                                                Detective
                                            </SelectItem>
                                            <SelectItem value="Corrective">
                                                Corrective
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {errors.control_type && (
                                        <p className="text-sm text-destructive">
                                            {errors.control_type}

                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Execution Nature  <span className="text-destructive">*</span></Label>

                                    <Select
                                        value={data.control_nature}
                                        onValueChange={(v) =>
                                            setData('control_nature', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Nature" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Automated">
                                                Automated
                                            </SelectItem>
                                            <SelectItem value="Manual">
                                                Manual
                                            </SelectItem>
                                            <SelectItem value="Semi-automated">
                                                Semi-automated
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.control_nature && (
                                        <p className="text-sm text-destructive">
                                            {errors.control_nature}

                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Frequency  <span className="text-destructive">*</span></Label>

                                    <Select
                                        value={data.frequency}
                                        onValueChange={(v) =>
                                            setData('frequency', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Frequency" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Daily">Daily</SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                            <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                                            <SelectItem value="Annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.frequency && (
                                        <p className="text-sm text-destructive">
                                            {errors.frequency}

                                        </p>
                                    )}
                                </div>

                            </div>

                            {/* REALITY */}
                            {!isAuditMode && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Reality  <span className="text-destructive">*</span></Label>

                                        <Select
                                            value={data.reality}
                                            onValueChange={(v) => setData('reality', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select reality" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="Effective">
                                                    Effective
                                                </SelectItem>

                                                <SelectItem value="Partially Effective">
                                                    Partially Effective
                                                </SelectItem>

                                                <SelectItem value="Ineffective">
                                                    Ineffective
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.reality && (
                                            <p className="text-sm text-destructive">
                                                {errors.reality}

                                            </p>
                                        )}
                                    </div>

                                    {/* PERTINENCE */}

                                    <div className="space-y-2">
                                        <Label>Pertinence  <span className="text-destructive">*</span></Label>

                                        <Select
                                            value={data.pertinence}
                                            onValueChange={(v) => setData('pertinence', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select pertinence" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="Effective">
                                                    Effective
                                                </SelectItem>

                                                <SelectItem value="Partially Effective">
                                                    Partially Effective
                                                </SelectItem>

                                                <SelectItem value="Ineffective">
                                                    Ineffective
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.pertinence && (
                                            <p className="text-sm text-destructive">
                                                {errors.pertinence}

                                            </p>
                                        )}
                                    </div>

                                    {/* EFFICIENCY */}

                                    <div className="space-y-2">

                                        <Label>Efficiency  <span className="text-destructive">*</span></Label>

                                        <div
                                            className={`rounded-md px-4 py-2 text-center font-semibold ${getEfficiencyStyle(data.efficiency).class
                                                }`}
                                        >
                                            {getEfficiencyStyle(data.efficiency).label}
                                        </div>

                                    </div>

                                </>
                            )}

                            {/* RISKS */}

                            <div className="space-y-2">

                                <Label>Related Risks  <span className="text-destructive">*</span></Label>

                                <MultiSelect
                                    options={risks.map((risk) => ({
                                        value: risk.id.toString(),
                                        label: `${risk.code ?? ''} ${risk.name}`,
                                    }))}
                                    defaultValue={data.risk_ids}
                                    onValueChange={(selected) =>
                                        setData('risk_ids', selected)
                                    }
                                    placeholder="Select risks"
                                    searchable
                                />
                            </div>
                            {errors.risk_ids && (
                                <p className="text-sm text-destructive">
                                    The risks field is required.

                                </p>
                            )}



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
                            Create Control
                        </Button>

                    </div>

                </form>
            </div >
        </AppLayout >
    )
}
