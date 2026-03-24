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
import { Organization } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Edit,
    Shield,
    Trash2,
    User,
    UserPlus,
    Users,
} from 'lucide-react';

interface OrganizationShowProps {
    organization: Organization;
}

export default function OrganizationShow({
    organization,
}: OrganizationShowProps) {
    const handleDelete = () => {
        router.delete(`/organizations/${organization.id}`, {
            onBefore: () =>
                confirm(
                    'Are you sure you want to delete this organization? This action cannot be undone and will delete all related data.',
                ),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Organizations', href: '/organizations' },
                { title: organization.name, href: '' },
            ]}
        >
            <Head title={organization.name} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-1">
                        <h1 className="text-xl font-semibold md:text-2xl">
                            {organization.name}
                        </h1>
                        {organization.description && (
                            <p className="text-sm text-muted-foreground">
                                {organization.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 md:flex-none"
                        >
                            <Link
                                href={`/organizations/${organization.id}/edit`}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1 md:flex-none"
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
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete{' '}
                                        <strong>{organization.name}</strong> and
                                        all related data including:
                                        <ul className="mt-2 list-inside list-disc space-y-1">
                                            <li>
                                                {organization.business_units_count ||
                                                    0}{' '}
                                                Business Units
                                            </li>
                                            <li>
                                                {organization.risks_count || 0}{' '}
                                                Risks
                                            </li>
                                            <li>
                                                {organization.controls_count ||
                                                    0}{' '}
                                                Controls
                                            </li>
                                            <li>
                                                All associated processes and
                                                audit missions
                                            </li>
                                        </ul>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete Organization
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Users</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {organization.users_count || 0}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Risks</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {organization.risks_count || 0}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3 sm:col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Controls</span>
                        </div>
                        <p className="mt-1 text-xl font-semibold md:text-2xl">
                            {organization.controls_count || 0}
                        </p>
                    </div>
                </div>

                {/* Users */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold">Users</h2>
                        <Button size="sm" className="w-full sm:w-auto">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>

                    {organization.users && organization.users.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden rounded-lg border md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Roles</TableHead>
                                            <TableHead className="w-[100px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {organization.users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                            <span className="text-xs font-medium">
                                                                {user.name
                                                                    .split(' ')
                                                                    .map(
                                                                        (n) =>
                                                                            n[0],
                                                                    )
                                                                    .join('')
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span>{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    {user.organization_roles &&
                                                    user.organization_roles
                                                        .length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.organization_roles.map(
                                                                (role) => (
                                                                    <Badge
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            No Role
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    `Remove ${user.name} from this organization?`,
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    `/organizations/${organization.id}/users/${user.id}`,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="space-y-3 md:hidden">
                                {organization.users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <span className="text-sm font-medium">
                                                    {user.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div>
                                                    <p className="font-medium">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.organization_roles &&
                                                    user.organization_roles
                                                        .length > 0 ? (
                                                        user.organization_roles.map(
                                                            (role) => (
                                                                <Badge
                                                                    key={
                                                                        role.id
                                                                    }
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {role.name}
                                                                </Badge>
                                                            ),
                                                        )
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            No Role
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Remove ${user.name} from this organization?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/organizations/${organization.id}/users/${user.id}`,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center md:p-12">
                            <User className="mx-auto h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                            <h3 className="mt-4 text-base font-semibold md:text-lg">
                                No users yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by adding your first user.
                            </p>
                            <Button className="mt-4" size="sm">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
