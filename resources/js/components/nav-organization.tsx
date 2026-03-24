import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';

export function NavOrganization() {
    const { currentOrganization, auth } = usePage<SharedData>().props;
    const organizations = auth.user.organizations || [];

    const handleSelectOrganization = (organizationId: number) => {
        if (organizationId === currentOrganization?.id) {
            return;
        }

        router.post(
            `/organizations/${organizationId}/select`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleGoToSelectionPage = () => {
        router.visit('/organizations/select');
    };

    if (!currentOrganization) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group data-[state=open]:bg-sidebar-accent"
                        >
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {currentOrganization.name}
                                </span>
                                {currentOrganization.code && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {currentOrganization.code}
                                    </span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
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
                        {organizations.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => handleSelectOrganization(org.id)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {org.name}
                                    </div>
                                    {org.code && (
                                        <div className="text-xs text-muted-foreground">
                                            {org.code}
                                        </div>
                                    )}
                                </div>
                                {org.id === currentOrganization.id && (
                                    <Check className="size-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        {organizations.length > 3 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleGoToSelectionPage}
                                    className="gap-2"
                                >
                                    <Building2 className="size-4" />
                                    View all organizations
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
