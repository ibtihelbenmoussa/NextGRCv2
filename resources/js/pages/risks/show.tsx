import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import AppLayout from '@/layouts/app-layout'
import { Head, Link, usePage } from '@inertiajs/react'
import { AlertTriangle, ChevronLeft, Shield, FileText, CheckCircle } from 'lucide-react'
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import RiskHistoryChart from '@/components/RiskHistoryChart'
interface RiskShowProps {
    risk: {
        id: number
        name: string
        code: string
        description?: string | null
        category?: string | null
        risk_category?: { name?: string } | null
        inherent_likelihood: number
        inherent_impact: number
        residual_likelihood: number
        residual_impact: number
        owner?: { id: number; name: string } | null
        is_active: boolean
        processes: {
            id: number
            code: string
            name: string
            macroProcess?: { name?: string; businessUnit?: { name?: string } }
        }[]
        controls?: { id: number; name: string }[]
        documents?: { name: string; url: string }[]
    }
}

interface HistoryItem {
    id: number
    resImpact: number
    resProbability: number
    score: number
    type: string
    control_id: number
    created_at: string
}

interface PageProps extends InertiaPageProps {
    history: HistoryItem[]
    initialConfiguration: any
}

export default function Show({ risk }: RiskShowProps) {
    const inherentScore = risk.inherent_likelihood * risk.inherent_impact
    const residualScore = risk.residual_likelihood * risk.residual_impact
    const { history, initialConfiguration } = usePage<PageProps>().props
    const scoreColor = (score: number) => {
        if (score >= 15) return 'border-red-200 bg-red-50 text-red-700'
        if (score >= 9) return 'border-yellow-200 bg-yellow-50 text-yellow-700'
        return 'border-green-200 bg-green-50 text-green-700'
    }

    // Truncate page title if too long
    const pageTitle =
        risk.name.length > 60
            ? `Risk: ${risk.name.slice(0, 60)}...`
            : `Risk: ${risk.name}`

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Details', href: '' },
            ]}
        >
            <Head title={pageTitle} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold tracking-tight break-words whitespace-normal">
                            {risk.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Risk details overview
                        </p>
                    </div>

                    <Link
                        href="/risks"
                        className="flex items-center gap-2 px-4 py-2 rounded border text-sm w-fit"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Link>
                </div>

                {/* Risk Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" /> Risk Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <p className="font-medium break-words">{risk.name}</p>
                        </div>

                        <div>
                            <Label>Code</Label>
                            <p className="break-words">{risk.code}</p>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <p className="break-words">
                                {risk.description || '-'}
                            </p>
                        </div>

                        <div>
                            <Label>Category</Label>
                            <p>{risk.risk_category?.name || '-'}</p>
                        </div>

                        <div>
                            <Label>Owner</Label>
                            <p>{risk.owner?.name || '-'}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label><br />
                            <span
                                className={`inline-block rounded px-3 py-1 text-sm font-medium ${risk.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                {risk.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div>
                            <Label>Related Processes</Label>

                            {risk.processes.length > 0 ? (
                                <ul className="list-disc ml-5 space-y-1">
                                    {risk.processes.map((p) => (
                                        <li key={p.id}>
                                            <Link
                                                href={`/processes/${p.id}`}
                                                className="hover:underline text-blue-600 break-words"
                                            >
                                                {p.code} - {p.name}{' '}
                                                {p.macroProcess
                                                    ? `(Macro: ${p.macroProcess.name || '-'} / BU: ${p.macroProcess.businessUnit?.name || '-'
                                                    })`
                                                    : ''}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>-</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Risk Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Inherent Risk</Label>
                            <p>Likelihood: {risk.inherent_likelihood}</p>
                            <p>Impact: {risk.inherent_impact}</p>
                            <div
                                className={`rounded-md border px-3 py-2 text-center font-medium ${scoreColor(
                                    inherentScore,
                                )}`}
                            >
                                Score: {inherentScore}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Residual Risk</Label>
                            <p>Likelihood: {risk.residual_likelihood}</p>
                            <p>Impact: {risk.residual_impact}</p>
                            <div
                                className={`rounded-md border px-3 py-2 text-center font-medium ${scoreColor(
                                    residualScore,
                                )}`}
                            >
                                Score: {residualScore}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Controls */}
                {risk.controls && risk.controls.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" /> Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc ml-5 space-y-1">
                                {risk.controls.map((c) => (
                                    <li key={c.id}>
                                        <Link
                                            href={`/controls/${c.id}`}
                                            className="font-medium hover:underline break-words"
                                        >
                                            {c.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Documents */}
                {risk.documents && risk.documents.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc ml-5 space-y-1">
                                {risk.documents.map((doc, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            className="text-blue-600 underline break-words"
                                        >
                                            {doc.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}


                <div className="p-6 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Risk History
                            </h1>

                            <p className="text-muted-foreground">
                                Evolution of the risk score over time
                            </p>
                        </div>

                       
                    </div>

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Score Evolution</CardTitle>
                        </CardHeader>

                        <CardContent>

                            {history.length === 0 ? (
                                <p className="text-gray-500">
                                    No history available
                                </p>
                            ) : (

                                <RiskHistoryChart
                                    history={history}
                                    config={initialConfiguration}
                                />

                            )}

                        </CardContent>
                    </Card>

                </div>



            </div>
        </AppLayout>
    )
}
