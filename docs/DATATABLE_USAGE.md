# DataTable Component Usage Guide

A powerful, generic DataTable component for NextGRC built with TanStack Table. This component provides out-of-the-box features including sorting, filtering, pagination, row selection, and custom actions.

## Features

- ✅ **Row Selection** - Select single or multiple rows with checkboxes
- ✅ **Column Sorting** - Click headers to sort ascending/descending
- ✅ **Column Visibility** - Toggle which columns to display
- ✅ **Global Search** - Filter across specified columns
- ✅ **Custom Filters** - Add filters for specific columns with faceted values
- ✅ **Date Range Filter** - Built-in calendar-based date range filtering
- ✅ **Pagination** - Navigate through pages with customizable page sizes
- ✅ **Custom Actions** - Add bulk actions for selected rows (with confirmation dialogs)
- ✅ **Row Actions** - Per-row actions (edit, delete, etc.)
- ✅ **Loading State** - Display spinner while data is loading
- ✅ **Empty State** - Customizable message when no data
- ✅ **Responsive Design** - Works on mobile and desktop
- ✅ **Keyboard Accessible** - Full keyboard navigation support

## Installation

The component is already set up in your project at:

- `resources/js/components/ui/data-table.tsx` - Main component
- `resources/js/components/ui/data-table-types.ts` - TypeScript types

## Basic Usage

### 1. Define Your Data Type

```typescript
interface User {
    id: string;
    name: string;
    email: string;
    status: 'Active' | 'Inactive' | 'Pending';
    role: string;
    created_at: string;
}
```

### 2. Create Column Definitions

```typescript
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const columns: ColumnDef<User>[] = [
    // Selection column
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
    },
    // Regular columns
    {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue('name')}</div>
        ),
        size: 180,
        enableHiding: false,
    },
    {
        header: 'Email',
        accessorKey: 'email',
        size: 220,
    },
    {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
            <Badge
                variant={
                    row.getValue('status') === 'Active'
                        ? 'default'
                        : 'secondary'
                }
            >
                {row.getValue('status')}
            </Badge>
        ),
        size: 100,
    },
    {
        header: 'Role',
        accessorKey: 'role',
        size: 120,
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <UserRowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];
```

### 3. Use the DataTable Component

```typescript
import { DataTable } from '@/components/ui/data-table';
import { TrashIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch data
    useEffect(() => {
        fetchUsers().then((data) => {
            setUsers(data);
            setIsLoading(false);
        });
    }, []);

    // Handle delete action
    const handleDelete = async (selectedRows: Row<User>[]) => {
        const ids = selectedRows.map((row) => row.original.id);
        await deleteUsers(ids);
        // Refresh data
        setUsers(users.filter((user) => !ids.includes(user.id)));
    };

    return (
        <div className="container py-10">
            <DataTable
                columns={columns}
                data={users}
                isLoading={isLoading}
                searchPlaceholder="Search by name or email..."
                searchColumnId="name"
                emptyMessage="No users found."
                actions={[
                    {
                        id: 'delete',
                        label: 'Delete',
                        icon: <TrashIcon size={16} />,
                        variant: 'destructive',
                        requireConfirmation: true,
                        confirmTitle: 'Delete Users',
                        confirmDescription:
                            'Are you sure you want to delete the selected users? This action cannot be undone.',
                        onAction: handleDelete,
                    },
                ]}
                toolbarActions={
                    <Button>
                        <PlusIcon size={16} />
                        Add User
                    </Button>
                }
                filters={[
                    {
                        columnId: 'status',
                        title: 'Status',
                    },
                    {
                        columnId: 'role',
                        title: 'Role',
                    },
                ]}
            />
        </div>
    );
}
```

## Advanced Examples

### Example 1: Simple Table (Minimal Configuration)

```typescript
// Simplest usage - just columns and data
<DataTable columns={columns} data={data} />
```

### Example 2: With Date Range Filter

```typescript
<DataTable
    columns={columns}
    data={businessUnits}
    searchPlaceholder="Search business units..."
    searchColumnId="name"
    filters={[
        {
            columnId: 'status',
            title: 'Status',
        },
    ]}
    dateRangeFilter={{
        dateColumnId: 'updated_at',
        label: 'Last Updated', // Optional, defaults to "Filter by date range"
    }}
/>
```

The date range filter will:

- Display a calendar picker button in the toolbar
- Show a dual-month calendar for easy range selection
- Filter the data based on the specified date column
- Include a clear button (X) to reset the filter

````

### Example 3: Disable Features

```typescript
<DataTable
    columns={columns}
    data={data}
    enableRowSelection={false}
    enableColumnVisibility={false}
    enablePagination={false}
    enableGlobalFilter={false}
/>
````

### Example 4: Custom Page Sizes

```typescript
<DataTable
    columns={columns}
    data={data}
    initialPageSize={25}
    pageSizeOptions={[10, 25, 50, 100, 200]}
