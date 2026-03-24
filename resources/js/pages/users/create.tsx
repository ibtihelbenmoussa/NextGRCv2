import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Organization, Role } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Briefcase, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';

interface UserCreateProps {
    organizations: Organization[];
    rolesByOrganization: Record<number, Role[]>;
}

export default function UserCreate({
    organizations,
    rolesByOrganization,
}: UserCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        job_title: '',
        department: '',
        organization_roles: [] as {
            organization_id: number;
            role_ids: number[];
        }[],
    });

    const [selectedOrganizations, setSelectedOrganizations] = useState<
        Set<number>
    >(new Set());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users');
    };

    const toggleOrganization = (orgId: number) => {
        const newSet = new Set(selectedOrganizations);
        if (newSet.has(orgId)) {
            newSet.delete(orgId);
            setData(
                'organization_roles',
                data.organization_roles.filter(
                    (or) => or.organization_id !== orgId,
                ),
            );
        } else {
            newSet.add(orgId);
            setData('organization_roles', [
                ...data.organization_roles,
                { organization_id: orgId, role_ids: [] },
            ]);
        }
        setSelectedOrganizations(newSet);
    };

    const toggleOrganizationRole = (orgId: number, roleId: number) => {
        setData(
            'organization_roles',
            data.organization_roles.map((or) => {
                if (or.organization_id === orgId) {
                    const roleIds = [...or.role_ids];
                    const index = roleIds.indexOf(roleId);
                    if (index > -1) {
                        roleIds.splice(index, 1);
                    } else {
                        roleIds.push(roleId);
                    }
                    return { ...or, role_ids: roleIds };
                }
                return or;
            }),
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Users', href: '/users' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create User" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Create User
                    </h1>
                    <p className="text-muted-foreground">
                        Add a new user to the system
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 p-4">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Full Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="John Doe"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email Address{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="john.doe@company.com"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Job Title */}
                            <div className="space-y-2">
                                <Label htmlFor="job_title">Job Title</Label>
                                <div className="relative">
                                    <Briefcase className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="job_title"
                                        value={data.job_title}
                                        onChange={(e) =>
                                            setData('job_title', e.target.value)
                                        }
                                        placeholder="Risk Manager"
                                        className="pl-10"
                                    />
                                </div>
                                {errors.job_title && (
                                    <p className="text-sm text-destructive">
                                        {errors.job_title}
                                    </p>
                                )}
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={data.department}
                                    onChange={(e) =>
                                        setData('department', e.target.value)
                                    }
                                    placeholder="Risk Management"
                                />
                                {errors.department && (
                                    <p className="text-sm text-destructive">
                                        {errors.department}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="••••••••"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm Password{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Access & Roles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {organizations.length > 0 ? (
                                organizations.map((org) => {
                                    const orgRoles =
                                        data.organization_roles.find(
                                            (or) =>
                                                or.organization_id === org.id,
                                        );
                                    const isSelected =
                                        selectedOrganizations.has(org.id);

                                    return (
                                        <div
                                            key={org.id}
                                            className="space-y-3 rounded-lg border p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`org-${org.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleOrganization(
                                                            org.id,
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <Label
                                                        htmlFor={`org-${org.id}`}
                                                        className="cursor-pointer font-medium"
                                                    >
                                                        {org.name}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {org.code}
                                                    </p>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="ml-7 space-y-2">
                                                    <Label className="text-sm font-medium">
                                                        Select Roles:
                                                    </Label>
                                                    {rolesByOrganization[
                                                        org.id
                                                    ] &&
                                                    rolesByOrganization[org.id]
                                                        .length > 0 ? (
                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                            {rolesByOrganization[
                                                                org.id
                                                            ].map((role) => (
                                                                <div
                                                                    key={
                                                                        role.id
                                                                    }
                                                                    className="flex items-center space-x-2"
                                                                >
                                                                    <Checkbox
                                                                        id={`role-${org.id}-${role.id}`}
                                                                        checked={
                                                                            orgRoles?.role_ids.includes(
                                                                                role.id,
                                                                            ) ||
                                                                            false
                                                                        }
                                                                        onCheckedChange={() =>
                                                                            toggleOrganizationRole(
                                                                                org.id,
                                                                                role.id,
                                                                            )
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`role-${org.id}-${role.id}`}
                                                                        className="cursor-pointer text-sm font-normal"
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            No roles available
                                                            for this
                                                            organization
                                                        </p>
                                                    )}
                                                    {errors[
                                                        `organization_roles.${data.organization_roles.findIndex((or) => or.organization_id === org.id)}.role_ids`
                                                    ] && (
                                                        <p className="text-sm text-destructive">
                                                            Please select at
                                                            least one role
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-muted-foreground">
                                    No organizations available
                                </p>
                            )}
                            {errors.organization_roles && (
                                <p className="text-sm text-destructive">
                                    {errors.organization_roles}
                                </p>
                            )}
                        </CardContent>
                    </Card>

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
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
