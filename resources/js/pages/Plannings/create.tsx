import AppLayout from '@/layouts/app-layout'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarDays, ChevronLeft, ChevronDown } from 'lucide-react'
import React, { useEffect } from 'react'

export default function CreatePlanning() {

    const currentYear = new Date().getFullYear()

    const startYear = 2000
    const endYear = currentYear + 5
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    ).reverse()

    /* ================= FORM ================= */

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        year: currentYear.toString(),
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`,
        is_active: true,
    })

    /* ================= UPDATE DATES WHEN YEAR CHANGES ================= */

    useEffect(() => {
        const selectedYear = Number(data.year)

        setData('start_date', `${selectedYear}-01-01`)
        setData('end_date', `${selectedYear}-12-31`)
    }, [data.year])

    /* ================= SUBMIT ================= */

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/planning')
    }

    /* ================= DATE LIMITS ================= */

    const getYearStart = () =>
        new Date(Number(data.year), 0, 1)

    const getYearEnd = () =>
        new Date(Number(data.year), 11, 31)

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Plannings', href: '/plannings' },
                { title: 'Create', href: '/planning/create' },
            ]}
        >
            <Head title="Create Planning" />

            <div className="space-y-6 p-4">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Planning</h1>
                        <p className="text-muted-foreground">
                            Define a yearly organizational planning
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/plannings">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
                            <CalendarDays className="h-5 w-5" />
                            <CardTitle>Planning Details</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* NAME */}
                            <div className="space-y-2">
                                <Label>Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="Annual Audit Plan XXXX"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}

                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* CODE */}
                            <div className="space-y-2">
                                <Label>Code <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="PLAN-XXXX"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value.toUpperCase())
                                    }
                                />
                            </div>

                            {/* YEAR */}
                            <div className="space-y-2">
                                <Label>Year <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.year}
                                    onValueChange={(value) => setData('year', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* DATES */}
                            <div className="grid md:grid-cols-2 gap-4">

                                {/* START DATE */}
                                <div className="space-y-2">
                                    <Label>Start Date <span className="text-destructive">*</span></Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                {format(new Date(data.start_date), "PPP")}
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={new Date(data.start_date)}
                                                month={new Date(data.start_date)}
                                                disabled={(date) =>
                                                    date < getYearStart() ||
                                                    date > getYearEnd()
                                                }
                                                onSelect={(date) => {
                                                    if (!date) return

                                                    const formatted = format(date, "yyyy-MM-dd")
                                                    setData("start_date", formatted)

                                                    if (new Date(data.end_date) < date) {
                                                        setData("end_date", formatted)
                                                    }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* END DATE */}
                                <div className="space-y-2">
                                    <Label>End Date <span className="text-destructive">*</span></Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                {format(new Date(data.end_date), "PPP")}
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={new Date(data.end_date)}
                                                month={new Date(data.end_date)}
                                                disabled={(date) =>
                                                    date < getYearStart() ||
                                                    date > getYearEnd() ||
                                                    date < new Date(data.start_date)
                                                }
                                                onSelect={(date) => {
                                                    if (!date) return
                                                    setData("end_date", format(date, "yyyy-MM-dd"))
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                            </div>

                            {/* ACTIVE SWITCH */}
                            <div className="flex items-center justify-between border rounded-lg p-4">
                                <div>
                                    <Label>Active Planning</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable this planning
                                    </p>
                                </div>

                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/plannings')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            Create Planning
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    )
}