/>
```

### Example 4: Default Sorting

```typescript
<DataTable
    columns={columns}
    data={data}
    defaultSorting={[
        {
            id: 'name',
            desc: false, // ascending
        },
    ]}
/>
```

### Example 5: Multi-Column Search Filter

```typescript
import { FilterFn } from '@tanstack/react-table';

// Define custom filter function
const multiColumnFilterFn: FilterFn<User> = (row, columnId, filterValue) => {
    const searchableContent = `${row.original.name} ${row.original.email}`.toLowerCase();
    const searchTerm = (filterValue ?? '').toLowerCase();
    return searchableContent.includes(searchTerm);
};

// Add filterFn to column definition
const columns: ColumnDef<User>[] = [
    {
        header: 'Name',
        accessorKey: 'name',
        filterFn: multiColumnFilterFn,
    },
    // ... other columns
];

// Use in DataTable
<DataTable
    columns={columns}
    data={users}
    searchColumnId="name"
    searchPlaceholder="Search by name or email..."
/>
```

### Example 6: Custom Row Actions

```typescript
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EllipsisIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Row } from '@tanstack/react-table';

function UserRowActions({ row }: { row: Row<User> }) {
    const user = row.original;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex justify-end">
                    <Button size="icon" variant="ghost" className="shadow-none">
                        <EllipsisIcon size={16} aria-hidden="true" />
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.visit(`/users/${user.id}/edit`)}>
                    <EditIcon size={16} className="mr-2" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteUser(user.id)}
                >
                    <TrashIcon size={16} className="mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

### Example 7: Multiple Bulk Actions

```typescript
<DataTable
    columns={columns}
    data={users}
    actions={[
        {
            id: 'activate',
            label: 'Activate',
            icon: <CheckIcon size={16} />,
            variant: 'default',
            onAction: async (rows) => {
                const ids = rows.map((r) => r.original.id);
                await activateUsers(ids);
            },
        },
        {
            id: 'deactivate',
            label: 'Deactivate',
            icon: <XIcon size={16} />,
            variant: 'secondary',
            onAction: async (rows) => {
                const ids = rows.map((r) => r.original.id);
                await deactivateUsers(ids);
            },
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: <TrashIcon size={16} />,
            variant: 'destructive',
            requireConfirmation: true,
            onAction: async (rows) => {
                const ids = rows.map((r) => r.original.id);
                await deleteUsers(ids);
            },
        },
    ]}
/>
```

## GRC-Specific Examples

### Example: Audit Missions Table

```typescript
import { AuditMission } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

const auditMissionColumns: ColumnDef<AuditMission>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
    },
    {
        header: 'Mission Name',
        accessorKey: 'name',
        cell: ({ row }) => (
            <a
                href={`/audit-missions/${row.original.id}`}
                className="font-medium text-primary hover:underline"
            >
                {row.getValue('name')}
            </a>
        ),
        size: 200,
    },
    {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            const variants = {
                Planned: 'secondary',
                'In Progress': 'default',
                Closed: 'outline',
            };
            return <Badge variant={variants[status]}>{status}</Badge>;
        },
        size: 120,
    },
    {
        header: 'Audit Chief',
        accessorKey: 'audit_chief',
        cell: ({ row }) => row.original.audit_chief?.name,
        size: 150,
    },
    {
        header: 'Start Date',
        accessorKey: 'start_date',
        cell: ({ row }) =>
            new Date(row.getValue('start_date')).toLocaleDateString(),
        size: 120,
    },
    {
        header: 'End Date',
        accessorKey: 'end_date',
        cell: ({ row }) =>
            new Date(row.getValue('end_date')).toLocaleDateString(),
        size: 120,
    },
];

export default function AuditMissionsPage({ missions }: { missions: AuditMission[] }) {
    return (
        <DataTable
            columns={auditMissionColumns}
            data={missions}
            searchColumnId="name"
            searchPlaceholder="Search missions..."
            filters={[
                {
                    columnId: 'status',
                    title: 'Status',
                },
            ]}
            actions={[
                {
                    id: 'close',
                    label: 'Close Missions',
                    icon: <CheckIcon size={16} />,
                    requireConfirmation: true,
                    confirmTitle: 'Close Audit Missions',
                    confirmDescription:
                        'Are you sure you want to close these missions?',
                    onAction: async (rows) => {
                        const ids = rows.map((r) => r.original.id);
                        await router.post('/audit-missions/bulk-close', { ids });
                    },
                },
            ]}
            toolbarActions={
                <Button onClick={() => router.visit('/audit-missions/create')}>
                    <PlusIcon size={16} />
                    New Mission
                </Button>
            }
        />
    );
}
```

### Example: Risks Table with Multi-Column Search

