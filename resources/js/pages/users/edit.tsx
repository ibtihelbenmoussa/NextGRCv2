import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Organization, User } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Briefcase, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

interface UserEditProps {
    user: User;
    organizations: Organization[];
}

export default function UserEdit({ user, organizations }: UserEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        job_title: user.job_title || '',
        department: user.department || '',
        organization_roles: (user.organizations || []).map((org) => ({
            organization_id: org.id,
            role: org.pivot?.role || 'user',
        })),
    });

    const [selectedOrganizations, setSelectedOrganizations] = useState<
        Set<number>
    >(new Set((user.organizations || []).map((org) => org.id)));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
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
                { organization_id: orgId, role: 'user' },
            ]);
        }
        setSelectedOrganizations(newSet);
    };

    const updateOrganizationRole = (orgId: number, role: string) => {
        setData(
            'organization_roles',
            data.organization_roles.map((or) =>
                or.organization_id === orgId ? { ...or, role } : or,
            ),
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Users', href: '/users' },
                { title: user.name, href: `/users/${user.id}` },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit ${user.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit User
                    </h1>
                    <p className="text-muted-foreground">
                        Update user information and organization access
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 p-4">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
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

                    {/* Change Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Leave blank to keep the current password
                            </p>
                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="••••••••"
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
                                    Confirm New Password
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
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {organizations.length > 0 ? (
                                organizations.map((org) => (
                                    <div
                                        key={org.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`org-${org.id}`}
                                                checked={selectedOrganizations.has(
                                                    org.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleOrganization(org.id)
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
                                        {selectedOrganizations.has(org.id) && (
                                            <Select
                                                value={
                                                    data.organization_roles.find(
                                                        (or) =>
                                                            or.organization_id ===
                                                            org.id,
                                                    )?.role || 'user'
                                                }
                                                onValueChange={(value) =>
                                                    updateOrganizationRole(
                                                        org.id,
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">
                                                        Admin
                                                    </SelectItem>
                                                    <SelectItem value="audit_chief">
                                                        Audit Chief
                                                    </SelectItem>
                                                    <SelectItem value="auditor">
                                                        Auditor
                                                    </SelectItem>
                                                    <SelectItem value="user">
                                                        User
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                ))
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
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
