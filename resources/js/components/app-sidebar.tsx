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
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    LayoutDashboard,
    Network,
    Search,
    PackageCheck,
} from 'lucide-react';
import type React from 'react';
import { useState, useEffect } from 'react';

const data = {
    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: 'Audit Universe',
            url: '/audit-universe',
            icon: Network,
            items: [
                { title: 'Overview', url: '/overview' },
                { title: 'Business Units', url: '/business-units' },
                { title: 'Macro Processes', url: '/macro-processes' },
                { title: 'Processes', url: '/processes' },
                { title: 'BPMN Diagrams', url: '/bpmn' },
            ],
        },
        {
            title: 'Risk Management',
            url: '/risks',
            icon: AlertTriangle,
            items: [
                { title: 'Risks', url: '/risks' },
                { title: 'Controls', url: '/controls' },
                /* { title: 'Predefined Tests', url: '/predefined-tests' }, */
            ],
        },
 /*        {
            title: 'Audit Management',
            url: '/audit-missions',
            icon: Briefcase,
            items: [
                { title: 'Planning', url: '/plannings' },
                { title: 'In Progress', url: '/audit-missions?status=in_progress' },
                { title: 'Follow-up', url: '/audit-missions?status=follow_up' },
                { title: 'Closed', url: '/audit-missions?status=closed' },
                { title: 'Documents', url: '/requested-documents' },
            ],
        }, */
        {
            title: 'Compliance Management',
            url: '/compliance-management',
            icon: PackageCheck,
            items: [
                { title: 'Frameworks', url: '/frameworks' },
                { title: 'Requirements', url: '/requirements' },
               
                //{ title: 'Predefined Tests', url: '/predefined-tests/requirement' },
                 { title: 'Requirement tests', url: '/req-testing' },
                { title: 'Validation', url: '/requirement-tests/validation' },
             { title: 'Gap Assessment', url: '/gap-assessment' },],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    const [searchOpen, setSearchOpen] = useState(false);
    const { state } = useSidebar();

    const [isRTL, setIsRTL] = useState(false);

    useEffect(() => {
        const checkDir = () => {
            setIsRTL(document.documentElement.dir === "rtl");
        };

        checkDir();

        const observer = new MutationObserver(checkDir);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

            <Sidebar
                collapsible="icon"
                className={`fixed top-0 h-screen ${isRTL ? "right-0 border-l" : "left-0 border-r"}`}
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
                            <NavMain items={data.navMain} />
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
