interface DataTableFilterItemProps {
    label?: string;
    children: React.ReactNode;
}

export function DataTableFilterItem({
    label,
    children,
}: DataTableFilterItemProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}
