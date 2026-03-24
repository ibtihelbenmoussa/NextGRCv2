import { StatCard } from '@/components/entity-card';
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
import AppLayout from '@/layouts/app-layout';
import { User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    CheckCircle2,
    Edit,
    Mail,
    Shield,
    Trash2,
    XCircle,
} from 'lucide-react';

interface UserShowProps {
    user: User;
}

export default function UserShow({ user }: UserShowProps) {
    const handleDelete = () => {
        router.delete(`/users/${user.id}`, {
            onBefore: () =>
                confirm(
                    'Are you sure you want to delete this user? This action cannot be undone.',
                ),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Users', href: '/users' },
                { title: user.name, href: '' },
            ]}
        >
            <Head title={user.name} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-2xl font-bold">
                                {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {user.name}
                            </h1>
                            <p className="text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/users/${user.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
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
                                        <strong>{user.name}</strong> and remove
                                        them from all organizations and
                                        assignments.
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
                                        Delete User
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Organizations"
                        value={user.organizations?.length || 0}
                        icon={<Building2 className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Account Status"
                        value={user.email_verified_at ? 'Verified' : 'Pending'}
                        icon={
                            user.email_verified_at ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-yellow-500" />
                            )
                        }
                    />
                    <StatCard
                        title="2FA Status"
                        value={user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        icon={<Shield className="h-4 w-4" />}
                    />
                </div>

                {/* User Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <div className="space-y-4 rounded-lg border p-6">
                        <h2 className="text-xl font-semibold">
                            Basic Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Email
                                    </p>
                                    <p>{user.email}</p>
                                </div>
                            </div>
                            {user.job_title && (
                                <div className="flex items-start gap-3">
                                    <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Job Title
                                        </p>
                                        <p>{user.job_title}</p>
                                    </div>
                                </div>
                            )}
                            {user.department && (
                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Department
                                        </p>
                                        <p>{user.department}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4 rounded-lg border p-6">
                        <h2 className="text-xl font-semibold">
                            Account Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Created At
                                </p>
                                <p>
                                    {new Date(
                                        user.created_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Last Updated
                                </p>
                                <p>
                                    {new Date(
                                        user.updated_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            {user.email_verified_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Email Verified At
                                    </p>
                                    <p>
                                        {new Date(
                                            user.email_verified_at,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Organizations */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">
                            Organizations & Roles
                        </h2>
                    </div>

                    <div className="rounded-lg border">
                        {user.organizations && user.organizations.length > 0 ? (
                            <div className="divide-y">
                                {user.organizations.map((org) => (
                                    <div
                                        key={org.id}
                                        className="flex items-center justify-between p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {org.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {org.code}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                {org.pivot?.role
                                                    ? org.pivot.role
                                                          .split('_')
                                                          .map(
                                                              (word) =>
                                                                  word
                                                                      .charAt(0)
                                                                      .toUpperCase() +
                                                                  word.slice(1),
                                                          )
                                                          .join(' ')
                                                    : 'User'}
                                            </Badge>
                                            {user.current_organization_id ===
                                                org.id && (
                                                <Badge>Current</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-8 text-center text-muted-foreground">
                                User is not assigned to any organizations yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
