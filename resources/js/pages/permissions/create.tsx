import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Key } from 'lucide-react';

export default function CreatePermission() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        guard_name: 'web',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/permissions');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Permissions', href: '/permissions' },
                { title: 'Create Permission', href: '/permissions/create' },
            ]}
        >
            <Head title="Create Permission" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Permission
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new permission to your organization
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/permissions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Permission Details</CardTitle>
                                <CardDescription>
                                    Enter the permission name using dot notation
                                    (e.g., users.create, reports.view)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Permission Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="e.g., users.create"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Use dot notation to categorize
                                            permissions. The first part will be
                                            used as the category (e.g.,
                                            "users.create" will be in the
                                            "Users" category).
                                        </p>
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
                                        <p className="text-sm text-muted-foreground">
                                            The guard name for this permission
                                            (usually "web").
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create Permission
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href="/permissions">
                                                Cancel
                                            </Link>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    <CardTitle>Permission Naming</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <p className="font-medium">
                                        Naming Convention
                                    </p>
                                    <p className="text-muted-foreground">
                                        Use dot notation with format:
                                        resource.action
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Examples</p>
                                    <ul className="mt-2 space-y-1 text-muted-foreground">
                                        <li>• users.view</li>
                                        <li>• users.create</li>
                                        <li>• users.edit</li>
                                        <li>• users.delete</li>
                                        <li>• reports.view</li>
                                        <li>• audits.manage</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Auto Categorization
                                    </p>
                                    <p className="text-muted-foreground">
                                        Permissions are automatically grouped by
                                        the first part of the name (before the
                                        dot).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
