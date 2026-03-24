import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

interface DataTableSelectFilterProps {
    filterKey: string;
    title?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    options: SelectOption[];
    showIcon?: boolean;
}

export function DataTableSelectFilter({
    filterKey,
    title = 'Select',
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No option found.',
    showIcon = true,
    options,
}: DataTableSelectFilterProps) {
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>('');

    // Initialize from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get(`filter[${filterKey}]`);
        if (filterParam) {
            setSelectedValue(filterParam);
        }
    }, [filterKey]);

    const updateFilter = (value: string) => {
        const params = new URLSearchParams(window.location.search);

        if (value) {
            params.set(`filter[${filterKey}]`, value);
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
        const option = options.find((o) => o.label === value);
        if (!option) return;
        const newValue = option.value === selectedValue ? '' : option.value;
        setSelectedValue(newValue);
        updateFilter(newValue);
        setOpen(false);
    };

    const handleClear = () => {
        setSelectedValue('');
        updateFilter('');
    };

    const selectedOption = options.find(
        (option) => option.value === selectedValue,
    );

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'h-9 w-full justify-between',
                            !selectedValue && 'text-muted-foreground',
                        )}
                    >
                        <span className="truncate">
                            {selectedOption
                                ? selectedOption.label
                                : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={handleSelect}
                                    >
                                        {showIcon && (
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    selectedValue ===
                                                        option.value
                                                        ? 'opacity-100'
                                                        : 'opacity-0',
                                                )}
                                            />
                                        )}
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectedValue && (
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
