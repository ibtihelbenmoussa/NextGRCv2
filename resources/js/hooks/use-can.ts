import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';


interface PageProps {
    auth: {
        user: Record<string, unknown>;
        roles: string[];
        permissions: string[];
    };
    [key: string]: unknown;
}

export function useCan() {
    const { auth } = usePage<SharedData>().props;

    const can = (permission: string): boolean =>
        auth?.permissions?.includes(permission) ?? false;

    const hasRole = (role: string): boolean =>
        auth?.roles?.includes(role) ?? false;

    const isAdmin = (): boolean => hasRole('Admin');
    const isManager = (): boolean => hasRole('Manager');
    const isAuditChief = (): boolean => hasRole('Audit Chief');
    const isAuditor = (): boolean => hasRole('Auditor');
    const isViewer = (): boolean => hasRole('Viewer');

    return { can, hasRole, isAdmin, isManager, isAuditChief, isAuditor, isViewer };
}