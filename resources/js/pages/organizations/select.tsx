import AppLogo from '@/components/app-logo';
import { Footer } from '@/components/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { SharedData, type Organization } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useEffect } from 'react';

interface SelectOrganizationProps {
    organizations: Organization[];
}

export default function SelectOrganization({
    organizations,
}: SelectOrganizationProps) {
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState('');
    const getInitials = useInitials();
    useEffect(() => {
        localStorage.removeItem('current_organization_id');
    }, []);
    const filteredOrganizations = organizations.filter(
        (org) =>
            org.name.toLowerCase().includes(search.toLowerCase()) ||
            org.code?.toLowerCase().includes(search.toLowerCase()) ||
            org.description?.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSelectOrganization = (organization: Organization) => {
        // Vérifier localStorage pour déterminer selected ou switched
        const previousOrg = localStorage.getItem('current_organization_id');
        const hasCurrentOrg = !!previousOrg;

        // Mettre à jour localStorage
        localStorage.setItem('current_organization_id', String(organization.id));

        router.post(`/organizations/${organization.id}/select`, {
            hasCurrentOrg, // true → Switched | false → Selected
        });
    };

    return (
        <>
            <Head title="Select Organization" />

            <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-6">
                    <AppLogo />
                    <nav className="hidden items-center gap-1 md:flex">
                        <Link
                            href="/admin-settings"
                            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <Settings className="h-4 w-4" />
                            Administration Settings
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                            >
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="flex justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 py-10">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="size-6 text-primary" />
                        </div>
                        <h1 className="mb-1.5 text-2xl font-bold tracking-tight">
                            Select Organization
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Choose an organization to continue
                        </p>
                    </div>

                    {/* Search */}
                    {organizations.length > 0 && (
                        <div className="mx-auto mb-6 max-w-md">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations by name, code, or description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Organizations Grid */}
                    {organizations.length === 0 ? (
                        <Card className="border-none shadow-none">
                            <CardContent className="py-16 text-center">
                                <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
                                    <Building2 className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    No Organizations Found
                                </h3>
                                <p className="text-muted-foreground">
                                    You don't belong to any organizations yet.
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Please contact your administrator to get access.
                                </p>
                            </CardContent>
                        </Card>
                    ) : filteredOrganizations.length === 0 ? (
                        <Card className="border-none shadow-none">
                            <CardContent className="py-16 text-center">
                                <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
                                    <Search className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    No Organizations Found
                                </h3>
                                <p className="text-muted-foreground">
                                    No organizations match your search criteria.
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try adjusting your search terms.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {filteredOrganizations.map((organization) => (
                                <Card
                                    key={organization.id}
                                    className="group relative cursor-pointer gap-0 overflow-hidden p-0 shadow-none transition-all hover:border-primary hover:shadow-md hover:shadow-primary/10"
                                    onClick={() =>
                                        handleSelectOrganization(organization)
                                    }
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/15">
                                                <Building2 className="size-4.5 text-primary" />
                                            </div>
                                            {organization.code && (
                                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    {organization.code}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <h3 className="mb-1 line-clamp-2 text-sm leading-tight font-semibold transition-colors group-hover:text-primary">
                                                {organization.name}
                                            </h3>
                                            {organization.description && (
                                                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                                    {organization.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                                            <span>Select</span>
                                            <span className="ml-1 transition-transform group-hover:translate-x-0.5">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Footer count */}
                    {organizations.length > 0 && (
                        <div className="mt-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                {search && filteredOrganizations.length > 0 ? (
                                    <>
                                        Showing {filteredOrganizations.length}{' '}
                                        of {organizations.length}{' '}
                                        {organizations.length === 1
                                            ? 'organization'
                                            : 'organizations'}
                                    </>
                                ) : (
                                    <>
                                        {organizations.length}{' '}
                                        {organizations.length === 1
                                            ? 'organization'
                                            : 'organizations'}{' '}
                                        available
                                    </>
                                )}
                            </p>
                        </div>
                    )}
                    <Footer />
                </div>
            </div>
        </>
    );
}