import AppLayout from '@/layouts/app-layout'
import { Head, Link, useForm, router } from '@inertiajs/react'
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

interface Planning {
    id: number
    name: string
    code?: string
    description?: string
    year: number
    start_date: string
    end_date: string
    is_active: boolean
}

interface Props {
    planning: Planning
}

export default function EditPlanning({ planning }: Props) {

    const currentYear = new Date().getFullYear()
    const startYear = 2000
    const endYear = currentYear + 5

    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    ).reverse()

    /* ================= FORM ================= */

    const { data, setData, put, processing, errors } = useForm({
        name: planning.name || '',
        code: planning.code || '',
        description: planning.description || '',
        year: planning.year.toString(),
        start_date: planning.start_date,
        end_date: planning.end_date,
        is_active: planning.is_active,
    })

    /* ================= UPDATE DATES IF YEAR CHANGES ================= */

    useEffect(() => {
        const selectedYear = Number(data.year)

        const startOfYear = `${selectedYear}-01-01`
        const endOfYear = `${selectedYear}-12-31`

        // If current dates are outside new year → reset
        if (data.start_date < startOfYear || data.start_date > endOfYear) {
            setData('start_date', startOfYear)
        }

        if (data.end_date < startOfYear || data.end_date > endOfYear) {
            setData('end_date', endOfYear)
        }

    }, [data.year])

    /* ================= SUBMIT ================= */

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        put(`/planning/${planning.id}`)
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
                { title: planning.name, href: `/planning/${planning.id}` },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Planning" />

            <div className="space-y-6 p-4">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Planning</h1>
                        <p className="text-muted-foreground">
                            Update yearly organizational planning
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
                            Update Planning
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    )
}