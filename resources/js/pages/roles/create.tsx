import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Check, Shield } from 'lucide-react';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    category?: string;
}

interface RoleCreateProps {
    permissions: Permission[];
}

export default function RoleCreate({ permissions }: RoleCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        guard_name: 'web',
        permissions: [] as number[],
    });

    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(
        new Set(),
    );

    // Group permissions by category
    const groupedPermissions = permissions.reduce(
        (acc, permission) => {
            const category = permission.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/roles');
    };

    const togglePermission = (permissionId: number) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permissionId)) {
            newSet.delete(permissionId);
        } else {
            newSet.add(permissionId);
        }
        setSelectedPermissions(newSet);
        setData('permissions', Array.from(newSet));
    };

    const selectAllInCategory = (category: string) => {
        const categoryPermissions = groupedPermissions[category];
        const allSelected = categoryPermissions.every((p) =>
            selectedPermissions.has(p.id),
        );

        const newSet = new Set(selectedPermissions);
        categoryPermissions.forEach((p) => {
            if (allSelected) {
                newSet.delete(p.id);
            } else {
                newSet.add(p.id);
            }
        });
        setSelectedPermissions(newSet);
        setData('permissions', Array.from(newSet));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Roles', href: '/roles' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create Role" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Create Role
                    </h1>
                    <p className="text-muted-foreground">
                        Create a new role and assign permissions
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Role Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Role Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Role Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="e.g., Manager, Editor"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Use lowercase with hyphens (e.g.,
                                    audit-chief, risk-manager)
                                </p>
                            </div>

                            {/* Guard Name */}
                            <div className="space-y-2">
                                <Label htmlFor="guard_name">Guard Name</Label>
                                <Input
                                    id="guard_name"
                                    value={data.guard_name}
                                    onChange={(e) =>
                                        setData('guard_name', e.target.value)
                                    }
                                    placeholder="web"
                                    disabled
                                />
                                <p className="text-sm text-muted-foreground">
                                    Default guard for web authentication
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign Permissions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.keys(groupedPermissions).length > 0 ? (
                                Object.entries(groupedPermissions).map(
                                    ([category, categoryPermissions]) => (
                                        <div
                                            key={category}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">
                                                    {category}
                                                </h3>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        selectAllInCategory(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    {categoryPermissions.every(
                                                        (p) =>
                                                            selectedPermissions.has(
                                                                p.id,
                                                            ),
                                                    )
                                                        ? 'Deselect All'
                                                        : 'Select All'}
                                                </Button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {categoryPermissions.map(
                                                    (permission) => (
                                                        <div
                                                            key={permission.id}
                                                            className="flex items-center gap-2 rounded-lg border p-3"
                                                        >
                                                            <Checkbox
                                                                id={`permission-${permission.id}`}
                                                                checked={selectedPermissions.has(
                                                                    permission.id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        permission.id,
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`permission-${permission.id}`}
                                                                className="flex-1 cursor-pointer text-sm"
                                                            >
                                                                {
                                                                    permission.name
                                                                }
                                                            </Label>
                                                            {selectedPermissions.has(
                                                                permission.id,
                                                            ) && (
                                                                <Check className="h-4 w-4 text-primary" />
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )
                            ) : (
                                <p className="text-center text-muted-foreground">
                                    No permissions available. Create permissions
                                    first.
                                </p>
                            )}
                            {errors.permissions && (
                                <p className="text-sm text-destructive">
                                    {errors.permissions}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    {selectedPermissions.size > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {selectedPermissions.size} permission(s)
                                    selected for this role
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
