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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TreeNode, TreeView } from '@/components/ui/tree-view';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Eye,
    Folder,
    FolderPlus,
    FolderTree,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface RiskCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    color: string | null;
    parent_id: number | null;
    is_active: boolean;
    risks_count: number;
    parent?: {
        id: number;
        name: string;
    } | null;
    children?: RiskCategory[];
}

interface RiskCategoriesIndexProps {
    riskCategories: RiskCategory[];
    stats: {
        total: number;
        active: number;
        root_categories: number;
        total_risks: number;
    };
}

// Quick Create Dialog Component
function QuickCreateDialog({
    open,
    onOpenChange,
    parentId,
    parentName,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: number | null;
    parentName?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        code: string;
        parent_id: number | null;
        color: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        parent_id: null,
        color: '#3b82f6',
        is_active: true,
    });

    // Update parent_id when parentId prop changes
    useEffect(() => {
        setData('parent_id', parentId);
    }, [parentId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/risk-categories', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
                // Reload the current page to show the new category
                router.reload({ only: ['riskCategories', 'stats'] });
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Quick Create Category</DialogTitle>
                        <DialogDescription>
                            {parentName
                                ? `Create a subcategory under "${parentName}"`
                                : 'Create a new root category'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quick-name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g., Financial Risk"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-code">
                                Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-code"
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        'code',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="e.g., FIN"
                                maxLength={50}
                            />
                            {errors.code && (
                                <p className="text-sm text-destructive">
                                    {errors.code}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-color">Color</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="quick-color"
                                    type="color"
                                    value={data.color}
                                    onChange={(e) =>
                                        setData('color', e.target.value)
                                    }
                                    className="h-10 w-20 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={data.color}
                                    onChange={(e) =>
                                        setData('color', e.target.value)
                                    }
                                    placeholder="#3b82f6"
                                    maxLength={7}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function RiskCategoriesIndex({
    riskCategories,
    stats,
}: RiskCategoriesIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] =
        useState<RiskCategory | null>(null);
    const [searchQuery] = useState('');
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [quickCreateParentId, setQuickCreateParentId] = useState<
        number | null
    >(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);

    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    // Show success message when flash message exists
    useEffect(() => {
        if (flash?.success) {
            setShowSuccessMessage(true);
            const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Show error message when flash error exists
    useEffect(() => {
        if (flash?.error) {
            setShowErrorMessage(true);
            const timer = setTimeout(() => setShowErrorMessage(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Convert flat categories to tree structure
    const buildTree = (categories: RiskCategory[]): RiskCategory[] => {
        const categoryMap = new Map<number, RiskCategory>();
        const roots: RiskCategory[] = [];

        // First pass: create a map of all categories
        categories.forEach((cat) => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        // Second pass: build the tree
        categories.forEach((cat) => {
            const category = categoryMap.get(cat.id)!;
            if (cat.parent_id) {
                const parent = categoryMap.get(cat.parent_id);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(category);
                }
            } else {
                roots.push(category);
            }
        });

        return roots;
    };

    // Convert categories to tree data items
    const convertToTreeData = useCallback(
        (categories: RiskCategory[]): TreeNode[] => {
            return categories.map((cat) => {
                // Store category reference for actions
                const categoryData = cat;
                return {
                    id: cat.id.toString(),
                    label: `${cat.name} (${cat.code})${!cat.is_active ? ' [Inactive]' : ''}${cat.risks_count > 0 ? ` [${cat.risks_count}]` : ''}`,
                    icon:
                        cat.children && cat.children.length > 0 ? (
                            <FolderTree className="h-4 w-4 text-primary/70" />
                        ) : (
                            <Folder className="h-4 w-4 text-muted-foreground" />
                        ),
                    children: cat.children
                        ? convertToTreeData(cat.children)
                        : undefined,
                    actions: (
                        <div className="flex gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickCreateParentId(categoryData.id);
                                    setQuickCreateOpen(true);
                                }}
                                title="Add subcategory"
                            >
                                <FolderPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                asChild
                            >
                                <Link
                                    href={`/risk-categories/${categoryData.id}`}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                asChild
                            >
                                <Link
                                    href={`/risk-categories/${categoryData.id}/edit`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(categoryData);
                                    setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ),
                };
            });
        },
        [],
    );

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return riskCategories;

        const query = searchQuery.toLowerCase();
        return riskCategories.filter(
            (cat) =>
                cat.name.toLowerCase().includes(query) ||
                cat.code.toLowerCase().includes(query) ||
                cat.description?.toLowerCase().includes(query),
        );
    }, [riskCategories, searchQuery]);

    const treeData = useMemo(
        () => convertToTreeData(buildTree(filteredCategories)),
        [filteredCategories, convertToTreeData],
    );

    const handleDelete = () => {
        console.log('handleDelete called, categoryToDelete:', categoryToDelete);
        if (categoryToDelete) {
            console.log('Deleting category with ID:', categoryToDelete.id);
            router.delete(`/risk-categories/${categoryToDelete.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Delete successful');
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                    // Reload the page data to refresh the tree
                    router.reload({ only: ['riskCategories', 'stats'] });
                },
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    // Close dialog even on error so user can see the error message
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                },
                onFinish: () => {
                    // Always close dialog when request finishes
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                },
            });
        } else {
            console.log('No category to delete');
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Risk Categories', href: '/risk-categories' },
            ]}
        >
            <Head title="Risk Categories" />

            <div className="space-y-6 p-4">
                {/* Success Message */}
                {showSuccessMessage && flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <p className="font-medium">{flash.success}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {showErrorMessage && flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <X className="h-5 w-5" />
                                <p className="font-medium">{flash.error}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowErrorMessage(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Risk Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Organize and manage your risk categories
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setQuickCreateParentId(null);
                                setQuickCreateOpen(true);
                            }}
                            title="Keyboard shortcut: Ctrl/Cmd + K"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create new category
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-6 text-card-foreground">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Categories
                            </p>
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 text-card-foreground">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">
                                Active
                            </p>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.active}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 text-card-foreground">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">
                                Root Categories
                            </p>
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.root_categories}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 text-card-foreground">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Risks
                            </p>
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.total_risks}
                        </p>
                    </div>
                </div>

                {/* Tree View */}
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                Category Hierarchy
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {treeData.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Showing {filteredCategories.length} of{' '}
                                        {riskCategories.length} categories
                                    </span>
                                </div>
                                <div className="overflow-y-auto rounded-md">
                                    <TreeView data={treeData} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-muted-foreground">
                                <FolderTree className="h-16 w-16 opacity-20" />
                                <div className="text-center">
                                    <p className="font-medium">
                                        {searchQuery
                                            ? 'No categories found'
                                            : 'No categories yet'}
                                    </p>
                                    <p className="text-sm">
                                        {searchQuery
                                            ? 'Try adjusting your search'
                                            : 'Create your first category to get started'}
                                    </p>
                                </div>
                                {!searchQuery && (
                                    <Button
                                        onClick={() => {
                                            setQuickCreateParentId(null);
                                            setQuickCreateOpen(true);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Category
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Create Dialog */}
            <QuickCreateDialog
                open={quickCreateOpen}
                onOpenChange={setQuickCreateOpen}
                parentId={quickCreateParentId}
                parentName={
                    quickCreateParentId
                        ? riskCategories.find(
                              (c) => c.id === quickCreateParentId,
                          )?.name
                        : undefined
                }
            />

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
                            {categoryToDelete?.name}". This action cannot be
                            undone.
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
