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
import { Head, Link } from '@inertiajs/react';
import { Plus, Search, Shield, Users } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions_count?: number;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

interface RolesIndexProps {
    roles: Role[];
    stats: {
        total: number;
        withPermissions: number;
        assignedUsers: number;
    };
}

export default function RolesIndex({ roles, stats }: RolesIndexProps) {
    const [search, setSearch] = useState('');

    const filteredRoles = roles.filter((role) =>
        role.name.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <AdminSettingsLayout title="Roles & Permissions">
            <Head title="Roles" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Roles & Permissions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage roles and assign permissions across all
                            organizations
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/roles/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Roles */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Roles
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* With Permissions */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    With Permissions
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.withPermissions}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (stats.withPermissions /
                                                    stats.total) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Assigned Users */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Assigned Users
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.assignedUsers}
                                </p>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search roles by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Roles Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Guard</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRoles.length > 0 ? (
                                filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {role.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {role.guard_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge>
                                                {role.permissions_count || 0}{' '}
                                                permissions
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {role.users_count || 0} users
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/roles/${role.id}`}
                                                    >
                                                        View
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/roles/${role.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center"
                                    >
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminSettingsLayout>
    );
}
