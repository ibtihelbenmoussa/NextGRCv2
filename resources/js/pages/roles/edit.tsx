import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Key, Shield } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    category: string;
}

interface Role {
    id: number;
    name: string;
    guard_name: string;
    organization_id: number;
    permissions: Permission[];
}

interface EditRoleProps {
    role: Role;
    permissions: Permission[];
}

export default function EditRole({ role, permissions }: EditRoleProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        guard_name: role.guard_name,
        permissions: role.permissions.map((p) => p.id),
    });

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

    const handlePermissionToggle = (permissionId: number) => {
        const newPermissions = [...data.permissions];
        const index = newPermissions.indexOf(permissionId);
        if (index > -1) {
            newPermissions.splice(index, 1);
        } else {
            newPermissions.push(permissionId);
        }
        setData('permissions', newPermissions);
    };

    const handleSelectAllCategory = (categoryPermissions: Permission[]) => {
        const categoryIds = categoryPermissions.map((p) => p.id);
        const allSelected = categoryIds.every((id) =>
            data.permissions.includes(id),
        );

        let newPermissions = [...data.permissions];
        if (allSelected) {
            newPermissions = newPermissions.filter(
                (id) => !categoryIds.includes(id),
            );
        } else {
            categoryIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
        }
        setData('permissions', newPermissions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles/${role.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Roles', href: '/roles' },
                { title: role.name, href: `/roles/${role.id}` },
                { title: 'Edit', href: `/roles/${role.id}/edit` },
            ]}
        >
            <Head title={`Edit ${role.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Role
                        </h1>
                        <p className="text-muted-foreground">
                            Update role details and permissions
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/roles/${role.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Form */}
                        <div className="space-y-6 md:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Role Information</CardTitle>
                                    <CardDescription>
                                        Update the basic role details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Role Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="e.g., Admin"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="guard_name">
                                            Guard Name
                                        </Label>
                                        <Input
                                            id="guard_name"
                                            value={data.guard_name}
                                            onChange={(e) =>
                                                setData(
                                                    'guard_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="web"
                                            required
                                        />
                                        {errors.guard_name && (
                                            <p className="text-sm text-destructive">
                                                {errors.guard_name}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Permissions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>
                                        Select permissions for this role
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {Object.entries(groupedPermissions).length >
                                    0 ? (
                                        <div className="space-y-6">
                                            {Object.entries(
                                                groupedPermissions,
                                            ).map(
                                                ([
                                                    category,
                                                    categoryPermissions,
                                                ]) => (
                                                    <div key={category}>
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <h3 className="text-sm font-semibold">
                                                                {category}
                                                            </h3>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleSelectAllCategory(
                                                                        categoryPermissions,
                                                                    )
                                                                }
                                                            >
                                                                {categoryPermissions.every(
                                                                    (p) =>
                                                                        data.permissions.includes(
                                                                            p.id,
                                                                        ),
                                                                )
                                                                    ? 'Deselect All'
                                                                    : 'Select All'}
                                                            </Button>
                                                        </div>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {categoryPermissions.map(
                                                                (
                                                                    permission,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            permission.id
                                                                        }
                                                                        className="flex items-center space-x-2"
                                                                    >
                                                                        <Checkbox
                                                                            id={`permission-${permission.id}`}
                                                                            checked={data.permissions.includes(
                                                                                permission.id,
                                                                            )}
                                                                            onCheckedChange={() =>
                                                                                handlePermissionToggle(
                                                                                    permission.id,
                                                                                )
                                                                            }
                                                                        />
                                                                        <Label
                                                                            htmlFor={`permission-${permission.id}`}
                                                                            className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                                                                        >
                                                                            <Key className="h-3 w-3 text-muted-foreground" />
                                                                            {
                                                                                permission.name
                                                                            }
                                                                        </Label>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-center text-sm text-muted-foreground">
                                            No permissions available. Create
                                            permissions first.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>
                                    Update Role
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={`/roles/${role.id}`}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        <CardTitle>Summary</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">
                                            Selected Permissions
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {data.permissions.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            Available Permissions
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {permissions.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            Categories
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {
                                                Object.keys(groupedPermissions)
                                                    .length
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
