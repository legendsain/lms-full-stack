import React, { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ====================================================================
// CUSTOM NODE: Root (Central Topic)
// ====================================================================
const RootNode = ({ data }) => (
    <div className="px-6 py-4 bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-brand-500/20 border-2 border-brand-400/30 min-w-[180px] max-w-[240px] text-center select-none">
        <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Core Concept</div>
        <div className="text-base font-extrabold leading-snug">{data.label}</div>
    </div>
);

// ====================================================================
// CUSTOM NODE: Branch (Major Subtopic)
// ====================================================================
const BranchNode = ({ data }) => (
    <div className="px-5 py-3.5 bg-white border-2 border-brand-200 rounded-xl shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-300 min-w-[140px] max-w-[200px] text-center select-none">
        <div className="text-sm font-bold text-surface-800 leading-snug">{data.label}</div>
    </div>
);

// ====================================================================
// CUSTOM NODE: Leaf (Detail / Action)
// ====================================================================
const LeafNode = ({ data }) => (
    <div className="px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-lg shadow-sm hover:bg-surface-100 transition-all duration-200 min-w-[110px] max-w-[180px] text-center select-none">
        <div className="text-xs font-medium text-surface-600 leading-snug">{data.label}</div>
    </div>
);

// ====================================================================
// MAIN COMPONENT
// ====================================================================
const ReactFlowDiagram = ({ diagramData, height = '550px' }) => {

    // Register custom node types
    const nodeTypes = useMemo(() => ({
        root: RootNode,
        branch: BranchNode,
        leaf: LeafNode,
    }), []);

    // Default edge styling
    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep',
        animated: false,
        style: {
            stroke: '#a5b4fc',
            strokeWidth: 2,
        },
    }), []);

    // Prepare initial state from props
    const initialNodes = useMemo(() => {
        if (!diagramData?.nodes) return [];
        return diagramData.nodes.map(node => ({
            ...node,
            // Ensure type fallback
            type: node.type || 'branch',
            data: { label: node.data?.label || 'Untitled' },
            position: {
                x: Number(node.position?.x) || 0,
                y: Number(node.position?.y) || 0,
            },
        }));
    }, [diagramData]);

    const initialEdges = useMemo(() => {
        if (!diagramData?.edges) return [];
        return diagramData.edges.map(edge => ({
            ...edge,
            id: edge.id || `e${edge.source}-${edge.target}`,
            source: String(edge.source),
            target: String(edge.target),
        }));
    }, [diagramData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
        console.log("Parsed Edges:", diagramData?.edges);
    }, [initialNodes, initialEdges, setNodes, setEdges, diagramData]);

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
                <Background
                    variant="dots"
                    gap={20}
                    size={1}
                    color="#e0e7ff"
                />
                <Controls
                    className="!bg-white !border-surface-200 !rounded-xl !shadow-card"
                    showInteractive={false}
                />
                <MiniMap
                    nodeStrokeColor={(n) => {
                        if (n.type === 'root') return '#4f46e5';
                        if (n.type === 'branch') return '#818cf8';
                        return '#d4d4d4';
                    }}
                    nodeColor={(n) => {
                        if (n.type === 'root') return '#6366f1';
                        if (n.type === 'branch') return '#e0e7ff';
                        return '#f5f5f5';
                    }}
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
