import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { router } from '@inertiajs/react';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface DataTableFiltersDropdownProps {
    children: React.ReactNode;
}

export function DataTableFiltersDropdown({
    children,
}: DataTableFiltersDropdownProps) {
    const [open, setOpen] = useState(false);

    // Count active filters from URL params
    const getActiveFiltersCount = () => {
        const params = new URLSearchParams(window.location.search);
        let count = 0;

        // List of known filter params (with filter[] prefix)
        const filterParams = [
            'filter[status]',
            'filter[manager]',
            'filter[business_unit]',
            'filter[macro_process]',
            'filter[date_from]',
            'filter[date_to]',
        ];

        filterParams.forEach((param) => {
            if (params.has(param)) {
                count++;
            }
        });

        // If both date_from and date_to exist, count as one filter
        if (params.has('filter[date_from]') && params.has('filter[date_to]')) {
            count--;
        }

        return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    // Clear all filters
    const handleClearFilters = () => {
        const params = new URLSearchParams(window.location.search);

        // Keep search, page, per_page, sort - remove all filter[] params
        const newParams = new URLSearchParams();

        for (const [key, value] of params.entries()) {
            // Keep non-filter params
            if (!key.startsWith('filter[')) {
                newParams.set(key, value);
            }
        }

        router.get(
            `${window.location.pathname}?${newParams.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );

        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-2 h-5 rounded-sm px-1 font-normal"
                        >
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[380px] p-0"
                align="center"
                side="bottom"
            >
                <div className="p-2">
                    <div className="flex flex-col gap-2">{children}</div>
                    {activeFiltersCount > 0 && (
                        <>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    {activeFiltersCount === 0
                                        ? 'No filters applied'
                                        : `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} applied`}
                                </span>
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="ml-2 h-7 px-1 text-xs"
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Clear all
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
