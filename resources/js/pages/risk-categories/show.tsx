import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TreeView, type TreeDataItem } from '@/components/tree-view';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronLeft,
    Eye,
    Folder,
    FolderPlus,
    FolderTree,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface RiskCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    color: string | null;
    parent_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    risks_count: number;
    children_count: number;
    parent?: {
        id: number;
        name: string;
    } | null;
    children?: RiskCategory[];
    risks?: Array<{
        id: number;
        code: string;
        name: string;
        is_active: boolean;
    }>;
}

interface RiskCategoryShowProps {
    riskCategory: RiskCategory;
}

export default function RiskCategoryShow({
    riskCategory,
}: RiskCategoryShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] =
        useState<RiskCategory | null>(null);

    // Convert children to tree data
    const convertToTreeData = (
        categories: RiskCategory[],
    ): TreeDataItem[] => {
        return categories.map((cat) => ({
            id: cat.id.toString(),
            name: cat.name,
            icon: cat.children && cat.children.length > 0 ? FolderTree : Folder,
            children: cat.children
                ? convertToTreeData(cat.children)
                : undefined,
            actions: (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                    >
                        <Link href={`/risk-categories/${cat.id}`}>
                            <Eye className="h-3 w-3" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                    >
                        <Link href={`/risk-categories/${cat.id}/edit`}>
                            <Pencil className="h-3 w-3" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => {
                            setCategoryToDelete(cat);
                            setDeleteDialogOpen(true);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        }));
    };

    const childrenTreeData = useMemo(
        () =>
            riskCategory.children
                ? convertToTreeData(riskCategory.children)
                : [],
        [riskCategory.children],
    );

    const handleDelete = () => {
        const idToDelete = categoryToDelete?.id || riskCategory.id;
        router.delete(`/risk-categories/${idToDelete}`, {
            onSuccess: () => {
                if (categoryToDelete) {
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                    router.reload();
                } else {
                    router.visit('/risk-categories');
                }
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Categories', href: '/risk-categories' },
                { title: riskCategory.name, href: '' },
            ]}
        >
            <Head title={`Risk Category: ${riskCategory.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/risk-categories">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                {riskCategory.color && (
                                    <div
                                        className="h-8 w-8 rounded-full border-2"
                                        style={{
                                            backgroundColor: riskCategory.color,
                                        }}
                                    />
                                )}
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {riskCategory.name}
                                </h1>
                                <Badge
                                    variant={
                                        riskCategory.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {riskCategory.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Code: {riskCategory.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/risk-categories/create">
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Add Subcategory
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link
                                href={`/risk-categories/${riskCategory.id}/edit`}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                Category Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Description
                                </p>
                                <p className="mt-1">
                                    {riskCategory.description ||
                                        'No description provided'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Parent Category
                                </p>
                                <p className="mt-1">
                                    {riskCategory.parent ? (
                                        <Link
                                            href={`/risk-categories/${riskCategory.parent.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {riskCategory.parent.name}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Root Category
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Color
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    {riskCategory.color && (
                                        <>
                                            <div
                                                className="h-6 w-6 rounded border"
                                                style={{
                                                    backgroundColor:
                                                        riskCategory.color,
                                                }}
                                            />
                                            <span className="font-mono text-sm">
                                                {riskCategory.color}
                                            </span>
                                        </>
                                    )}
                                    {!riskCategory.color && (
                                        <span className="text-muted-foreground">
                                            No color set
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Created
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {new Date(
                                            riskCategory.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {new Date(
                                            riskCategory.updated_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Subcategories
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {riskCategory.children_count || 0}
                                    </p>
                                </div>
                                <FolderTree className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Associated Risks
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {riskCategory.risks_count || 0}
                                    </p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subcategories */}
                {riskCategory.children && riskCategory.children.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                Subcategories ({riskCategory.children_count})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TreeView
                                data={childrenTreeData}
                                className="min-h-[200px]"
                                expandAll
                                defaultNodeIcon={FolderTree}
                                defaultLeafIcon={Folder}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Associated Risks */}
                {riskCategory.risks && riskCategory.risks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Associated Risks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {riskCategory.risks.map((risk) => (
                                    <Link
                                        key={risk.id}
                                        href={`/risks/${risk.id}`}
                                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {risk.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {risk.code}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                risk.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {risk.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the risk category "
                            {categoryToDelete?.name || riskCategory.name}". This
                            action cannot be undone.
                            {((categoryToDelete?.children_count ||
                                riskCategory.children_count) > 0 ||
                                (categoryToDelete?.risks_count ||
                                    riskCategory.risks_count) > 0) && (
                                <span className="mt-2 block font-semibold text-destructive">
                                    Warning: This category has{' '}
                                    {(categoryToDelete?.children_count ||
                                        riskCategory.children_count) > 0 &&
                                        `${
                                            categoryToDelete?.children_count ||
                                            riskCategory.children_count
                                        } subcategories`}
                                    {(categoryToDelete?.children_count ||
                                        riskCategory.children_count) > 0 &&
                                        (categoryToDelete?.risks_count ||
                                            riskCategory.risks_count) > 0 &&
                                        ' and '}
                                    {(categoryToDelete?.risks_count ||
                                        riskCategory.risks_count) > 0 &&
                                        `${
                                            categoryToDelete?.risks_count ||
                                            riskCategory.risks_count
                                        } associated risks`}
                                    . Please reassign or delete them first.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
