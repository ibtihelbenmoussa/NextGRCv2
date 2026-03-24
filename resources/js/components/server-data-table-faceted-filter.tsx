import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface FacetedFilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableFacetedFilterProps {
    title?: string;
    filterKey: string;
    options: FacetedFilterOption[];
}

export function DataTableFacetedFilter({
    title,
    filterKey,
    options,
}: DataTableFacetedFilterProps) {
    const [selectedValues, setSelectedValues] = useState<Set<string>>(
        new Set(),
    );

    // Initialize from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get(`filter[${filterKey}]`);
        if (filterParam) {
            const values = filterParam.split(',');
            setSelectedValues(new Set(values));
        }
    }, [filterKey]);

    const updateFilter = (values: Set<string>) => {
        const params = new URLSearchParams(window.location.search);

        if (values.size > 0) {
            params.set(`filter[${filterKey}]`, Array.from(values).join(','));
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

    const handleSelect = (value: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
        } else {
            newSelectedValues.add(value);
        }
        setSelectedValues(newSelectedValues);
        updateFilter(newSelectedValues);
    };

    const handleClear = () => {
        setSelectedValues(new Set());
        updateFilter(new Set());
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full justify-start border-dashed"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues.size > 0 && (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-2 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) =>
                                            selectedValues.has(option.value),
                                        )
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(
                                    option.value,
                                );
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() =>
                                            handleSelect(option.value)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleClear}
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
