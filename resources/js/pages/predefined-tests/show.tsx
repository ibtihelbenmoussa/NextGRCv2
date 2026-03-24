import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    ChevronLeft,
    Pencil,
    FileText,
    ShieldAlert,
    Target,
} from 'lucide-react'

interface Test {
    id: number
    name: string
    code: string
    test_objective: string
    test_result: string
    risk: string
    echantillon: string
    is_active: boolean
}

interface Props {
    test: Test
}

export default function ShowPredefinedTest({ test }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Predefined Tests', href: '/predefined-tests' },
                { title: 'Details', href: '' },
            ]}
        >
            <Head title={`Test: ${test.name}`} />

            <div className="space-y-6 p-4">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {test.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Predefined test overview
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/predefined-tests">
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href={`/predefined-tests/${test.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* TEST OVERVIEW */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Test Overview
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{test.name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Code</p>
                            <p className="font-medium">{test.code}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge
                                className={`px-3 py-1 ${test.is_active
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    }`}
                            >
                                {test.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* OBJECTIVE & RESULT */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Objective & Expected Result
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-6">

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Objective
                            </p>
                            <div
                                className="rounded-md border bg-muted/30 p-4 prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: test.test_objective,
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Expected Result
                            </p>
                            <div
                                className="rounded-md border bg-muted/30 p-4 prose dark:prose-invert max-w-none
               [&_table]:w-full
               [&_table]:border-collapse
               [&_th]:border
               [&_td]:border
               [&_th]:border-border
               [&_td]:border-border
               [&_th]:p-2
               [&_td]:p-2
               [&_th]:bg-muted/50"
                                dangerouslySetInnerHTML={{ __html: test.test_result }}
                            />
                        </div>

                    </CardContent>
                </Card>

                {/* RISK & SAMPLE */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            Risk & Sample Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-6">

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Related Risk
                            </p>
                            <div
                                className="rounded-md border bg-muted/30 p-4 prose dark:prose-invert max-w-none
               [&_table]:w-full
               [&_table]:border-collapse
               [&_th]:border
               [&_td]:border
               [&_th]:border-border
               [&_td]:border-border
               [&_th]:p-2
               [&_td]:p-2
               [&_th]:bg-muted/50"                                dangerouslySetInnerHTML={{
                                    __html: test.risk,
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Sample (Échantillon)
                            </p>
                            <div
                               className="rounded-md border bg-muted/30 p-4 prose dark:prose-invert max-w-none
               [&_table]:w-full
               [&_table]:border-collapse
               [&_th]:border
               [&_td]:border
               [&_th]:border-border
               [&_td]:border-border
               [&_th]:p-2
               [&_td]:p-2
               [&_th]:bg-muted/50"
                                dangerouslySetInnerHTML={{
                                    __html: test.echantillon,
                                }}
                            />
                        </div>

                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    )
}