```typescript
import { Risk } from '@/types';
import { FilterFn } from '@tanstack/react-table';

const riskMultiColumnFilter: FilterFn<Risk> = (row, columnId, filterValue) => {
    const searchContent = `
        ${row.original.title}
        ${row.original.description}
        ${row.original.process?.name}
    `.toLowerCase();
    return searchContent.includes((filterValue ?? '').toLowerCase());
};

const riskColumns: ColumnDef<Risk>[] = [
    {
        header: 'Risk Title',
        accessorKey: 'title',
        filterFn: riskMultiColumnFilter,
        size: 250,
    },
    {
        header: 'Process',
        accessorKey: 'process',
        cell: ({ row }) => row.original.process?.name,
        size: 180,
    },
    {
        header: 'Risk Level',
        accessorKey: 'risk_level',
        cell: ({ row }) => {
            const level = row.getValue('risk_level') as string;
            const variants = {
                High: 'destructive',
                Medium: 'warning',
                Low: 'secondary',
            };
            return <Badge variant={variants[level]}>{level}</Badge>;
        },
        size: 100,
    },
    // ... more columns
];

<DataTable
    columns={riskColumns}
    data={risks}
    searchColumnId="title"
    searchPlaceholder="Search risks by title, description, or process..."
    filters={[
        {
            columnId: 'risk_level',
            title: 'Risk Level',
        },
    ]}
/>
```

## TypeScript Types Reference

### DataTableProps

```typescript
interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    enableRowSelection?: boolean;
    enableColumnVisibility?: boolean;
    enableSorting?: boolean;
    enablePagination?: boolean;
    enableGlobalFilter?: boolean;
    initialPageSize?: number;
    pageSizeOptions?: number[];
    searchPlaceholder?: string;
    searchColumnId?: string;
    filters?: DataTableFilter<TData>[];
    actions?: DataTableAction<TData>[];
    toolbarActions?: ReactNode;
    emptyMessage?: string;
    isLoading?: boolean;
    rowActions?: (row: Row<TData>) => ReactNode;
    defaultSorting?: { id: string; desc: boolean }[];
}
```

### DataTableFilter

```typescript
interface DataTableFilter<TData> {
    columnId: string;
    title: string;
    filterFn?: FilterFn<TData>;
}
```

### DataTableAction

```typescript
interface DataTableAction<TData> {
    id: string;
    label: string;
    icon?: ReactNode;
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    requireConfirmation?: boolean;
    confirmTitle?: string;
    confirmDescription?: string;
    onAction: (selectedRows: Row<TData>[]) => void | Promise<void>;
}
```

## Tips & Best Practices

### 1. Column Sizing

Always specify `size` property for columns to ensure consistent table width:

```typescript
{
    header: 'Name',
    accessorKey: 'name',
    size: 180, // pixels
}
```

### 2. Enable/Disable Column Hiding

Mark important columns as non-hideable:

```typescript
{
    header: 'Name',
    accessorKey: 'name',
    enableHiding: false, // Cannot be hidden by user
}
```

### 3. Custom Cell Rendering

Format data in the `cell` property:

```typescript
{
    header: 'Created At',
    accessorKey: 'created_at',
    cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    },
}
```

### 4. Performance Optimization

For large datasets, consider:

- Using `memo` for row actions components
- Implementing server-side pagination
- Debouncing search inputs

### 5. Accessibility

The DataTable component includes:

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly labels

## Common Patterns

### Loading from Laravel Backend

```typescript
export default function UsersIndex({ users }: { users: User[] }) {
    return (
        <div className="container py-10">
            <DataTable columns={userColumns} data={users} />
        </div>
    );
}
```

### With Inertia.js Pagination

For server-side pagination, you might want to manage state differently:

```typescript
import { router } from '@inertiajs/react';

export default function UsersIndex({
    users,
    filters,
}: {
    users: { data: User[]; total: number };
    filters: any;
}) {
    const handleSearch = (value: string) => {
        router.get(
            '/users',
            { search: value },
            { preserveState: true, replace: true }
        );
    };

    // Use client-side DataTable for current page data
    return <DataTable columns={columns} data={users.data} />;
}
```

## Troubleshooting

### Table not showing data

- Ensure `columns` and `data` are properly defined
- Check that column `accessorKey` matches your data properties
- Verify data is not undefined or null

### Filters not working

- Make sure `searchColumnId` matches a column's `id` or `accessorKey`
- For custom filters, verify `columnId` is correct
- Check that `filterFn` is properly defined in column definition

### Selection not working

- Ensure you have a `select` column defined
- Check that `enableRowSelection` is not set to `false`
- Verify Checkbox component is properly imported

## Support

For issues or questions:

1. Check this documentation
2. Review the component source code
3. Check TanStack Table documentation: https://tanstack.com/table
