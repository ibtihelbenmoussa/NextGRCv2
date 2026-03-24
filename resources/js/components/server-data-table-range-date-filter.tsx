import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

interface DataTableRangeDateFilterProps {
    filterFromKey: string;
    filterToKey: string;
    title?: string;
    placeholder?: string;
}

export function DataTableRangeDateFilter({
    filterFromKey,
    filterToKey,
    title = 'Date Range',
    placeholder = 'Pick a date range',
}: DataTableRangeDateFilterProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    // Initialize from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get(`filter[${filterFromKey}]`);
        const toParam = params.get(`filter[${filterToKey}]`);

        if (fromParam || toParam) {
            setDateRange({
                from: fromParam ? new Date(fromParam) : undefined,
                to: toParam ? new Date(toParam) : undefined,
            });
        }
    }, [filterFromKey, filterToKey]);

    const updateFilter = (selectedRange: DateRange | undefined) => {
        const params = new URLSearchParams(window.location.search);

        if (selectedRange?.from) {
            params.set(
                `filter[${filterFromKey}]`,
                format(selectedRange.from, 'yyyy-MM-dd'),
            );
        } else {
            params.delete(`filter[${filterFromKey}]`);
        }

        if (selectedRange?.to) {
            params.set(
                `filter[${filterToKey}]`,
                format(selectedRange.to, 'yyyy-MM-dd'),
            );
        } else {
            params.delete(`filter[${filterToKey}]`);
        }

        // Reset to first page when filtering
        params.set('page', '1');

        router.get(
            `${window.location.pathname}?${params.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSelect = (selectedRange: DateRange | undefined) => {
        setDateRange(selectedRange);
        updateFilter(selectedRange);
    };

    const handleClear = () => {
        setDateRange(undefined);
        updateFilter(undefined);
    };

    const formatDateRange = () => {
        if (!dateRange?.from) {
            return <span>{placeholder}</span>;
        }

        if (dateRange.to) {
            return (
                <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                </>
            );
        }

        return format(dateRange.from, 'LLL dd, y');
    };

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            'h-9 w-full justify-start text-left font-normal',
                            !dateRange?.from && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{formatDateRange()}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {(dateRange?.from || dateRange?.to) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear {title}</span>
                </Button>
            )}
        </div>
    );
}
