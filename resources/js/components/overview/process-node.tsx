import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Workflow } from 'lucide-react';
import { memo } from 'react';

export type ProcessNodeData = {
    label: string;
    code?: string;
    risks_count?: number;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    onClick?: () => void;
};

export type ProcessNodeType = Node<ProcessNodeData, 'process'>;

export const ProcessNode = memo(({ data }: NodeProps<ProcessNodeType>) => {
    return (
        <div
            className="group relative w-[320px] cursor-pointer rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100 transition-all hover:border-orange-400 hover:from-orange-100 hover:to-amber-200 dark:border-orange-700 dark:from-orange-950 dark:to-amber-900 dark:hover:border-orange-600"
            onClick={() => data.onClick?.()}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !border-2 !border-orange-500 !bg-white dark:!bg-orange-900"
            />

            {/* Header with icon */}
            <div className="flex items-start gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                    <Workflow className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
                            Process
                        </span>
                        {data.code && (
                            <span className="rounded-md bg-orange-200 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-800 dark:text-orange-300">
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
            </div>

            {/* Footer stats */}
            {data.risks_count !== undefined && (
                <div className="border-t border-orange-200 bg-orange-50/50 px-4 py-2 dark:border-orange-800 dark:bg-orange-950/50">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                        <span>
                            {data.risks_count} Risk
                            {data.risks_count !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

ProcessNode.displayName = 'ProcessNode';
