import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import AppLayout from '@/layouts/app-layout'
import { Head, Link, usePage } from '@inertiajs/react'
import { ChevronLeft } from 'lucide-react'
import React from 'react'
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import RiskHistoryChart from '@/components/RiskHistoryChart'

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

export default function RiskHistory() {

    const { history, initialConfiguration } = usePage<PageProps>().props

    return (
        <AppLayout>
            <Head title="Risk History" />

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

                    <Button variant="outline" asChild>
                        <Link href="/risks">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
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

        </AppLayout>
    )
}