import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    GitBranch,
    TrendingUp,
    Workflow,
} from 'lucide-react';

export type NodeDetailsType =
    | {
          type: 'organization';
          id: number;
          name: string;
          code?: string;
          business_units_count?: number;
      }
    | {
          type: 'businessUnit';
          id: number;
          name: string;
          code?: string;
          macro_processes_count?: number;
          organization_id: number;
      }
    | {
          type: 'macroProcess';
          id: number;
          name: string;
          code?: string;
          processes_count?: number;
          business_unit_id: number;
      }
    | {
          type: 'process';
          id: number;
          name: string;
          code?: string;
          risks_count?: number;
          macro_process_id: number;
      };

interface NodeDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeDetails: NodeDetailsType | null;
}

export function NodeDetailsDialog({
    open,
    onOpenChange,
    nodeDetails,
}: NodeDetailsDialogProps) {
    if (!nodeDetails) return null;

    const handleViewDetails = () => {
        if (!nodeDetails) return;

        switch (nodeDetails.type) {
            case 'organization':
                router.visit(`/organizations/${nodeDetails.id}`);
                break;
            case 'businessUnit':
                router.visit(`/business-units/${nodeDetails.id}`);
                break;
            case 'macroProcess':
                router.visit(`/macro-processes/${nodeDetails.id}`);
                break;
            case 'process':
                router.visit(`/processes/${nodeDetails.id}`);
                break;
        }
    };

    const getIcon = () => {
        switch (nodeDetails.type) {
            case 'organization':
                return <Building2 className="h-6 w-6 text-blue-500" />;
            case 'businessUnit':
                return <Briefcase className="h-6 w-6 text-green-500" />;
            case 'macroProcess':
                return <GitBranch className="h-6 w-6 text-purple-500" />;
            case 'process':
                return <Workflow className="h-6 w-6 text-orange-500" />;
        }
    };

    const getTitle = () => {
        switch (nodeDetails.type) {
            case 'organization':
                return 'Organization Details';
            case 'businessUnit':
                return 'Business Unit Details';
            case 'macroProcess':
                return 'Macro Process Details';
            case 'process':
                return 'Process Details';
        }
    };

    const getStats = () => {
        switch (nodeDetails.type) {
            case 'organization':
                return nodeDetails.business_units_count !== undefined
                    ? `${nodeDetails.business_units_count} Business Unit${nodeDetails.business_units_count !== 1 ? 's' : ''}`
                    : null;
            case 'businessUnit':
                return nodeDetails.macro_processes_count !== undefined
                    ? `${nodeDetails.macro_processes_count} Macro Process${nodeDetails.macro_processes_count !== 1 ? 'es' : ''}`
                    : null;
            case 'macroProcess':
                return nodeDetails.processes_count !== undefined
                    ? `${nodeDetails.processes_count} Process${nodeDetails.processes_count !== 1 ? 'es' : ''}`
                    : null;
            case 'process':
                return nodeDetails.risks_count !== undefined
                    ? `${nodeDetails.risks_count} Risk${nodeDetails.risks_count !== 1 ? 's' : ''}`
                    : null;
        }
    };

    const stats = getStats();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {getIcon()}
                        {getTitle()}
                    </DialogTitle>
                    <DialogDescription>
                        View detailed information and navigate to the full page
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Name
                        </label>
                        <p className="text-base font-semibold">
                            {nodeDetails.name}
                        </p>
                    </div>

                    {nodeDetails.code && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Code
                            </label>
                            <p className="font-mono text-sm">
                                {nodeDetails.code}
                            </p>
                        </div>
                    )}

                    {stats && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Statistics
                            </label>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{stats}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button onClick={handleViewDetails}>
                        View Full Details
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
