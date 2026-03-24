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
import { User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    FileSpreadsheet,
    Mail,
    Plus,
    Search,
    UserCircle,
} from 'lucide-react';
import { useState } from 'react';

interface UsersIndexProps {
    users: User[];
    stats: {
        total: number;
        active: number;
        admins: number;
    };
}

export default function UsersIndex({ users, stats }: UsersIndexProps) {
    const [search, setSearch] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    // Handle export functionality
    const handleExport = async () => {
        setExportLoading(true);

        try {
            // Get current search term
            const params = new URLSearchParams();
            if (search) {
                params.set('search', search);
            }

            // Make request to export endpoint
            const response = await fetch(`/users/export?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                // Create blob and download file
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `users-${new Date().toISOString().split('T')[0]}.xlsx`;
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

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <AdminSettingsLayout title="Users">
            <Head title="Users" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Users
                        </h1>
                        <p className="text-muted-foreground">
                            Manage system users and their access
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            {exportLoading ? 'Exporting...' : 'Export Excel'}
                        </Button>
                        <Button asChild>
                            <Link href="/users/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                    {/* Total Users */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Users
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total}
                                </p>
                            </div>
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Active Users
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.active}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (stats.active / stats.total) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Administrators */}
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Administrators
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stats.admins}
                                    </p>
                                    {stats.total > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (stats.admins / stats.total) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Organizations</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <span className="text-sm font-medium">
                                                        {user.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {user.name}
                                                    </p>
                                                    {user.job_title && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.job_title}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.organizations &&
                                                user.organizations.length >
                                                    0 ? (
                                                    user.organizations
                                                        .slice(0, 2)
                                                        .map((org) => (
                                                            <Badge
                                                                key={org.id}
                                                                variant="secondary"
                                                            >
                                                                {org.code}
                                                            </Badge>
                                                        ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        None
                                                    </span>
                                                )}
                                                {user.organizations &&
                                                    user.organizations.length >
                                                        2 && (
                                                        <Badge variant="secondary">
                                                            +
                                                            {user.organizations
                                                                .length - 2}
                                                        </Badge>
                                                    )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.email_verified_at ? (
                                                <Badge variant="default">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                asChild
                                            >
                                                <Link
                                                    href={`/users/${user.id}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center"
                                    >
                                        No users found.
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
