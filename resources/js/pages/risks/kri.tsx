import React, { useState } from "react"
import AppLayout from "@/layouts/app-layout"
import { Head, Link, router } from "@inertiajs/react"

import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    AlertTriangle,
    AlertCircle,
    ShieldCheck,
    ChevronLeft,
    Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Card,
    CardContent
} from "@/components/ui/card"

interface Kri {
    id: number
    owner_id: number
    name: string
    description: string
    threshold: number
    status: string
    owner?: Owner
}

interface Risk {
    id: number
    name: string
    code: string
}
interface Owner {
    id: number
    name: string
}
interface Measure {
    id?: number
    value: string
    date: string
    created_by?: string
}

interface Props {
    kris: Kri[]
    risk: Risk
    measures?: Measure[]
}

export default function KriPage({
    kris,
    risk,
    measures: initialMeasures = []
}: Props) {

    const [measure, setMeasure] = useState("")
    const [dateMeasure, setDateMeasure] = useState("")

    const selectedKri = kris[0]

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()

        if (!measure || !dateMeasure || !selectedKri) return

        const payload = {
            kri_id: selectedKri.id,
            value: measure,
            date: dateMeasure,
        }

        console.log("DATA SENT 👉", payload)

        router.post("/kri-measures", payload, {
            preserveScroll: true,

            onSuccess: () => {
                setMeasure("")
                setDateMeasure("")

                router.reload({ only: ["measures"] })
            },

            onError: (err) => {
                console.log("ERROR 👉", err)
            }
        })
    }



    const getStatusConfig = (status: string) => {
        switch (status) {
            case "high":
                return {
                    color: "bg-red-500",
                    icon: <AlertTriangle className="w-4 h-4" />,
                    label: "High"
                }
            case "medium":
                return {
                    color: "bg-yellow-500",
                    icon: <AlertCircle className="w-4 h-4" />,
                    label: "Medium"
                }
            default:
                return {
                    color: "bg-green-500",
                    icon: <ShieldCheck className="w-4 h-4" />,
                    label: "Low"
                }
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'KRI', href: '' },
            ]}
        >
            <Head title="KRI" />

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Risk - {risk.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Code: {risk.code}
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/risks">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* ================= KRI INFO ================= */}
                {selectedKri && (
                    <Card>
                        <CardContent className="p-6 space-y-6">

                            {/* INFO */}
                            {kris.length > 0 ? (
                                kris.map((kri) => {
                                    const status = getStatusConfig(kri.status)

                                    return (
                                        <div
                                            key={kri.id}
                                            className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full"
                                        >

                                            {/* KRI Name */}
                                            <div className="border rounded-xl p-5 bg-muted/30 text-center">
                                                <h3 className="font-semibold text-sm text-muted-foreground">
                                                    KRI Name
                                                </h3>
                                                <p className="mt-3 font-medium">
                                                    {kri.name}
                                                </p>
                                            </div>

                                            {/* Description */}
                                            <div className="border rounded-xl p-5 bg-muted/30 text-center">
                                                <h3 className="font-semibold text-sm text-muted-foreground">
                                                    Description
                                                </h3>
                                                <p className="mt-3 text-sm">
                                                    {kri.description}
                                                </p>
                                            </div>

                                            {/* Threshold */}
                                            <div className="border rounded-xl p-5 bg-muted/30 text-center">
                                                <h3 className="font-semibold text-sm text-muted-foreground">
                                                    Threshold
                                                </h3>
                                                <p className="mt-3 text-lg font-bold">
                                                    {kri.threshold}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <div className="border rounded-xl p-5 bg-muted/30 text-center flex flex-col items-center justify-center">
                                                <h3 className="font-semibold text-sm text-muted-foreground">
                                                    Status
                                                </h3>

                                                <div className={`mt-3 px-3 py-1 rounded-full text-white flex items-center gap-2 ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                            </div>

                                            {/* Owner */}
                                            <div className="border rounded-xl p-5 bg-muted/30 text-center">
                                                <h3 className="font-semibold text-sm text-muted-foreground">
                                                    Owner
                                                </h3>
                                                <p className="mt-3 text-sm font-medium">
                                                    {kri.owner?.name || "—"}
                                                </p>
                                            </div>

                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-muted-foreground">
                                    No KRI found for this risk.
                                </p>
                            )}

                            {/* ================= FORM ================= */}
                            <div className="grid md:grid-cols-2 gap-4">

                                <div>
                                    <Label>Value Measure  <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={measure}
                                        onChange={(e) => setMeasure(e.target.value)}
                                        placeholder="Enter value"
                                    />
                                </div>

                                <div>
                                    <Label>Date Measure   <span className="text-destructive">*</span></Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                {dateMeasure
                                                    ? format(new Date(dateMeasure), "PPP")
                                                    : "Select date"}

                                                <CalendarIcon className="h-4 w-4 opacity-70" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={dateMeasure ? new Date(dateMeasure) : undefined}
                                                onSelect={(date) => {
                                                    if (!date) return

                                                    const formatted = format(date, "yyyy-MM-dd")
                                                    setDateMeasure(formatted)
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3">
                                < Link href="/risks" >
                                    <Button
                                        variant="outline"
                                    /* onClick={() => {
                                        setMeasure("")
                                        setDateMeasure("")
                                         
                                    }} */
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button onClick={handleAdd}>
                                    Add
                                </Button>
                            </div>

                            {/* ================= TABLE ================= */}
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Created By</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {Array.isArray(initialMeasures) && initialMeasures.length > 0 ? (
                                            initialMeasures.map((m, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{m.value}</TableCell>
                                                    <TableCell>{m.date}</TableCell>
                                                    <TableCell>{m.created_by || "—"}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    Aucune donnée
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>

                                </Table>
                            </div>

                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    )
}
