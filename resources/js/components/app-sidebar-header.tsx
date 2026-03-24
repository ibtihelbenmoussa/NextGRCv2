import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ThemeToggle } from './theme-toggle';
import LanguageSelect from "@/components/language-select"
import { Fullscreen } from 'lucide-react';
import ThemeSwitcher from '@/components/theme-switcher';
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
    onSearchClick?: () => void;
}) {
    return (
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                {/* <Button
                    variant="outline"
                    size="sm"
                    className="relative h-8 w-full justify-start text-sm font-normal text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                    onClick={onSearchClick}
                >
                    <SearchIcon className="mr-2 size-4" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search</span>
                    <KbdGroup className="pointer-events-none absolute top-1.5 right-1.5 hidden sm:flex">
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                    </KbdGroup>
                </Button> */}

                {/*
 */}            </div>
            <div className="flex items-center gap-2">
                <LanguageSelect />
                {/* <ThemeSwitch /> */}
                {/* <ThemeSwitcher /> */}
                 <ThemeToggle />
                {/* FullScreen */}
                <div className="hidden md:flex">
                    <button
                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:ring-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md bg-transparent focus:ring-2 focus:ring-offset-2 focus:outline-none"
                        onClick={() => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                document.documentElement.requestFullscreen();
                            }
                        }}
                        title="Toggle Fullscreen"
                    >
                        <Fullscreen className="h-4 w-4" />
                        <span className="sr-only">Toggle Fullscreen</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
