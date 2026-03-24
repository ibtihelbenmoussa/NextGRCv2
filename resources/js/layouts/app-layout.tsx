import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect } from 'react';
import { usePage } from "@inertiajs/react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {

    const { props: pageProps }: any = usePage()

    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success)
        }

        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error)
        }
    }, [pageProps.flash])

    return (
        <>
            
            <Toaster
                position="top-right"
                richColors
                expand
                closeButton
            />

            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </>
    );
};