import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Edge,
    type Node,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type {
    BusinessUnit,
    MacroProcess,
    Organization,
    Process,
} from '@/types';
import { BusinessUnitNode } from './business-unit-node';
import { MacroProcessNode } from './macro-process-node';
import { NodeDetailsDialog, type NodeDetailsType } from './node-details-dialog';
import { OrganizationNode } from './organization-node';
import { ProcessNode } from './process-node';

interface OrganizationFlowProps {
    organization: Organization & {
        business_units?: (BusinessUnit & {
            macro_processes?: (MacroProcess & {
                processes?: Process[];
            })[];
        })[];
    };
}

const nodeTypes: NodeTypes = {
    organization: OrganizationNode,
    businessUnit: BusinessUnitNode,
    macroProcess: MacroProcessNode,
    process: ProcessNode,
};

const elk = new ELK();

// ELK layout options
const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '400',
    'elk.spacing.nodeNode': '50',
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
};

// Function to layout elements using ELK
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const graph = {
        id: 'root',
        layoutOptions: elkOptions,
        children: nodes.map((node) => ({
            ...node,
            targetPosition: 'left',
            sourcePosition: 'right',
            width: 320,
            height: 100,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => ({
            nodes: (layoutedGraph.children || []).map((node) => ({
                ...node,
                position: { x: node.x || 0, y: node.y || 0 },
            })),
            edges: edges,
        }))
        .catch((error) => {
            console.error('ELK layout error:', error);
            return { nodes, edges };
        });
};

export function OrganizationFlow({ organization }: OrganizationFlowProps) {
    const { fitView } = useReactFlow();

    // Dialog state
    const [selectedNode, setSelectedNode] = useState<NodeDetailsType | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleNodeClick = useCallback((nodeDetails: NodeDetailsType) => {
        setSelectedNode(nodeDetails);
        setDialogOpen(true);
    }, []);

    // Initialize collapsed nodes with all macro processes collapsed by default
    const initialCollapsedNodes = useMemo(() => {
        const collapsed = new Set<string>();
        const businessUnits = organization.business_units || [];

        businessUnits.forEach((bu) => {
            const macroProcesses = bu.macro_processes || [];
            macroProcesses.forEach((mp) => {
                collapsed.add(`mp-${mp.id}`);
            });
        });

        return collapsed;
    }, [organization]);

    // Track collapsed nodes
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
        initialCollapsedNodes,
    );

    const toggleNodeCollapse = useCallback((nodeId: string) => {
        setCollapsedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    // Build the node and edge data without layout positions
    const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        const businessUnits = organization.business_units || [];

        // Organization node
        const orgNodeId = `org-${organization.id}`;

        nodes.push({
            id: orgNodeId,
            type: 'organization',
            position: { x: 0, y: 0 }, // Will be updated by ELK
            data: {
                label: organization.name,
                code: organization.code,
                business_units_count: businessUnits.length,
                isCollapsed: collapsedNodes.has(orgNodeId),
                onToggleCollapse: () => toggleNodeCollapse(orgNodeId),
                hasChildren: businessUnits.length > 0,
                onClick: () =>
                    handleNodeClick({
                        type: 'organization',
                        id: organization.id,
                        name: organization.name,
                        code: organization.code,
                        business_units_count: businessUnits.length,
                    }),
            },
        });

        // If organization is collapsed, skip children
        if (collapsedNodes.has(orgNodeId)) {
            return { nodes, edges };
        }

        businessUnits.forEach((bu) => {
            const buNodeId = `bu-${bu.id}`;
            const macroProcesses = bu.macro_processes || [];

            // Business Unit node
            nodes.push({
                id: buNodeId,
                type: 'businessUnit',
                position: { x: 0, y: 0 }, // Will be updated by ELK
                data: {
                    label: bu.name,
                    code: bu.code,
                    macro_processes_count: macroProcesses.length,
                    isCollapsed: collapsedNodes.has(buNodeId),
                    onToggleCollapse: () => toggleNodeCollapse(buNodeId),
                    hasChildren: macroProcesses.length > 0,
                    onClick: () =>
                        handleNodeClick({
                            type: 'businessUnit',
                            id: bu.id,
                            name: bu.name,
                            code: bu.code,
                            macro_processes_count: macroProcesses.length,
                            organization_id: organization.id,
                        }),
                },
            });

            // Edge from organization to business unit
            edges.push({
                id: `org-${organization.id}-${buNodeId}`,
                source: orgNodeId,
                target: buNodeId,
                type: 'smoothstep',
                animated: false,
                style: { strokeWidth: 2, stroke: '#22c55e' },
            });

            // If BU is collapsed, skip its children
            if (collapsedNodes.has(buNodeId)) {
                return;
            }

            macroProcesses.forEach((mp) => {
                const mpNodeId = `mp-${mp.id}`;
                const processes = mp.processes || [];

                // Macro Process node
                nodes.push({
                    id: mpNodeId,
                    type: 'macroProcess',
                    position: { x: 0, y: 0 }, // Will be updated by ELK
                    data: {
                        label: mp.name,
                        code: mp.code,
                        processes_count: processes.length,
                        isCollapsed: collapsedNodes.has(mpNodeId),
                        onToggleCollapse: () => toggleNodeCollapse(mpNodeId),
                        hasChildren: processes.length > 0,
                        onClick: () =>
                            handleNodeClick({
                                type: 'macroProcess',
                                id: mp.id,
                                name: mp.name,
                                code: mp.code,
                                processes_count: processes.length,
                                business_unit_id: bu.id,
                            }),
                    },
                });

                // Edge from business unit to macro process
                edges.push({
                    id: `${buNodeId}-${mpNodeId}`,
                    source: buNodeId,
                    target: mpNodeId,
                    type: 'smoothstep',
                    animated: false,
                    style: { strokeWidth: 2, stroke: '#a855f7' },
                });

                // If MP is collapsed, skip its children
                if (collapsedNodes.has(mpNodeId)) {
                    return;
                }

                processes.forEach((p) => {
                    const pNodeId = `p-${p.id}`;

                    // Process node
                    nodes.push({
                        id: pNodeId,
                        type: 'process',
                        position: { x: 0, y: 0 }, // Will be updated by ELK
                        data: {
                            label: p.name,
                            code: p.code,
                            risks_count: p.risks_count,
                            isCollapsed: false,
                            hasChildren: false,
                            onClick: () =>
                                handleNodeClick({
                                    type: 'process',
                                    id: p.id,
                                    name: p.name,
                                    code: p.code,
                                    risks_count: p.risks_count,
                                    macro_process_id: mp.id,
                                }),
                        },
                    });

                    // Edge from macro process to process
                    edges.push({
                        id: `${mpNodeId}-${pNodeId}`,
                        source: mpNodeId,
                        target: pNodeId,
                        type: 'smoothstep',
                        animated: false,
                        style: { strokeWidth: 2, stroke: '#f97316' },
                    });
                });
            });
        });

        return { nodes, edges };
    }, [organization, collapsedNodes, toggleNodeCollapse, handleNodeClick]);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const isInitialLoad = useRef(true);

    // Apply ELK layout whenever raw nodes/edges change
    useLayoutEffect(() => {
        getLayoutedElements(rawNodes, rawEdges).then(
            ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                setNodes(layoutedNodes as Node[]);
                setEdges(layoutedEdges as Edge[]);

                // Only fit view on initial load, not when collapsing/expanding
                if (isInitialLoad.current) {
                    window.requestAnimationFrame(() => {
                        fitView({ padding: 0.15, duration: 200 });
                    });
                    isInitialLoad.current = false;
                }
            },
        );
    }, [rawNodes, rawEdges, fitView, setNodes, setEdges]);

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.15,
                    minZoom: 0.3,
                    maxZoom: 1,
                }}
                minZoom={0.1}
                maxZoom={1.5}
                defaultEdgeOptions={{
                    style: { strokeWidth: 2 },
                }}
                proOptions={{ hideAttribution: true }}
                className="dark:bg-gray-900"
            >
                <Background className="dark:!bg-dark" />
                <Controls className="[&_button]:!border-gray-300 [&_button]:!bg-white [&_button]:!text-gray-700 dark:[&_button]:!border-gray-600 dark:[&_button]:!bg-gray-800 dark:[&_button]:!text-gray-200 [&_button:hover]:!bg-gray-50 dark:[&_button:hover]:!bg-gray-700" />
                <MiniMap
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'organization':
                                return '#3b82f6';
                            case 'businessUnit':
                                return '#22c55e';
                            case 'macroProcess':
                                return '#a855f7';
                            case 'process':
                                return '#f97316';
                            default:
                                return '#94a3b8';
                        }
                    }}
                    className="!border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
                    pannable
                    zoomable
                />
            </ReactFlow>

            <NodeDetailsDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                nodeDetails={selectedNode}
            />
        </div>
    );
}
