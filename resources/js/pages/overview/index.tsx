import { OrganizationFlow } from '@/components/overview/organization-flow';
import { EmptyState } from '@/components/ui/empty-state';
import AppLayout from '@/layouts/app-layout';
import type {
    BusinessUnit,
    MacroProcess,
    Organization,
    Process,
    SharedData,
} from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Building2, Loader2 } from 'lucide-react';

interface OverviewPageProps {
    organization: Organization & {
        business_units?: (BusinessUnit & {
            macro_processes?: (MacroProcess & {
                processes?: Process[];
            })[];
        })[];
    };
}

export default function OverviewIndex({ organization }: OverviewPageProps) {
    const { currentOrganization } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Overview', href: '/overview' }]}>
            <Head title="Overview" />

            <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Overview
                        </h1>
                        <p className="text-muted-foreground">
                            Organization structure visualization
                        </p>
                    </div>
                </div>

                {/* Flow Visualization */}
                <div className="flex-1 rounded-lg border bg-background">
                    {organization ? (
                        organization.business_units &&
                        organization.business_units.length > 0 ? (
                            <ReactFlowProvider>
                                <OrganizationFlow organization={organization} />
                            </ReactFlowProvider>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <EmptyState
                                    icon={Building2}
                                    title="No structure to display"
                                    description="This organization has no business units yet."
                                />
                            </div>
                        )
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <EmptyState
                                icon={currentOrganization ? Loader2 : Building2}
                                title={
                                    currentOrganization
                                        ? 'Loading organization data...'
                                        : 'No organization selected'
                                }
                                description={
                                    currentOrganization
                                        ? 'Please wait...'
                                        : 'Please select an organization to view its structure'
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
