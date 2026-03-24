import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, FolderTree } from 'lucide-react';

interface RiskCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    color: string | null;
    parent_id: number | null;
    is_active: boolean;
    parent?: {
        id: number;
        name: string;
    } | null;
}

interface CategoryOption {
    id: number;
    name: string;
    path: string;
    depth: number;
    parent_id: number | null;
    children?: CategoryOption[];
}

interface RiskCategoryEditProps {
    riskCategory: RiskCategory;
    categories: CategoryOption[];
}

export default function RiskCategoryEdit({
    riskCategory,
}: RiskCategoryEditProps) {
    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        parent_id: string | null;
        color: string;
        is_active: boolean;
    }>({
        name: riskCategory.name,
        code: riskCategory.code,
        description: riskCategory.description || '',
        parent_id: riskCategory.parent_id?.toString() || null,
        color: riskCategory.color || '#3b82f6',
        is_active: riskCategory.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/risk-categories/${riskCategory.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Categories', href: '/risk-categories' },
                {
                    title: riskCategory.name,
                    href: `/risk-categories/${riskCategory.id}`,
                },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit Risk Category: ${riskCategory.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Risk Category
                        </h1>
                        <p className="text-muted-foreground">
                            Update the risk category details
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/risk-categories/${riskCategory.id}`}>
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

                            {/* Parent Category removed as requested */}

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
                            <Link href={`/risk-categories/${riskCategory.id}`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Updating...'
                                : 'Update Risk Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
