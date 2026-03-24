import { useId, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectWithSearchProps {
  /**
   * The label for the select input
   */
  label?: string;
  /**
   * Placeholder text when no value is selected
   */
  placeholder?: string;
  /**
   * Placeholder text for the search input
   */
  searchPlaceholder?: string;
  /**
   * Message to display when no options are found
   */
  emptyMessage?: string;
  /**
   * Array of options to display
   */
  options: SelectOption[];
  /**
   * The currently selected value
   */
  value: string;
  /**
   * Callback fired when the value changes
   */
  onValueChange: (value: string) => void;
  /**
   * Whether the select is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes for the trigger button
   */
  className?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Custom ID for the input (auto-generated if not provided)
   */
  id?: string;
  /**
   * Whether to allow clearing the selection
   */
  allowClear?: boolean;
}

export function SelectWithSearch({
  label,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  options,
  value,
  onValueChange,
  disabled = false,
  className,
  required = false,
  id: providedId,
  allowClear = true,
}: SelectWithSearchProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [open, setOpen] = useState<boolean>(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (currentValue: string) => {
    if (allowClear && currentValue === value) {
      onValueChange("");
    } else {
      onValueChange(currentValue);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              className
            )}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    keywords={[option.label]}
                  >
                    {option.label}
                    {value === option.value && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
