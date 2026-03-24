import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminSettingsLayout from '@/layouts/admin-settings/layout';
import { Head, Link, router } from '@inertiajs/react';
import { Key, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    category: string;
    roles_count?: number;
    created_at: string;
    updated_at: string;
}

interface PermissionsIndexProps {
    permissions: Permission[];
    stats: {
        total: number;
        categories: number;
        assigned: number;
    };
}

export default function PermissionsIndex({
    permissions,
    stats,
}: PermissionsIndexProps) {
    const [search, setSearch] = useState('');

    const filteredPermissions = permissions.filter((permission) =>
        permission.name.toLowerCase().includes(search.toLowerCase()),
    );

    // Group by category
    const groupedPermissions = filteredPermissions.reduce(
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

    const handleDelete = (permissionId: number, permissionName: string) => {
        if (
            confirm(
                `Are you sure you want to delete the "${permissionName}" permission? This action cannot be undone.`,
            )
        ) {
            router.delete(`/permissions/${permissionId}`);
        }
    };

    return (
        <AdminSettingsLayout title="Permissions">
            <Head title="Permissions" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Permissions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage permissions for your organization
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/permissions/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Permission
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Permissions */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Permissions
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <Key className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Categories
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.categories}
                                </p>
                            </div>
                            <Key className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Assigned to Roles */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Assigned to Roles
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.assigned}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (stats.assigned / stats.total) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Key className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search permissions by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Permissions by Category */}
                <div className="space-y-6 p-4">
                    {Object.entries(groupedPermissions).map(
                        ([category, categoryPermissions]) => (
                            <div key={category} className="space-y-3">
                                <h2 className="text-xl font-semibold">
                                    {category}
                                </h2>
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Permission Name
                                                </TableHead>
                                                <TableHead>Guard</TableHead>
                                                <TableHead>
                                                    Assigned Roles
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categoryPermissions.map(
                                                (permission) => (
                                                    <TableRow
                                                        key={permission.id}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    {
                                                                        permission.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {
                                                                    permission.guard_name
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {permission.roles_count ||
                                                                0}{' '}
                                                            roles
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        permission.id,
                                                                        permission.name,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ),
                    )}
                    {Object.keys(groupedPermissions).length === 0 && (
                        <p className="text-center text-muted-foreground">
                            No permissions found.
                        </p>
                    )}
                </div>
            </div>
        </AdminSettingsLayout>
    );
}
