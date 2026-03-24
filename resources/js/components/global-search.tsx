import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { router } from '@inertiajs/react';
import {
    BarChart3Icon,
    Building2Icon,
    FolderIcon,
    GitBranchIcon,
    LayoutDashboardIcon,
    SettingsIcon,
    ShieldIcon,
    UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    url: string;
    category: string;
}

const searchItems: SearchItem[] = [
    // Main
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'View your dashboard',
        icon: LayoutDashboardIcon,
        url: '/dashboard',
        category: 'Main',
    },
    {
        id: 'overview',
        title: 'Overview',
        description: 'Audit universe overview',
        icon: BarChart3Icon,
        url: '/overview',
        category: 'Main',
    },

    // Organization & Structure
    {
        id: 'organizations',
        title: 'Organizations',
        description: 'Manage organizations',
        icon: Building2Icon,
        url: '/organizations',
        category: 'Organization',
    },
    {
        id: 'business-units',
        title: 'Business Units',
        description: 'Manage business units',
        icon: FolderIcon,
        url: '/business-units',
        category: 'Audit Universe',
    },
    {
        id: 'macro-processes',
        title: 'Macro Processes',
        description: 'Manage macro processes',
        icon: GitBranchIcon,
        url: '/macro-processes',
        category: 'Audit Universe',
    },
    {
        id: 'processes',
        title: 'Processes',
        description: 'Manage processes',
        icon: GitBranchIcon,
        url: '/processes',
        category: 'Audit Universe',
    },

    // User Management
    {
        id: 'users',
        title: 'Users',
        description: 'Manage users',
        icon: UsersIcon,
        url: '/users',
        category: 'User Management',
    },
    {
        id: 'roles',
        title: 'Roles & Permissions',
        description: 'Manage roles and permissions',
        icon: ShieldIcon,
        url: '/roles',
        category: 'User Management',
    },

    // Settings
    {
        id: 'settings-profile',
        title: 'Profile Settings',
        description: 'Update your profile information',
        icon: SettingsIcon,
        url: '/settings/profile',
        category: 'Settings',
    },
    {
        id: 'settings-password',
        title: 'Password',
        description: 'Change your password',
        icon: SettingsIcon,
        url: '/settings/password',
        category: 'Settings',
    },
    {
        id: 'settings-appearance',
        title: 'Appearance',
        description: 'Customize theme and appearance',
        icon: SettingsIcon,
        url: '/settings/appearance',
        category: 'Settings',
    },
    {
        id: 'settings-2fa',
        title: 'Two-Factor Authentication',
        description: 'Manage your 2FA settings',
        icon: SettingsIcon,
        url: '/settings/two-factor',
        category: 'Settings',
    },
];

export function GlobalSearch({
    open,
    onOpenChange,
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setIsOpen]);

    const handleSelect = (url: string) => {
        setIsOpen(false);
        router.visit(url);
    };

    // Group items by category
    const groupedItems = searchItems.reduce(
        (acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        },
        {} as Record<string, SearchItem[]>,
    );

    return (
        <CommandDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Global Search"
            description="Search for pages and features"
        >
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(groupedItems).map(
                    ([category, items], index) => (
                        <div key={category}>
                            {index > 0 && <CommandSeparator />}
                            <CommandGroup heading={category}>
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.description}`}
                                            onSelect={() =>
                                                handleSelect(item.url)
                                            }
                                        >
                                            <Icon className="mr-2 size-4" />
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                {item.description && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </div>
                    ),
                )}
            </CommandList>
        </CommandDialog>
    );
}
