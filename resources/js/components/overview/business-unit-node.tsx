import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Briefcase, Minus, Plus } from 'lucide-react';
import { memo } from 'react';

export type BusinessUnitNodeData = {
    label: string;
    code?: string;
    macro_processes_count?: number;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    onToggleCollapse?: () => void;
    onClick?: () => void;
};

export type BusinessUnitNodeType = Node<BusinessUnitNodeData, 'businessUnit'>;

export const BusinessUnitNode = memo(
    ({ data }: NodeProps<BusinessUnitNodeType>) => {
        return (
            <div
                className="group relative w-[320px] cursor-pointer rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-100 transition-all hover:border-green-400 hover:from-green-100 hover:to-emerald-200 dark:border-green-700 dark:from-green-950 dark:to-emerald-900 dark:hover:border-green-600"
                onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('button')) {
                        data.onClick?.();
                    }
                }}
            >
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-green-900"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-green-900"
                />

                {/* Header with icon and collapse button */}
                <div className="flex items-start gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                        <Briefcase className="h-6 w-6 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">
                                Business Unit
                            </span>
                            {data.code && (
                                <span className="rounded-md bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-800 dark:text-green-300">
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
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-200 text-green-700 transition-all hover:bg-green-300 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700"
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
                {data.macro_processes_count !== undefined && (
                    <div className="border-t border-green-200 bg-green-50/50 px-4 py-2 dark:border-green-800 dark:bg-green-950/50">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                            <span>
                                {data.macro_processes_count} Macro Process
                                {data.macro_processes_count !== 1 ? 'es' : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

BusinessUnitNode.displayName = 'BusinessUnitNode';
