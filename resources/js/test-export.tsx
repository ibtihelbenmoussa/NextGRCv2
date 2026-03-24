import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

// Mock data type
interface TestData {
    id: number;
    name: string;
    email: string;
    status: string;
}

// Mock data
const mockData = {
    data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive' },
    ] as TestData[],
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 1,
    to: 3,
    total: 3,
    prev_page_url: null,
    next_page_url: null,
};

export default function TestExport() {
    const [exportLoading, setExportLoading] = useState(false);

    // Mock export handler
    const handleExport = () => {
        setExportLoading(true);
        console.log('Export button clicked!');

        // Simulate export process
        setTimeout(() => {
            setExportLoading(false);
            alert('Export would happen here!');
        }, 2000);
    };

    // Define columns
    const columns: ColumnDef<TestData>[] = [
        {
            accessorKey: 'id',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="ID" />
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Email" />
            ),
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
        },
    ];

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Test Export Button</h1>
                <p className="text-muted-foreground">
                    This component tests if the export button appears and works.
                </p>
            </div>

            <ServerDataTable
                columns={columns}
                data={mockData}
                searchPlaceholder="Search test data..."
                onExport={handleExport}
                exportLoading={exportLoading}
            />

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p><strong>Expected behavior:</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                    <li>Export Excel button should appear in the top-right toolbar</li>
                    <li>Button should show "Export Excel" with spreadsheet icon</li>
                    <li>When clicked, should show "Exporting..." and be disabled</li>
                    <li>After 2 seconds, should show alert and return to normal state</li>
                </ul>
            </div>
        </div>
    );
}
