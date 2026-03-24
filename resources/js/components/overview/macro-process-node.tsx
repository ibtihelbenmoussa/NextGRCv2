import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { GitBranch, Minus, Plus } from 'lucide-react';
import { memo } from 'react';

export type MacroProcessNodeData = {
    label: string;
    code?: string;
    processes_count?: number;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    onToggleCollapse?: () => void;
    onClick?: () => void;
};

export type MacroProcessNodeType = Node<MacroProcessNodeData, 'macroProcess'>;

export const MacroProcessNode = memo(
    ({ data }: NodeProps<MacroProcessNodeType>) => {
        return (
            <div
                className="group relative w-[320px] cursor-pointer rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-100 transition-all hover:border-purple-400 hover:from-purple-100 hover:to-violet-200 dark:border-purple-700 dark:from-purple-950 dark:to-violet-900 dark:hover:border-purple-600"
                onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('button')) {
                        data.onClick?.();
                    }
                }}
            >
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!h-3 !w-3 !border-2 !border-purple-500 !bg-white dark:!bg-purple-900"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-3 !w-3 !border-2 !border-purple-500 !bg-white dark:!bg-purple-900"
                />

                {/* Header with icon and collapse button */}
                <div className="flex items-start gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                        <GitBranch className="h-6 w-6 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-wide text-purple-600 uppercase dark:text-purple-400">
                                Macro Process
                            </span>
                            {data.code && (
                                <span className="rounded-md bg-purple-200 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-800 dark:text-purple-300">
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
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-purple-700 transition-all hover:bg-purple-300 dark:bg-purple-800 dark:text-purple-300 dark:hover:bg-purple-700"
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
                {data.processes_count !== undefined && (
                    <div className="border-t border-purple-200 bg-purple-50/50 px-4 py-2 dark:border-purple-800 dark:bg-purple-950/50">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                            <span>
                                {data.processes_count} Process
                                {data.processes_count !== 1 ? 'es' : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

MacroProcessNode.displayName = 'MacroProcessNode';
