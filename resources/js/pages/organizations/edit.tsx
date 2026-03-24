import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Organization } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

interface OrganizationEditProps {
    organization: Organization;
}

export default function OrganizationEdit({
    organization,
}: OrganizationEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: organization.name,
        code: organization.code,
        description: organization.description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        is_active: organization.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/organizations/${organization.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Organizations', href: '/organizations' },
                {
                    title: organization.name,
                    href: `/organizations/${organization.id}`,
                },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit ${organization.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit Organization
                    </h1>
                    <p className="text-muted-foreground">
                        Update organization details
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="ACME Corporation"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Code */}
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="ACME"
                                    maxLength={50}
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Brief description of the organization"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="contact@organization.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="+1-555-0100"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    placeholder="123 Business Street, City, State, ZIP"
                                    rows={2}
                                />
                                {errors.address && (
                                    <p className="text-sm text-destructive">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
