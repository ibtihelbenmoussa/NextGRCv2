import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TreeView, type TreeDataItem } from '@/components/tree-view';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Folder, FolderTree } from 'lucide-react';
import { useMemo, useState } from 'react';

interface RiskCategory {
    id: number;
    name: string;
    path: string;
    depth: number;
    parent_id: number | null;
    children?: RiskCategory[];
}

interface RiskCategoryCreateProps {
    categories: RiskCategory[];
}

export default function RiskCategoryCreate({
    categories,
}: RiskCategoryCreateProps) {
    const [selectedParent, setSelectedParent] = useState<TreeDataItem | undefined>();

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        parent_id: string | null;
        color: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        description: '',
        parent_id: null,
        color: '#3b82f6',
        is_active: true,
    });

    // Build tree structure
    const buildTree = (categories: RiskCategory[]): RiskCategory[] => {
        const categoryMap = new Map<number, RiskCategory>();
        const roots: RiskCategory[] = [];

        categories.forEach((cat) => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

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

    const convertToTreeData = (categories: RiskCategory[]): TreeDataItem[] => {
        return categories.map((cat) => ({
            id: cat.id.toString(),
            name: cat.name,
            icon: cat.children && cat.children.length > 0 ? FolderTree : Folder,
            children: cat.children ? convertToTreeData(cat.children) : undefined,
        }));
    };

    const treeData = useMemo(
        () => convertToTreeData(buildTree(categories)),
        [categories],
    );

    const handleParentSelect = (item: TreeDataItem | undefined) => {
        setSelectedParent(item);
        setData('parent_id', item ? item.id : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/risk-categories');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Categories', href: '/risk-categories' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Risk Category" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Risk Category
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new risk category to organize your risks
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/risk-categories">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                Category Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Financial Risk"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Code */}
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="FIN"
                                    maxLength={50}
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Brief description of the risk category"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Parent Category */}
                            <div className="space-y-2">
                                <Label htmlFor="parent_id">
                                    Parent Category
                                </Label>
                                <div className="rounded-lg border">
                                    <div className="p-2 border-b bg-muted/50">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedParent
                                                ? `Selected: ${selectedParent.name}`
                                                : 'None (Root Category)'}
                                        </p>
                                        {selectedParent && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleParentSelect(undefined)}
                                                className="mt-1 h-6 text-xs"
                                            >
                                                Clear Selection
                                            </Button>
                                        )}
                                    </div>
                                    {treeData.length > 0 ? (
                                        <TreeView
                                            data={treeData}
                                            className="max-h-[300px] overflow-auto"
                                            onSelectChange={handleParentSelect}
                                            initialSelectedItemId={data.parent_id || undefined}
                                            defaultNodeIcon={FolderTree}
                                            defaultLeafIcon={Folder}
                                        />
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No categories available. This will be a root category.
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Select a parent category or leave empty to create a root category
                                </p>
                                {errors.parent_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.parent_id}
                                    </p>
                                )}
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <Label htmlFor="color">Color</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="color"
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
                                <p className="text-sm text-muted-foreground">
                                    Choose a color to visually identify this
                                    category
                                </p>
                                {errors.color && (
                                    <p className="text-sm text-destructive">
                                        {errors.color}
                                    </p>
                                )}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">
                                        Active Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Set whether this category is currently
                                        active
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>
                            {errors.is_active && (
                                <p className="text-sm text-destructive">
                                    {errors.is_active}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/risk-categories">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Creating...'
                                : 'Create Risk Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
