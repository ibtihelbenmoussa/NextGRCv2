import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PaginatedData } from '@/types';
import { router } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileSpreadsheet,
    Search,
    SearchX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DataTableFiltersDropdown } from './server-data-table-filters-dropdown';
import { DataTableViewOptions } from './server-data-table-view-options';
import { EmptyState } from './ui/empty-state';

import type { InitialTableState } from '@tanstack/react-table';

export interface ServerDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: PaginatedData<TData>;
    searchPlaceholder?: string;
    searchable?: boolean;
    filters?: React.ReactNode;
    toolbar?: React.ReactNode;
    className?: string;
    onRowClick?: (row: TData) => void;
    initialState?: InitialTableState | undefined;
    onExport?: () => void;
    exportLoading?: boolean;
}

export function ServerDataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder = 'Search...',
    searchable = true,
    filters,
    toolbar,
    className,
    onRowClick,
    initialState,
    onExport,
    exportLoading = false,
}: ServerDataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [searchValue, setSearchValue] = useState('');

    // Initialize from URL params
    // Debounced search handler
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search') || '';
        setSearchValue(search);
    }, []);

    const debouncedSearch = useCallback((value: string) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            updateServerState({ search: value, page: 1 });
        }, 500);
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        debouncedSearch(value);
    };

    // Update server state via Inertia
    const updateServerState = (
        updates: Record<string, string | number | null | undefined>,
    ) => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
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

    // Handle sorting changes
    const handleSortingChange = (
        updater: SortingState | ((old: SortingState) => SortingState),
    ) => {
        const newSorting =
            typeof updater === 'function' ? updater(sorting) : updater;
        setSorting(newSorting);
        if (newSorting.length > 0) {
            const sort = newSorting[0];
            const sortParam = sort.desc ? `-${sort.id}` : sort.id;
            updateServerState({ sort: sortParam, page: 1 });
        } else {
            updateServerState({ sort: null, page: 1 });
        }
    };

    const handlePageSizeChange = (pageSize: number) => {
        updateServerState({ per_page: pageSize, page: 1 });
    };

    const table = useReactTable({
        data: data.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: data.last_page,
        state: {
            pagination: {
                pageIndex: data.current_page - 1,
                pageSize: data.per_page,
            },
            sorting,
            columnFilters,
            columnVisibility,
        },
        onPaginationChange: (updater) => {
            const newPagination =
                typeof updater === 'function'
                    ? updater({
                        pageIndex: data.current_page - 1,
                        pageSize: data.per_page,
                    })
                    : updater;
            handlePageSizeChange(newPagination.pageSize);
        },
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        initialState,
    });

    // Pagination handlers
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= data.last_page) {
            updateServerState({ page });
        }
    };

    const handlePerPageChange = (perPage: string) => {
        updateServerState({ per_page: perPage, page: 1 });
    };

    // Ensure `data.per_page` is always defined and defaults to 10 if not provided
    const perPage = data.per_page ?? 10;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex w-full items-center gap-4 md:gap-0">
                <div className="flex min-w-0 flex-grow flex-col justify-between gap-4 md:flex-row md:items-center">
                    {/* Search Input */}
                    {searchable && (
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-9"
                            />
                        </div>
                    )}
                    {/* Filters and View Options Grouped in a Single ButtonGroup */}
                    {/* <ButtonGroup>
                        {filters && (
                            <DataTableFiltersDropdown>
                                {filters}
                            </DataTableFiltersDropdown>
                        )}
                        <DataTableViewOptions table={table} />
                        {onExport && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onExport}
                                disabled={exportLoading}
                                className="h-9 gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                {exportLoading
                                    ? 'Exporting...'
                                    : 'Export Excel'}
                            </Button>
                        )}
                    </ButtonGroup> */}

                    <ButtonGroup>
                        {filters && (
                            <DataTableFiltersDropdown>
                                {filters}
                            </DataTableFiltersDropdown>
                        )}

                        <DataTableViewOptions table={table} />

                        {toolbar}  {/* ✅ ICI ON AJOUTE REFRESH */}

                        {onExport && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onExport}
                                disabled={exportLoading}
                                className="h-9 gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                {exportLoading ? 'Exporting...' : 'Export Excel'}
                            </Button>
                        )}
                    </ButtonGroup>
                </div>
             {/*    <div className="ml-auto flex items-center gap-2">{toolbar}</div> */}
            </div>
            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef
                                                    .header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length > 0 ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                        className={cn(
                                            onRowClick && 'cursor-pointer',
                                        )}
                                        onClick={() =>
                                            onRowClick?.(row.original)
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const isPinnedRight =
                                                cell.column.getIsPinned?.() ===
                                                'right';
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    className={
                                                        isPinnedRight
                                                            ? 'sticky right-0 z-50 bg-white dark:bg-background'
                                                            : ''
                                                    }
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="p-0"
                                >
                                    <EmptyState
                                        icon={SearchX}
                                        title="No results found"
                                        description="Try adjusting your search or filters to find what you're looking for."
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Results Info */}
                <div className="text-sm text-muted-foreground">
                    {data.total > 0 ? (
                        <>
                            Showing {data.from} to {data.to} of {data.total}{' '}
                            results
                        </>
                    ) : (
                        'No results'
                    )}
                </div>
                {/* Pagination Controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    {/* Per Page Selector */}
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={String(perPage)}
                            onValueChange={handlePerPageChange}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={String(perPage)} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={String(pageSize)}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:gap-6">
                        {/* Page Info */}
                        <div className="text-sm font-medium">
                            Page {data.current_page} of {data.last_page}
                        </div>
                        {/* Page Navigation */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(1)}
                                disabled={data.current_page === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                                <span className="sr-only">First page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                    handlePageChange(data.current_page - 1)
                                }
                                disabled={!data.prev_page_url}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                    handlePageChange(data.current_page + 1)
                                }
                                disabled={!data.next_page_url}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(data.last_page)}
                                disabled={data.current_page === data.last_page}
                            >
                                <ChevronsRight className="h-4 w-4" />
                                <span className="sr-only">Last page</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
