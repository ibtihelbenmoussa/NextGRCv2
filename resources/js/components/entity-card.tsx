import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface EntityCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    badge?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function EntityCard({
    title,
    description,
    icon,
    badge,
    footer,
    children,
    className,
    onClick,
}: EntityCardProps) {
    return (
        <Card
            className={cn(
                'gap-0 shadow-none transition-all',
                onClick && 'cursor-pointer hover:shadow-md',
                className,
            )}
            onClick={onClick}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className="text-muted-foreground">{icon}</div>
                        )}
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            {description && (
                                <CardDescription className="mt-1">
                                    {description}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    {badge && <div>{badge}</div>}
                </div>
            </CardHeader>
            {children && <CardContent>{children}</CardContent>}
            {footer && (
                <CardContent className="border-t pt-4 text-sm text-muted-foreground">
                    {footer}
                </CardContent>
            )}
        </Card>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon,
    trend,
    className,
}: StatCardProps) {
    return (
        <Card className={cn('gap-0 shadow-none', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {trend && (
                            <span
                                className={cn(
                                    'font-medium',
                                    trend.direction === 'up'
                                        ? 'text-green-600'
                                        : 'text-red-600',
                                )}
                            >
                                {trend.direction === 'up' ? '↑' : '↓'}{' '}
                                {trend.value}%
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface InfoItemProps {
    label: string;
    value: ReactNode;
    className?: string;
}

export function InfoItem({ label, value, className }: InfoItemProps) {
    return (
        <div className={cn('flex items-start gap-2', className)}>
            <span className="text-sm text-muted-foreground">{label}:</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
