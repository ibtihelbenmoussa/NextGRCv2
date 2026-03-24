import { BpmnViewerWithProperties } from '@/components/bpmn-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BPMNDiagram, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    Edit,
    FileText,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';

interface BPMNShowProps {
    diagram: BPMNDiagram;
    diagramable?: {
        id: number;
        name: string;
        code?: string;
        description?: string;
    };
    uploader?: User;
}

export default function BPMNShow({
    diagram,
    diagramable,
    uploader,
}: BPMNShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (
            !confirm(
                `Are you sure you want to delete "${diagram.name}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/bpmn-diagrams/${diagram.id}`, {
            onFinish: () => setIsDeleting(false),
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getEntityTypeColor = (type: string) => {
        switch (type) {
            case 'Process':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Macro Process':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getEntityUrl = () => {
        if (diagram.diagramable_type === 'Process') {
            return `/processes/${diagram.diagramable_id}`;
        } else if (diagram.diagramable_type === 'Macro Process') {
            return `/macro-processes/${diagram.diagramable_id}`;
        }
        return '#';
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'BPMN Diagrams', href: '/bpmn' },
                { title: diagram.name, href: '' },
            ]}
        >
            <Head title={diagram.name} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {diagram.name}
                                </h1>
                                <Badge
                                    className={getEntityTypeColor(
                                        diagram.diagramable_type,
                                    )}
                                >
                                    {diagram.diagramable_type}
                                </Badge>
                            </div>
                            {diagram.description && (
                                <p className="text-muted-foreground">
                                    {diagram.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/bpmn">
                                <ChevronLeft className="h-4 w-4" />
                                Back to BPMN Diagrams
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={`/bpmn-diagrams/${diagram.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="diagram" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="diagram">BPMN Diagram</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="diagram" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    BPMN Diagram
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BpmnViewerWithProperties
                                    xml={diagram.bpmn_xml}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            Name
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            {diagram.name}
                                        </dd>
                                    </div>

                                    {diagram.description && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Description
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {diagram.description}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            Type
                                        </dt>
                                        <dd className="mt-1">
                                            <Badge
                                                className={getEntityTypeColor(
                                                    diagram.diagramable_type,
                                                )}
                                            >
                                                {diagram.diagramable_type}
                                            </Badge>
                                        </dd>
                                    </div>

                                    {diagramable && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Associated{' '}
                                                {diagram.diagramable_type}
                                            </dt>
                                            <dd className="mt-1">
                                                <Link
                                                    href={getEntityUrl()}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {diagramable.name}
                                                    {diagramable.code && (
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            ({diagramable.code})
                                                        </span>
                                                    )}
                                                </Link>
                                            </dd>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Metadata */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Metadata</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {uploader && (
                                        <div>
                                            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                <UserIcon className="h-4 w-4" />
                                                Created By
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {uploader.name}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            Created At
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            {formatDate(diagram.created_at)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            Last Updated
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            {formatDate(diagram.updated_at)}
                                        </dd>
                                    </div>

                                    <Separator />

                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            Diagram ID
                                        </dt>
                                        <dd className="mt-1 font-mono text-xs text-muted-foreground">
                                            {diagram.id}
                                        </dd>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Associated Entity Details */}
                        {diagramable && diagramable.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {diagram.diagramable_type} Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            Description
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            {diagramable.description}
                                        </dd>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
