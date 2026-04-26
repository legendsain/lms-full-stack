import React, { useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// ====================================================================
// DAGRE LAYOUT ENGINE
// ====================================================================
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 50;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = {
            ...node,
            targetPosition: direction === 'TB' ? Position.Top : Position.Left,
            sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
        return newNode;
    });

    return { nodes: newNodes, edges };
};

// ====================================================================
// CUSTOM NODES
// ====================================================================
const CustomInputNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-6 py-3 bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-lg shadow-md shadow-brand-500/30 border-2 border-brand-400/50 min-w-[180px] max-w-[240px] text-center select-none relative">
        {targetPosition && <Handle type="target" position={targetPosition} className="!w-2 !h-2 !bg-brand-300 !border-2 !border-white" />}
        <div className="text-sm font-extrabold leading-snug">{data.label}</div>
        {sourcePosition && <Handle type="source" position={sourcePosition} className="!w-2 !h-2 !bg-brand-300 !border-2 !border-white" />}
    </div>
);

const CustomDefaultNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-5 py-3 bg-white border-2 border-surface-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-300 min-w-[180px] max-w-[240px] text-center select-none relative">
        {targetPosition && <Handle type="target" position={targetPosition} className="!w-2 !h-2 !bg-surface-400 !border-2 !border-white" />}
        <div className="text-sm font-bold text-surface-800 leading-snug">{data.label}</div>
        {sourcePosition && <Handle type="source" position={sourcePosition} className="!w-2 !h-2 !bg-surface-400 !border-2 !border-white" />}
    </div>
);

const nodeTypes = {
    input: CustomInputNode,
    default: CustomDefaultNode,
    // Fallbacks for legacy nodes
    root: CustomInputNode,
    branch: CustomDefaultNode,
    leaf: CustomDefaultNode,
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================
const ReactFlowDiagram = ({ diagramData, height = '550px' }) => {

    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep',
        animated: true,
        style: {
            stroke: '#a5b4fc',
            strokeWidth: 2,
        },
    }), []);

    // Prepare initial state from props + run layout
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!diagramData?.nodes) return { initialNodes: [], initialEdges: [] };

        let parsedNodes = diagramData.nodes.map(node => ({
            ...node,
            type: node.type || 'default',
            data: { label: node.data?.label || 'Untitled' },
            position: { x: 0, y: 0 },
        }));

        let parsedEdges = (diagramData.edges || []).map(edge => ({
            ...edge,
            id: edge.id || `e${edge.source}-${edge.target}`,
            source: String(edge.source),
            target: String(edge.target),
        }));

        const direction = diagramData.suggestedLayout || 'TB';
        const layouted = getLayoutedElements(parsedNodes, parsedEdges, direction);

        return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
    }, [diagramData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    if (!diagramData || !diagramData.nodes || diagramData.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center text-surface-400 py-16" style={{ height }}>
                <div className="text-center">
                    <div className="text-4xl mb-3">🗺️</div>
                    <p className="font-medium">No diagram data available</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-surface-200 bg-white">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
                minZoom={0.2}
                maxZoom={3}
                proOptions={{ hideAttribution: true }}
                className="bg-[#fafbff]"
            >
                <Background variant="dots" gap={20} size={1} color="#e0e7ff" />
                <Controls className="!bg-white !border-surface-200 !rounded-xl !shadow-card" showInteractive={false} />
                <MiniMap
                    nodeStrokeColor={(n) => n.type === 'input' || n.type === 'root' ? '#4f46e5' : '#d4d4d4'}
                    nodeColor={(n) => n.type === 'input' || n.type === 'root' ? '#6366f1' : '#f5f5f5'}
                    maskColor="rgba(250, 250, 255, 0.85)"
                    className="!bg-white/80 !border-surface-200 !rounded-xl !shadow-sm"
                    pannable
                    zoomable
                />
            </ReactFlow>
        </div>
    );
};

export default ReactFlowDiagram;
