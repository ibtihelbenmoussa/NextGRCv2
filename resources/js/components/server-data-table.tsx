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
import { useCallback, useRef, useState } from 'react';
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

// Params système exclus du traitement des filtres facettés
const SYSTEM_PARAMS = new Set(['search', 'page', 'per_page', 'sort']);

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
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // ── Initialisation depuis l'URL (lazy initialisers — pas de useEffect) ──────

    const [searchValue, setSearchValue] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('search') || '';
    });

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
        const params = new URLSearchParams(window.location.search);
        const initial: ColumnFiltersState = [];

        params.forEach((value, key) => {
            if (!SYSTEM_PARAMS.has(key) && value) {
                // Les filtres facettés multi-valeurs sont séparés par virgule
                initial.push({
                    id: key,
                    value: value.split(',').filter(Boolean),
                });
            }
        });

        return initial;
    });

    // ── Debounced search ─────────────────────────────────────────────────────────

const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // ── Sync URL ─────────────────────────────────────────────────────────────────

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

    // ── Sorting ──────────────────────────────────────────────────────────────────

    const handleSortingChange = (
        updater: SortingState | ((old: SortingState) => SortingState),
    ) => {
        const newSorting =
            typeof updater === 'function' ? updater(sorting) : updater;
        setSorting(newSorting);
        if (newSorting.length > 0) {
            const sort = newSorting[0];
            updateServerState({ sort: sort.desc ? `-${sort.id}` : sort.id, page: 1 });
        } else {
            updateServerState({ sort: null, page: 1 });
        }
    };

    // ── Column filters → URL ─────────────────────────────────────────────────────

    const handleColumnFiltersChange = (
        updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState),
    ) => {
        const newFilters =
            typeof updater === 'function' ? updater(columnFilters) : updater;
        setColumnFilters(newFilters);

        const updates: Record<string, string | null> = {};

        // D'abord, supprimer tous les filtres facettés actuels de l'URL
        const params = new URLSearchParams(window.location.search);
        params.forEach((_, key) => {
            if (!SYSTEM_PARAMS.has(key)) {
                updates[key] = null;
            }
        });

        // Ensuite, appliquer les nouveaux filtres
        newFilters.forEach(({ id, value }) => {
            if (Array.isArray(value) && value.length > 0) {
                updates[id] = value.join(',');
            } else if (value !== undefined && value !== null && value !== '') {
                updates[id] = String(value);
            }
        });

        updateServerState({ ...updates, page: 1 });
    };

    // ── Pagination ───────────────────────────────────────────────────────────────

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= data.last_page) {
            updateServerState({ page });
        }
    };

    const handlePerPageChange = (perPage: string) => {
        updateServerState({ per_page: perPage, page: 1 });
    };

    const perPage = data.per_page ?? 10;

    // ── Table ────────────────────────────────────────────────────────────────────

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
            handlePerPageChange(String(newPagination.pageSize));
        },
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        initialState,
    });

    // ── Render ───────────────────────────────────────────────────────────────────

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex w-full items-center gap-4 md:gap-0">
                <div className="flex min-w-0 flex-grow flex-col justify-between gap-4 md:flex-row md:items-center">
                    {searchable && (
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}

                    <ButtonGroup>
                        {filters && (
                            <DataTableFiltersDropdown>
                                {filters}
                            </DataTableFiltersDropdown>
                        )}

                        <DataTableViewOptions table={table} />

                        {toolbar}

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
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={cn(onRowClick && 'cursor-pointer')}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isPinnedRight =
                                            cell.column.getIsPinned?.() === 'right';
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
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="p-0">
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
                <div className="text-sm text-muted-foreground">
                    {data.total > 0 ? (
                        <>
                            Showing {data.from} to {data.to} of {data.total} results
                        </>
                    ) : (
                        'No results'
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
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
                                    <SelectItem key={pageSize} value={String(pageSize)}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:gap-6">
                        <div className="text-sm font-medium">
                            Page {data.current_page} of {data.last_page}
                        </div>
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
                                onClick={() => handlePageChange(data.current_page - 1)}
                                disabled={!data.prev_page_url}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(data.current_page + 1)}
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