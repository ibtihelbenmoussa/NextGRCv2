import { QuickCreateCategoryDialog } from '@/components/quick-create-category-dialog';
import { RiskCategoriesDialog } from '@/components/risk-categories-dialog';
import { type RiskCategory } from '@/components/risk-categories-tree';
import RiskMatrixCanvas from '@/components/risk-matrix-canvas';
import { RiskMatrixCard } from '@/components/risk-matrix-card';
import { RiskStatsCards } from '@/components/risk-stats-cards';
import { ServerDataTable } from '@/components/server-data-table';
import { route } from 'ziggy-js';
import { RefreshCcw } from "lucide-react";
import { Shield, Settings } from "lucide-react"
import { useMemo } from 'react'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import {
    DataTableFacetedFilter,
    type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
import { DataTableRangeDateFilter } from '@/components/server-data-table-range-date-filter';
import {
    DataTableSelectFilter,
    type SelectOption,
} from '@/components/server-data-table-select-filter';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { PaginatedData, Risk, User, AppSetting } from '@/types';
import { RiskConfiguration } from '@/types/risk-configuration';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    FolderTree,
    Grid3x3,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    XCircle,
    ChartSpline,

} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RisksIndexProps {
    risks: PaginatedData<Risk>;
    stats: {
        total: number;
        active: number;
        high_inherent: number;
        high_residual: number;
    };
    filterOptions: {
        categories: string[];
        owners: User[];
    };
    settings: AppSetting[];
    hasRiskSettings: boolean;
    hasInactiveConfigOnly: boolean;
    canManageRiskMatrix: boolean;
    activeConfiguration?: RiskConfiguration | null;
}

const getRiskLevelInfo = (
    score: number | null | undefined,
    config: RiskConfiguration | null | undefined
) => {
    if (score == null || score === 0) {
        return {
            label: 'N/A',
            variant: 'secondary' as const,
            bgColor: undefined,
            textColor: undefined,
            scoreDisplay: '—',
        };
    }

    const levels = config?.score_levels ?? [];

    for (const level of levels) {
        if (score >= level.min && score <= level.max) {
            return {
                label: level.label,
                variant: getBadgeVariantFromHex(level.color),
                bgColor: level.color,
                textColor: '#ffffff',
                scoreDisplay: score.toString(),
            };
        }
    }

    return {
        label: 'Hors échelle',
        variant: 'outline' as const,
        bgColor: undefined,
        textColor: undefined,
        scoreDisplay: score.toString(),
    };
};

const getBadgeVariantFromHex = (hex: string) => {
    const c = hex?.toLowerCase() || '';
    if (c === '#10b981') return 'default';
    if (c === '#f59e0b') return 'outline';
    if (c === '#ef4444') return 'destructive';
    return 'secondary';
};

