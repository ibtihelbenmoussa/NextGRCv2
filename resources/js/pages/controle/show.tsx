import AppLayout from '@/layouts/app-layout'
import { Head, Link, usePage } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Shield, Pencil } from 'lucide-react'
import { useMemo } from 'react'

interface ScoreLevel {
    id: number
    label: string
    min: number
    max: number
    color: string
}
interface Risk {
    id: number
    name: string
    residual_impact?: number | null
    residual_likelihood?: number | null
}
export default function ShowControl() {
    const { control, activeConfiguration } = usePage<any>().props
    const scoreLevels: ScoreLevel[] = useMemo(
        () => activeConfiguration?.score_levels ?? [],
        [activeConfiguration]
    )
    const getResidualLevel = (impact?: number | null, likelihood?: number | null) => {
        if (impact == null || likelihood == null) return null
        const score = impact * likelihood
        const level = scoreLevels.find((l) => score >= l.min && score <= l.max)
        return { score, level }
    }
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Controls', href: '/controls' },
                { title: control.name, href: `/controls/${control.id}` },
            ]}
        >
            <Head title="Control Details" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{control.name}</h1>
                        <p className="text-muted-foreground">{control.code}</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/controls">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href={`/controls/${control.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <Shield className="h-5 w-5" />
                        <CardTitle>Control Information</CardTitle>
                    </CardHeader>

                    <CardContent className="grid grid-cols-2 gap-6">
                        <Info label="Type" value={control.control_type} />
                        <Info label="Nature" value={control.control_nature} />
                        <Info label="Frequency" value={control.frequency} />
                        <Info
                            label="Status"
                            value={
                                <Badge variant={control.is_active ? 'default' : 'secondary'}>
                                    {control.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            }
                        />

                        <Info label="Owner" value={control.owner?.name} />

                        <div className="col-span-2">
                            <p className="font-medium mb-1">Description</p>
                            <p className="text-muted-foreground">
                                {control.description || 'No description'}
                            </p>
                        </div>

                        <div className="col-span-2">
                            <p className="font-medium mb-1">Related Risks</p>
                            <div className="flex flex-wrap gap-2">
                                {control.risks.map((risk: Risk) => {
                                    const result = getResidualLevel(
                                        risk.residual_impact,
                                        risk.residual_likelihood
                                    )

                                    const bgColor = result?.level?.color ?? '#e5e7eb'

                                    const borderColor = result?.level?.color ?? '#d1d5db'

                                    return (

                                        <Link
                                            key={risk.id}
                                            href={`/risks/${risk.id}`}
                                            className="whitespace-nowrap"
                                        >
                                            <Badge
                                               
                                                style={{
                                                    backgroundColor: bgColor + '20', // léger fond
                                                    color: bgColor,
                                                    border: `1px solid ${borderColor}`,
                                                }}
                                            >
                                                {risk.name}

                                            </Badge></Link>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}

function Info({ label, value }: any) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="font-medium">{value}</div>
        </div>
    )
}
