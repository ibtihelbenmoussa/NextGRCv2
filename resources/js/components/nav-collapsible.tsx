import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface NavGroupItem {
    title: string;
    items: NavItem[];
    icon?: React.ComponentType;
}

export function NavCollapsible({ groups = [] }: { groups: NavGroupItem[] }) {
    const page = usePage();

    return (
        <>
            {groups.map((group) => (
                <Collapsible
                    key={group.title}
                    asChild
                    defaultOpen
                    className="group/collapsible"
                >
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                {group.icon && <group.icon />}
                                <span className="pl-2">{group.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={page.url.startsWith(
                                                typeof item.href === 'string'
                                                    ? item.href
                                                    : item.href.url,
                                            )}
                                            tooltip={{ children: item.title }}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            ))}
        </>
    );
}
