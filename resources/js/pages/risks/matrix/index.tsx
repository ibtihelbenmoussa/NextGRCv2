import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Edit,
    Eye,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface RiskLevel {
    id?: number;
    name: string;
    color: string;
    min_score: number;
    max_score: number;
    order: number;
}

interface RiskMatrixConfiguration {
    id: number;
    name: string;
    matrix_dimensions: {
        rows: number;
        columns: number;
        max_score: number;
    };
    scoring_configuration: {
        number_of_levels: number;
        levels: RiskLevel[];
    };
    metadata: {
        is_active: boolean;
        is_custom: boolean;
        preset_used?: string;
        created_at: string;
        updated_at: string;
    };
}

interface Props {
    activeConfiguration: RiskMatrixConfiguration | null;
    configurations: RiskMatrixConfiguration[];
    canManageRiskMatrix: boolean;
}

export default function RiskMatrixIndex({
    activeConfiguration,
    configurations,
    canManageRiskMatrix,
}: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleActivate = (configId: number) => {
        router.post(
            `/risks/matrix/${configId}/activate`,
            {},
            {
                onSuccess: () => {
                    // Handle success
                },
                onError: () => {
                    // Handle error
                },
            },
        );
    };

    const handleDelete = (configId: number) => {
        setDeletingId(configId);
        router.delete(`/risks/matrix/${configId}`, {
            onSuccess: () => {
                setDeletingId(null);
            },
            onError: () => {
                setDeletingId(null);
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                {
                    title: 'Matrix Configurations',
                    href: '/risks/matrix',
                },
            ]}
        >
            <Head title="Risk Matrix Configurations" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Risk Matrix Configurations
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage risk assessment matrix configurations for
                            your organization
                        </p>
                    </div>
                    {canManageRiskMatrix && (
                        <Button asChild>
                            <Link href="/risks/matrix/create">
                                <Plus className="mr-2 h-4 w-4" />
                                New Configuration
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Active Configuration Card */}
                {activeConfiguration && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <CardTitle className="text-green-800">
                                        Active Configuration
                                    </CardTitle>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800"
                                >
                                    Current
                                </Badge>
                            </div>
                            <CardDescription className="text-green-700">
                                This configuration is currently being used for
                                risk assessments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <h4 className="font-medium text-green-800">
                                        {activeConfiguration.name}
                                    </h4>
                                    <p className="text-sm text-green-600">
                                        {
                                            activeConfiguration
                                                .matrix_dimensions.rows
                                        }{' '}
                                        ×{' '}
                                        {
                                            activeConfiguration
                                                .matrix_dimensions.columns
                                        }{' '}
                                        matrix
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-green-600">
                                        <span className="font-medium">
                                            Risk Levels:
                                        </span>{' '}
                                        {
                                            activeConfiguration
                                                .scoring_configuration
                                                .number_of_levels
                                        }
                                    </p>
                                    <p className="text-sm text-green-600">
                                        <span className="font-medium">
                                            Max Score:
                                        </span>{' '}
                                        {
                                            activeConfiguration
                                                .matrix_dimensions.max_score
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/risks/matrix/${activeConfiguration.id}`}
                                        >
                                            <Eye className="mr-1 h-4 w-4" />
                                            View
                                        </Link>
                                    </Button>
                                    {canManageRiskMatrix && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/risks/matrix/${activeConfiguration.id}/edit`}
                                            >
                                                <Edit className="mr-1 h-4 w-4" />
                                                Edit
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Configurations */}
                <div>
                    <h2 className="mb-4 text-lg font-medium text-gray-900">
                        All Configurations
                    </h2>

                    {configurations.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900">
                                    No configurations found
                                </h3>
                                <p className="mb-6 text-gray-600">
                                    Create your first risk matrix configuration
                                    to start assessing risks.
                                </p>
                                {canManageRiskMatrix && (
                                    <Button asChild>
                                        <Link href="/risks/matrix/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Configuration
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {configurations.map((config) => (
                                <Card
                                    key={config.id}
                                    className={
                                        config.metadata.is_active
                                            ? 'border-green-200'
                                            : ''
                                    }
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {config.name}
                                            </CardTitle>
                                            {config.metadata.is_active && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800"
                                                >
                                                    Active
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Created{' '}
                                            {formatDate(
                                                config.metadata.created_at,
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Matrix Size:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        config.matrix_dimensions
                                                            .rows
                                                    }{' '}
                                                    ×{' '}
                                                    {
                                                        config.matrix_dimensions
                                                            .columns
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Risk Levels:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        config
                                                            .scoring_configuration
                                                            .number_of_levels
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Max Score:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        config.matrix_dimensions
                                                            .max_score
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Type:
                                                </span>
                                                <span className="font-medium">
                                                    {config.metadata.is_custom
                                                        ? 'Custom'
                                                        : 'Preset'}
                                                </span>
                                            </div>

                                            {/* Risk Levels Preview */}
                                            <div>
                                                <p className="mb-2 text-sm text-gray-600">
                                                    Risk Levels:
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {config.scoring_configuration.levels
                                                        .sort(
                                                            (a, b) =>
                                                                a.order -
                                                                b.order,
                                                        )
                                                        .map((level) => (
                                                            <span
                                                                key={
                                                                    level.order
                                                                }
                                                                className="inline-block rounded px-2 py-1 text-xs font-medium"
                                                                style={{
                                                                    backgroundColor:
                                                                        level.color,
                                                                    color: '#fff',
                                                                }}
                                                            >
                                                                {level.name}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between border-t pt-4">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/risks/matrix/${config.id}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {canManageRiskMatrix && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/risks/matrix/${config.id}/edit`}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>

                                                {canManageRiskMatrix && (
                                                    <div className="flex space-x-2">
                                                        {!config.metadata
                                                            .is_active && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleActivate(
                                                                        config.id,
                                                                    )
                                                                }
                                                            >
                                                                <Settings className="mr-1 h-4 w-4" />
                                                                Activate
                                                            </Button>
                                                        )}

                                                        {!config.metadata
                                                            .is_active && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Delete
                                                                            Configuration
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are
                                                                            you
                                                                            sure
                                                                            you
                                                                            want
                                                                            to
                                                                            delete
                                                                            "
                                                                            {
                                                                                config.name
                                                                            }
                                                                            "?
                                                                            This
                                                                            action
                                                                            cannot
                                                                            be
                                                                            undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    config.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                deletingId ===
                                                                                config.id
                                                                            }
                                                                        >
                                                                            {deletingId ===
                                                                            config.id
                                                                                ? 'Deleting...'
                                                                                : 'Delete'}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