export default function RisksIndex({
    risks,
    stats,
    filterOptions,
    hasRiskSettings,
    hasInactiveConfigOnly,
    canManageRiskMatrix,
    activeConfiguration,
    settings,
}: RisksIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [riskSettingsAlertOpen, setRiskSettingsAlertOpen] = useState(false);
    const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
    const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [matrixDrawerOpen, setMatrixDrawerOpen] = useState(false);

    const [scoreModalOpen, setScoreModalOpen] = useState(false);
    const [selectedScore, setSelectedScore] = useState<number | null>(null);

    const [quickCreateParentId, setQuickCreateParentId] = useState<number | null>(null);
    const [quickCreateParentName, setQuickCreateParentName] = useState<string | undefined>();
    const [categoryToDelete, setCategoryToDelete] = useState<RiskCategory | null>(null);
    const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);
        router.visit('/risks', {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => setRefreshing(false),
        });
    };

    const currentMode = useMemo(() => {
        const modeSetting = settings?.find((s) => s.key === 'mode');
        return modeSetting?.value ?? null;
    }, [settings]);

    const isAuditMode = currentMode === 'audit';

    const applyMatrixFilter = (type: 'inherent' | 'residual') => {
        if (!selectedScore) return;

        const params = new URLSearchParams(window.location.search);

        if (type === 'inherent') {
            params.set('filter[inherent_score_min]', selectedScore.toString());
            params.set('filter[inherent_score_max]', selectedScore.toString());
        } else {
            params.set('filter[residual_score_min]', selectedScore.toString());
            params.set('filter[residual_score_max]', selectedScore.toString());
        }

        setScoreModalOpen(false);
        setMatrixDrawerOpen(false);

        router.visit(`/risks?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const response = await fetch(`/risks/export?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `risks-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const statusOptions: FacetedFilterOption[] = [
        { label: 'Active', value: 'Active', icon: CheckCircle2 },
        { label: 'Inactive', value: 'Inactive', icon: XCircle },
    ];

    const categoryOptions: FacetedFilterOption[] = filterOptions.categories.map((category) => ({
        label: category,
        value: category,
    }));

    const ownerOptions: SelectOption[] = filterOptions.owners.map((owner) => ({
        value: String(owner.id),
        label: owner.name,
    }));

    const columns: ColumnDef<Risk>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('code')}</div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <Link
                    href={`/risks/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },
        {
            accessorKey: 'risk_category',
            header: 'Category',
            cell: ({ row }) => {
                const category = row.original.risk_category;
                return category ? (
                    <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
                        {category.name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">Non définie</span>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'owner',
            header: 'Owner',
            cell: ({ row }) => {
                const owner = row.original.owner;
                return owner ? (
                    <Badge variant="secondary">{owner.name}</Badge>
                ) : (
                    <span className="text-muted-foreground">No owner</span>
                );
            },
            enableSorting: false,
        },
        {
            id: 'inherent_risk',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Inherent Risk" />
            ),
            cell: ({ row }) => {
                const risk = row.original;
                const score = (risk.inherent_impact ?? 0) * (risk.inherent_likelihood ?? 0);
                const { label, variant, bgColor, textColor } = getRiskLevelInfo(score, activeConfiguration);
                return (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Badge
                            variant={variant}
                            style={bgColor ? { backgroundColor: bgColor, color: textColor || 'white' } : undefined}
                            className="min-w-[5rem] justify-center font-medium"
                        >
                            {label} ({score})
                        </Badge>
                    </div>
                );
            },
            sortingFn: (rowA, rowB) => {
                const a = (rowA.original.inherent_impact ?? 0) * (rowA.original.inherent_likelihood ?? 0);
                const b = (rowB.original.inherent_impact ?? 0) * (rowB.original.inherent_likelihood ?? 0);
                return a - b;
            },
        },
        {
            id: 'residual_risk',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Residual Risk" />
            ),
            cell: ({ row }) => {
                const risk = row.original;
                const score = (risk.residual_impact ?? 0) * (risk.residual_likelihood ?? 0);
                const { label, variant, bgColor, textColor } = getRiskLevelInfo(score, activeConfiguration);
                return (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Badge
                            variant={variant}
                            style={bgColor ? { backgroundColor: bgColor, color: textColor || 'white' } : undefined}
                            className="min-w-[5rem] justify-center font-medium"
                        >
                            {label} ({score})
                        </Badge>
                    </div>
                );
            },
            sortingFn: (rowA, rowB) => {
                const a = (rowA.original.residual_impact ?? 0) * (rowA.original.residual_likelihood ?? 0);
                const b = (rowB.original.residual_impact ?? 0) * (rowB.original.residual_likelihood ?? 0);
                return a - b;
            },
        },
        {
            accessorKey: 'processes_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Processes" />
            ),
            cell: ({ row }) => (
                <div className="text-center">{row.getValue('processes_count') ?? 0}</div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.getValue('is_active');
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'updated_at',
            meta: { title: 'Last Updated' },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('updated_at'));
                return <div>{date.toLocaleDateString()}</div>;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const risk = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-4 w-4 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => router.visit(`/risks/${risk.id}/kris`)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                KRI
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => router.visit(`/risks/${risk.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.visit(`/risks/${risk.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setRiskToDelete(risk);
                                    setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            meta: { pinned: 'right' },
        },
    ];

    const handleDeleteConfirm = () => {
        if (riskToDelete) {
            router.delete(`/risks/${riskToDelete.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setRiskToDelete(null);
                },
            });
        }
    };

    const fetchRiskCategories = async () => {
        setCategoriesLoading(true);
        try {
            const response = await fetch('/risk-categories/tree');
            if (response.ok) {
                const data = await response.json();
                setRiskCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch risk categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    useEffect(() => {
        if (categoriesDialogOpen) {
            fetchRiskCategories();
        }
    }, [categoriesDialogOpen]);

    const handleQuickCreate = (parentId: number | null, parentName?: string) => {
        setQuickCreateParentId(parentId);
        setQuickCreateParentName(parentName);
        setQuickCreateOpen(true);
    };

    const handleDeleteCategory = (category: RiskCategory) => {
        setCategoryToDelete(category);
        setDeleteCategoryDialogOpen(true);
    };

    const handleDeleteCategoryConfirm = () => {
        if (categoryToDelete) {
            router.delete(`/risk-categories/${categoryToDelete.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteCategoryDialogOpen(false);
                    setCategoryToDelete(null);
                    fetchRiskCategories();
                },
                onError: () => {
                    setDeleteCategoryDialogOpen(false);
                    setCategoryToDelete(null);
                },
            });
        }
    };

    // Shared filters JSX
    const filtersJSX = (
        <>
            <DataTableFacetedFilter
                filterKey="status"
                title="Status"
                options={statusOptions}
            />
            {categoryOptions.length > 0 && (
                <DataTableFacetedFilter
                    filterKey="category"
                    title="Category"
                    options={categoryOptions}
                />
            )}
            <DataTableSelectFilter
                filterKey="owner_id"
                title="Owner"
                placeholder="Select owner..."
                searchPlaceholder="Search owners..."
                emptyMessage="No owners found."
                options={ownerOptions}
                showIcon={false}
            />
            <DataTableRangeDateFilter
                filterFromKey="date_from"
                filterToKey="date_to"
                title="Date Range"
                placeholder="Pick date range"
            />
        </>
    );

    // Shared Risk Matrix content JSX
    const riskMatrixContent = (
        <>
            {activeConfiguration ? (
                <RiskMatrixCanvas
                    activeConfiguration={activeConfiguration}
                    onCellClick={(likelihood, consequence, score) => {
                        setSelectedScore(score);
                        setScoreModalOpen(true);
                    }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-11">
                    <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                        No Active Risk Configuration
                    </h3>
                    <p className="mb-4 text-center text-sm text-muted-foreground">
                        Please configure a risk matrix to view the risk assessment matrix.
                    </p>
                    {canManageRiskMatrix && (
                        <Button onClick={() => router.visit('/risk-configurations')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Configure Risk Matrix
                        </Button>
                    )}
                </div>
            )}
        </>
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Risks', href: '/risks' }]}>
            <Head title="Risks" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Risks
                        </h1>
                        <p className="text-muted-foreground">
                            Manage organizational risks and assessments
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            onClick={() => setCategoriesDialogOpen(true)}
                            className="w-full sm:w-auto"
                        >
                            <FolderTree className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Categories</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/risk-configurations')}
                            className="w-full sm:w-auto"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Risk Configuration</span>
                        </Button>
                        <Button
                            onClick={() => {
                                if (!hasRiskSettings) {
                                    setRiskSettingsAlertOpen(true);
                                } else {
                                    router.visit('/risks/create');
                                }
                            }}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Risk
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <RiskStatsCards
                    total={stats.total}
                    active={stats.active}
                    high_inherent={stats.high_inherent}
                    high_residual={stats.high_residual}
                />

                {/* Mobile and Tablet: Tabs Layout */}
                <div className="block xl:hidden">
                    <Tabs defaultValue="table" className="space-y-4">
                        {/* <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="table">Data Table</TabsTrigger>
                            <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
                        </TabsList> */}

                        <TabsContent value="table" className="space-y-4">
                            <ServerDataTable
                                columns={columns}
                                data={risks}
                                searchPlaceholder="Search risks..."
                                onExport={handleExport}
                                exportLoading={exportLoading}
                                filters={filtersJSX}
                                initialState={{
                                    columnPinning: { right: ['actions'] },
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="matrix">
                            <RiskMatrixCard
                                activeConfiguration={activeConfiguration}
                                risks={risks.data}
                                canManageRiskMatrix={canManageRiskMatrix}
                                onRiskClick={(risk) => router.visit(`/risks/${risk.id}`)}
                                onManageMatrixClick={() => router.visit('/risks/matrix')}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Desktop: Full-width DataTable + Risk Matrix Sheet Drawer */}
                <div className="hidden xl:block">
                    <ServerDataTable
                        columns={columns}
                        data={risks}
                        searchPlaceholder="Search risks..."
                        onExport={handleExport}
                        exportLoading={exportLoading}
                        toolbar={
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="h-9 gap-2"
                                >
                                    <RefreshCcw
                                        className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                                    />
                                    Reset
                                </Button>

                                {/* Risk Matrix Sheet Trigger */}
                                <Sheet open={matrixDrawerOpen} onOpenChange={setMatrixDrawerOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-2">
                                            <Grid3x3 className="h-4 w-4" />
                                            Risk Matrix
                                        </Button>
                                    </SheetTrigger>

                                    <SheetContent
                                        side="right"
                                        className="
                                       !h-fit
                                        max-h-[90vh]
                                        mt-6
                                        mr-4
                                        rounded-2xl
                                        border
                                        bg-background
                                        shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                                        backdrop-blur
                                        p-4
                                        "
                                    >
                                        <SheetHeader className="mb-2 p-0">
                                            <SheetTitle className="flex items-center gap-2 text-sm">
                                                <Grid3x3 className="h-4 w-4" />
                                                Risk Matrix
                                            </SheetTitle>
                                        </SheetHeader>

                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="inline-block">
                                                {riskMatrixContent}
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        }
                        filters={filtersJSX}
                        initialState={{
                            columnPinning: { right: ['actions'] },
                        }}
                    />
                </div>
            </div>

            {/* Filter Risks by Score */}
            <AlertDialog open={scoreModalOpen} onOpenChange={setScoreModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Filter Risks by Score {selectedScore}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose how you want to filter the risks:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <Button variant="outline" onClick={() => applyMatrixFilter('inherent')}>
                            Filter by Inherent Risk
                        </Button>
                        <Button variant="outline" onClick={() => applyMatrixFilter('residual')}>
                            Filter by Residual Risk
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Risk Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Risk</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{riskToDelete?.name}"? This action
                            cannot be undone and will also remove all associated processes and
                            controls.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Risk Settings Alert Dialog */}
            <AlertDialog open={riskSettingsAlertOpen} onOpenChange={setRiskSettingsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {hasInactiveConfigOnly
                                ? 'Risk Configuration Inactive'
                                : 'Risk Settings Required'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {hasInactiveConfigOnly ? (
                                <>
                                    Your organization has risk matrix configurations available, but
                                    none are currently active. You need to activate a risk matrix
                                    configuration before creating risks.
                                    <br />
                                    <br />
                                    An active configuration defines the impact and likelihood scales
                                    used for risk assessment and scoring.
                                </>
                            ) : (
                                <>
                                    Your organization doesn't have risk matrix settings configured
                                    yet. You need to set up the risk matrix configuration before
                                    creating risks.
                                    <br />
                                    <br />
                                    This includes defining impact and likelihood scales that are
                                    essential for risk assessment and scoring.
                                </>
                            )}
                            {!canManageRiskMatrix && (
                                <>
                                    <br />
                                    <br />
                                    <strong>Note:</strong> You don't have permission to configure
                                    risk settings. Please contact your administrator to{' '}
                                    {hasInactiveConfigOnly ? 'activate' : 'set up'} the risk matrix
                                    configuration.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {canManageRiskMatrix ? (
                            <AlertDialogAction
                                onClick={() => {
                                    router.visit('/risks/matrix');
                                    setRiskSettingsAlertOpen(false);
                                }}
                            >
                                {hasInactiveConfigOnly
                                    ? 'Manage Risk Settings'
                                    : 'Configure Risk Settings'}
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction onClick={() => setRiskSettingsAlertOpen(false)}>
                                Understood
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Risk Categories Management Dialog */}
            <RiskCategoriesDialog
                open={categoriesDialogOpen}
                onOpenChange={setCategoriesDialogOpen}
                categoriesLoading={categoriesLoading}
                riskCategories={riskCategories}
                handleQuickCreate={handleQuickCreate}
                handleDeleteCategory={handleDeleteCategory}
                handleNewCategory={() => {
                    setQuickCreateParentId(null);
                    setQuickCreateParentName(undefined);
                    setQuickCreateOpen(true);
                }}
            />

            {/* Quick Create Category Dialog */}
            <QuickCreateCategoryDialog
                open={quickCreateOpen}
                onOpenChange={setQuickCreateOpen}
                parentId={quickCreateParentId}
                parentName={quickCreateParentName}
                onSuccess={() => {
                    if (categoriesDialogOpen) {
                        fetchRiskCategories();
                    }
                }}
            />

            {/* Delete Category Confirmation Dialog */}
            <AlertDialog
                open={deleteCategoryDialogOpen}
                onOpenChange={setDeleteCategoryDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the risk category "
                            {categoryToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategoryConfirm}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
