import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavMainItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
}

export function NavMain({ items }: { items: NavMainItem[] }) {
    const page = usePage();
    const { state } = useSidebar();

    // Track which collapsibles are open
    const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        items.forEach((item) => {
            if (item.items && item.items.length > 0) {
                const hasActiveSubItem = item.items.some((subItem) =>
                    page.url.startsWith(subItem.url),
                );
                initial[item.title] = item.isActive || hasActiveSubItem;
            }
        });
        return initial;
    });

    // Update open state when URL changes to keep active items open
    useEffect(() => {
        setOpenItems((prev) => {
            const newOpenItems = { ...prev };
            items.forEach((item) => {
                if (item.items && item.items.length > 0) {
                    const hasActiveSubItem = item.items.some((subItem) =>
                        page.url.startsWith(subItem.url),
                    );
                    if (hasActiveSubItem) {
                        newOpenItems[item.title] = true;
                    }
                }
            });
            return newOpenItems;
        });
    }, [page.url, items]);

    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => {
                    const isCollapsed = state === 'collapsed';
                    const hasSubItems = item.items && item.items.length > 0;

                    // If collapsed and has sub-items, use dropdown menu
                    if (isCollapsed && hasSubItems) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            isActive={page.url.startsWith(
                                                item.url,
                                            )}
                                            tooltip={item.title}
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="right"
                                        align="start"
                                        className="min-w-56"
                                    >
                                        {item.items?.map((subItem) => (
                                            <DropdownMenuItem
                                                key={subItem.title}
                                                asChild
                                            >
                                                <Link
                                                    href={subItem.url}
                                                    prefetch
                                                    className="cursor-pointer"
                                                >
                                                    {subItem.title}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        );
                    }

                    // If item has no sub-items, render as a simple link
                    if (!hasSubItems) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={page.url.startsWith(item.url)}
                                >
                                    <Link href={item.url} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    // Otherwise, use regular collapsible
                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            open={openItems[item.title]}
                            onOpenChange={(open) =>
                                setOpenItems((prev) => ({
                                    ...prev,
                                    [item.title]: open,
                                }))
                            }
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={page.url.startsWith(item.url)}
                                    >
                                        {item.icon && <item.icon />}
                                        <span className="font-medium">
                                            {item.title}
                                        </span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={page.url.startsWith(
                                                        subItem.url,
                                                    )}
                                                >
                                                    <Link
                                                        href={subItem.url}
                                                        prefetch
                                                    >
                                                        <span>
                                                            {subItem.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
