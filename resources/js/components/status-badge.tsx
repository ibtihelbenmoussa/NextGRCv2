import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline: 'text-foreground',
                success:
                    'border-transparent bg-green-500 text-white hover:bg-green-600',
                warning:
                    'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
                info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
                gray: 'border-transparent bg-gray-500 text-white hover:bg-gray-600',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {
    status?: string;
}

const statusVariantMap: Record<
    string,
    VariantProps<typeof badgeVariants>['variant']
> = {
    // Audit Mission Status
    planned: 'info',
    in_progress: 'warning',
    closed: 'success',

    // Test Review Status
    pending: 'gray',
    accepted: 'success',
    rejected: 'destructive',

    // Test Results
    effective: 'success',
    partially_effective: 'warning',
    ineffective: 'destructive',
    not_applicable: 'gray',

    // Document Status
    requested: 'warning',
    received: 'success',
    not_available: 'gray',

    // Interview Status
    scheduled: 'info',
    conducted: 'success',
    cancelled: 'gray',

    // Report Status
    draft: 'gray',
    under_review: 'warning',
    approved: 'success',
    issued: 'success',

    // Management Comment Status
    agreed: 'success',
    disagreed: 'destructive',
    implemented: 'success',

    // Active status
    active: 'success',
    inactive: 'gray',
};

const statusLabelMap: Record<string, string> = {
    in_progress: 'In Progress',
    not_applicable: 'Not Applicable',
    partially_effective: 'Partially Effective',
    not_available: 'Not Available',
    under_review: 'Under Review',
};

function StatusBadge({
    className,
    variant,
    status,
    children,
    ...props
}: StatusBadgeProps) {
    const computedVariant = status
        ? statusVariantMap[status] || variant
        : variant;

    const label = status
        ? statusLabelMap[status] ||
          status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
        : children;

    return (
        <div
            className={cn(
                badgeVariants({ variant: computedVariant }),
                className,
            )}
            {...props}
        >
            {label}
        </div>
    );
}

export { badgeVariants, StatusBadge };
