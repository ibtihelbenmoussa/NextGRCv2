"use client"

import React, { useState } from "react"
import { Head, Link, usePage } from "@inertiajs/react"
import { Building2, Settings, User, Lock, Menu, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import AppLogo from "@/components/app-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserMenuContent } from "@/components/user-menu-content"
import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SharedData } from '@/types'
import { Separator } from "@/components/ui/separator"

type NavigationItem = {
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
}

interface AdminSettingsLayoutProps {
    children: React.ReactNode
    title?: string
}

const AdminSettingsLayout = ({ children, title = "Admin Settings" }: AdminSettingsLayoutProps) => {
    const getInitials = useInitials()
    const { auth } = usePage<SharedData>().props
    const currentPath = window.location.pathname
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const items: NavigationItem[] = [
        {
            title: "General",
            href: "/admin-settings",
            icon: Settings,
        },
        {
            title: "Organizations",
            href: "/organizations",
            icon: Building2,
        },
        {
            title: "Users",
            href: "/users",
            icon: User,
        },
        {
            title: "Roles & Permissions",
            href: "/roles",
            icon: Lock,
        },
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <Head title={title} />

            {/* Header */}
            <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <div className="flex h-full flex-col">
                                <div className="flex h-14 items-center border-b px-4">
                                    <AppLogo />
                                </div>
                                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                                    <Link 
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent" 
                                        href="/organizations/select"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Building2 className="h-4 w-4 shrink-0" />
                                        Organizations
                                    </Link>
                                    <Separator className="my-2" />
                                    {items.map((item) => {
                                        const isActive = currentPath === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-accent text-accent-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                                )}
                                            >
                                                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                                                <span>{item.title}</span>
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <AppLogo />
                    <nav className="hidden items-center gap-1 md:flex">
                        <Link
                            href="/organizations/select"
                            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                        >
                            <Building2 className="h-4 w-4" />
                            Organizations
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="bg-muted text-xs font-medium">
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

            <div className="flex flex-1">
                {/* Sidebar Navigation - Desktop */}
                <aside className="hidden w-56 border-r bg-card lg:block">
                    <div className="sticky top-14 p-4">
                        <nav className="flex flex-col gap-1">
                            {items.map((item) => {
                                const isActive = currentPath === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                        )}
                                    >
                                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                                        <span>{item.title}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AdminSettingsLayout
