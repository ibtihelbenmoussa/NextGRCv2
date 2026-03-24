import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Building2, Minus, Plus } from 'lucide-react';
import { memo } from 'react';

export type OrganizationNodeData = {
    label: string;
    code?: string;
    business_units_count?: number;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    onToggleCollapse?: () => void;
    onClick?: () => void;
};

export type OrganizationNodeType = Node<OrganizationNodeData, 'organization'>;

export const OrganizationNode = memo(
    ({ data }: NodeProps<OrganizationNodeType>) => {
        return (
            <div
                className="group relative w-[320px] cursor-pointer rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 transition-all hover:border-blue-400 hover:from-blue-100 hover:to-blue-200 dark:border-blue-700 dark:from-blue-950 dark:to-blue-900 dark:hover:border-blue-600"
                onClick={(e) => {
                    // Don't trigger dialog when clicking collapse button
                    if (!(e.target as HTMLElement).closest('button')) {
                        data.onClick?.();
                    }
                }}
            >
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-3 !w-3 !border-2 !border-blue-500 !bg-white dark:!bg-blue-900"
                />

                {/* Header with icon and collapse button */}
                <div className="flex items-start gap-3 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                                Organization
                            </span>
                            {data.code && (
                                <span className="rounded-md bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                                    {data.code}
                                </span>
                            )}
                        </div>
                        <h3
                            className="truncate text-base font-bold text-gray-900 dark:text-gray-100"
                            title={data.label}
                        >
                            {data.label}
                        </h3>
                    </div>

                    {data.hasChildren && data.onToggleCollapse && (
                        <button
                            onClick={data.onToggleCollapse}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-200 text-blue-700 transition-all hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700"
                            title={data.isCollapsed ? 'Expand' : 'Collapse'}
                        >
                            {data.isCollapsed ? (
                                <Plus className="h-4 w-4" />
                            ) : (
                                <Minus className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Footer stats */}
                {data.business_units_count !== undefined && (
                    <div className="border-t border-blue-200 bg-blue-50/50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950/50">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                            <span>
                                {data.business_units_count} Business Unit
                                {data.business_units_count !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

OrganizationNode.displayName = 'OrganizationNode';
