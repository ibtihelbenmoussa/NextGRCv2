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

interface DataTableDateFilterProps {
    filterKey: string;
    title?: string;
    placeholder?: string;
}

export function DataTableDateFilter({
    filterKey,
    title = 'Date',
    placeholder = 'Pick a date',
}: DataTableDateFilterProps) {
    const [date, setDate] = useState<Date | undefined>();

    // Initialize from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get(`filter[${filterKey}]`);
        if (dateParam) {
            setDate(new Date(dateParam));
        }
    }, [filterKey]);

    const updateFilter = (selectedDate: Date | undefined) => {
        const params = new URLSearchParams(window.location.search);

        if (selectedDate) {
            params.set(
                `filter[${filterKey}]`,
                format(selectedDate, 'yyyy-MM-dd'),
            );
        } else {
            params.delete(`filter[${filterKey}]`);
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

    const handleSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        updateFilter(selectedDate);
    };

    const handleClear = () => {
        setDate(undefined);
        updateFilter(undefined);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            'h-8 justify-start text-left font-normal',
                            !date && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                            format(date, 'PPP')
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {date && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear {title}</span>
                </Button>
            )}
        </div>
    );
}
