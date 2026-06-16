import AppLogo from '@/components/app-logo';
import { GlobalSearch } from '@/components/global-search';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCan } from '@/hooks/use-can';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, Network, PackageCheck, Search } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    title: string;
    url: string;
}

interface NavGroup {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: NavItem[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [searchOpen, setSearchOpen] = useState(false);
    const { state } = useSidebar();
    const [isRTL, setIsRTL] = useState(false);
    const { can } = useCan();

    useEffect(() => {
        const checkDir = () => setIsRTL(document.documentElement.dir === 'rtl');
        checkDir();
        const observer = new MutationObserver(checkDir);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
        return () => observer.disconnect();
    }, []);

    const masterDataItems = [
        can('overview.view')        && { title: 'Overview',        url: '/overview' },
        can('business-units.view')  && { title: 'Business Units',  url: '/business-units' },
        can('macro-processes.view') && { title: 'Macro Processes', url: '/macro-processes' },
        can('processes.view')       && { title: 'Processes',       url: '/processes' },
        can('bpmn.view')            && { title: 'BPMN Diagrams',   url: '/bpmn' },
    ].filter(Boolean) as NavItem[];

    const complianceItems = [
        can('frameworks.view')      && { title: 'Frameworks',        url: '/frameworks' },
        can('requirements.view')    && { title: 'Requirements',      url: '/requirements' },
        can('tests.view')           && { title: 'Requirement Tests', url: '/req-testing' },
        can('tests.review')         && { title: 'Validation',        url: '/requirement-tests/validation' },
        can('gap-assessments.view') && { title: 'Gap Assessment',    url: '/gap-assessment' },
        can('action-plans.view')    && { title: 'Action Plans',      url: '/action-plans' },
    ].filter(Boolean) as NavItem[];

    const adminItems = [
        can('users.view')         && { title: 'Users',               url: '/users' },
        can('roles.view')         && { title: 'Roles & Permissions',  url: '/roles' },
        can('organizations.view') && { title: 'Organizations',        url: '/organizations' },
    ].filter(Boolean) as NavItem[];

    const navMain: NavGroup[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            isActive: true,
        },
        ...(masterDataItems.length > 0 ? [{
            title: 'Master Data',
            url: '/audit-universe',
            icon: Network,
            items: masterDataItems,
        }] : []),
        ...(complianceItems.length > 0 ? [{
            title: 'Compliance Management',
            url: '/compliance-management',
            icon: PackageCheck,
            items: complianceItems,
        }] : []),
        ...(adminItems.length > 0 ? [{
            title: 'Administration',
            url: '/admin',
            icon: PackageCheck,
            items: adminItems,
        }] : []),
    ];

    return (
        <>
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Sidebar
                collapsible="icon"
                className={`fixed top-0 h-screen ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
                {...props}
            >
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/dashboard" prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <OrganizationSwitcher />
                    {state === 'expanded' && (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => setSearchOpen(true)}
                                    className="group/search w-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-rose-500/50 hover:bg-white/10"
                                    tooltip="Search (Ctrl+K)"
                                >
                                    <Search className="mr-2 size-4 text-rose-400 transition-colors group-hover/search:text-rose-300" />
                                    <span className="flex-1 text-left text-white/60 transition-colors group-hover/search:text-white/80">
                                        Search...
                                    </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )}
                </SidebarHeader>
                <SidebarContent className="overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2 p-2">
                            <NavMain items={navMain} />
                        </div>
                    </ScrollArea>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
        </>
    );
}