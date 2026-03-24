import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Key, Trash2, Users } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    category?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
    guard_name: string;
    organization_id: number;
    permissions: Permission[];
    users: User[];
    created_at: string;
    updated_at: string;
}

interface RoleShowProps {
    role: Role;
}

export default function ShowRole({ role }: RoleShowProps) {
    // Group permissions by category
    const groupedPermissions = role.permissions.reduce(
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

    const handleDelete = () => {
        router.delete(`/roles/${role.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Roles', href: '/roles' },
                { title: role.name, href: `/roles/${role.id}` },
            ]}
        >
            <Head title={role.name} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold md:text-2xl">
                                {role.name}
                            </h1>
                            <Badge variant="secondary">{role.guard_name}</Badge>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none"
                        >
                            <Link href="/roles">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none"
                        >
                            <Link href={`/roles/${role.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1 sm:flex-none"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Delete
                                    </span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the "
                                        {role.name}" role and remove it from all
                                        users. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>
                                        Delete Role
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Key className="h-4 w-4" />
                            <span>Permissions</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {role.permissions.length}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Users</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {role.users.length}
                        </p>
                    </div>
                </div>

                {/* Permissions by Category */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Permissions</h2>
                    {role.permissions.length > 0 ? (
                        <div className="space-y-4 rounded-lg border p-4">
                            {Object.entries(groupedPermissions).map(
                                ([category, categoryPermissions]) => (
                                    <div key={category}>
                                        <h3 className="mb-2 text-sm font-semibold">
                                            {category}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryPermissions.map(
                                                (permission) => (
                                                    <Badge
                                                        key={permission.id}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        <Key className="mr-1 h-3 w-3" />
                                                        {permission.name}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                            <Key className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                            <h3 className="mt-4 text-base font-semibold md:text-lg">
                                No permissions yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                No permissions assigned to this role.
                            </p>
                        </div>
                    )}
                </div>

                {/* Users with this role */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                        Users with this Role
                    </h2>
                    {role.users.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden rounded-lg border md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {role.users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {user.email}
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
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="space-y-3 md:hidden">
                                {role.users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                            <Users className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                            <h3 className="mt-4 text-base font-semibold md:text-lg">
                                No users yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                No users assigned to this role yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
