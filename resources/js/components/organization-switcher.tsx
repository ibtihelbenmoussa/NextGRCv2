import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type Organization, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';

export function OrganizationSwitcher() {
    const { auth, currentOrganization } = usePage<SharedData>().props;
    const user = auth.user;
    const [search, setSearch] = useState('');

    if (!user || !user.organizations || user.organizations.length === 0) {
        return null;
    }

    const handleSelectOrganization = (organization: Organization) => {
        if (organization.id === currentOrganization?.id) {
            return;
        }
        localStorage.setItem('current_organization_id', String(organization.id));

        router.post(
            `/organizations/${organization.id}/select`,
            { hasCurrentOrg: true},
            {
                preserveScroll: true,
            },
        );

        router.flushAll();
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="dark:bg-sidebar-primary-dark dark:text-sidebar-primary-foreground-dark flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {currentOrganization?.name ||
                                        'Select Organization'}
                                </span>
                                <span className="truncate text-xs">
                                    {currentOrganization?.code ||
                                        'No org selected'}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Organizations
                        </DropdownMenuLabel>
                        <div className="px-2 pb-2">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations..."
                                    className="h-9 pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {user.organizations
                                .filter(
                                    (org) =>
                                        org.name
                                            .toLowerCase()
                                            .includes(search.toLowerCase()) ||
                                        org.code
                                            ?.toLowerCase()
                                            .includes(search.toLowerCase()),
                                )
                                .map((organization) => (
                                    <DropdownMenuItem
                                        key={organization.id}
                                        onClick={() =>
                                            handleSelectOrganization(
                                                organization,
                                            )
                                        }
                                        className="gap-2 p-2"
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-sm border">
                                            <Building2 className="size-4 shrink-0" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {organization.name}
                                            </div>
                                            {organization.code && (
                                                <div className="text-xs text-muted-foreground">
                                                    {organization.code}
                                                </div>
                                            )}
                                        </div>
                                        {currentOrganization?.id ===
                                            organization.id && (
                                                <Check className="ml-auto size-4" />
                                            )}
                                    </DropdownMenuItem>
                                ))}
                            {user.organizations.filter(
                                (org) =>
                                    org.name
                                        .toLowerCase()
                                        .includes(search.toLowerCase()) ||
                                    org.code
                                        ?.toLowerCase()
                                        .includes(search.toLowerCase()),
                            ).length === 0 && (
                                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                        No organizations found
                                    </div>
                                )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                asChild
                            >
                                <a href="/organizations/select">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    View All Organizations
                                </a>
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
