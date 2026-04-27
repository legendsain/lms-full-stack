import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Panel,
    SmoothStepEdge,
    BezierEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { nodeTypes } from './MindMapNodes';
import { getLayoutedElements } from '../../hooks/useMindMapLayout';
import { exportToMarkdownFile, convertToCourseOutline } from '../../utils/mindmapExport';
import { toast } from 'react-toastify';

// Custom Edge to inherit color
const MindMapEdge = (props) => {
    // For now we just use a smooth step edge. We could customize colors based on source node.
    return <SmoothStepEdge {...props} />;
};

const edgeTypes = {
    mindmapEdge: MindMapEdge,
    smoothstep: SmoothStepEdge,
    bezier: BezierEdge
};

const Flow = ({ initialNodes, initialEdges, direction = 'TB' }) => {
    const { fitView } = useReactFlow();
    const flowRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeData, setSelectedNodeData] = useState(null);

    const onNodeClick = useCallback((_, node) => {
        setSelectedNodeData(node.data);
    }, []);

    const handleResetLayout = useCallback(() => {
        // In Part 5, this will re-trigger the layout engine
        const layouted = getLayoutedElements(initialNodes, initialEdges, direction);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
    }, [initialNodes, initialEdges, direction, setNodes, setEdges, fitView]);

    const handleExportPng = useCallback(() => {
        if (flowRef.current === null) return;
        toPng(flowRef.current, { backgroundColor: '#ffffff' })
            .then((dataUrl) => {
                const a = document.createElement('a');
                a.setAttribute('download', 'mindmap.png');
                a.setAttribute('href', dataUrl);
                a.click();
            });
    }, []);

    const handleExportJson = useCallback(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
        const a = document.createElement('a');
        a.setAttribute('href', dataStr);
        a.setAttribute('download', 'mindmap.json');
        a.click();
    }, [nodes, edges]);

    const handleExportMd = useCallback(() => {
        exportToMarkdownFile(nodes, edges);
    }, [nodes, edges]);

    const handleConvertToCourse = useCallback(() => {
        const course = convertToCourseOutline(nodes, edges);
        if (course) {
            console.log("Draft Course Created:", course);
            toast.success("Converted to Course Outline! (Check console for draft data)");
        } else {
            toast.error("Failed to convert: No root node found.");
        }
    }, [nodes, edges]);

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'f') fitView({ padding: 0.2, duration: 800 });
            if (e.key.toLowerCase() === 'r') handleResetLayout();
            if (e.key.toLowerCase() === 'e') handleExportPng();
            if (e.key.toLowerCase() === 'j') handleExportJson();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fitView, handleResetLayout, handleExportPng, handleExportJson]);

    return (
        <div className="flex w-full h-full relative" ref={flowRef}>
            <div className="flex-1 h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    nodesDraggable={true}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant="dots" gap={20} size={1} color="#cbd5e1" />
                    <Controls />
                    <MiniMap maskColor="rgba(255, 255, 255, 0.8)" />
                    
                    <Panel position="top-right" className="flex gap-2">
                        <button onClick={handleResetLayout} className="px-3 py-1.5 bg-white border border-surface-200 rounded-md text-xs font-medium shadow-sm hover:bg-surface-50">
                            Reset Layout (R)
                        </button>
                        <button onClick={handleExportMd} className="px-3 py-1.5 bg-white border border-surface-200 rounded-md text-xs font-medium shadow-sm hover:bg-surface-50">
                            Export Markdown
                        </button>
                        <button onClick={handleExportPng} className="px-3 py-1.5 bg-white border border-surface-200 rounded-md text-xs font-medium shadow-sm hover:bg-surface-50">
                            Export PNG (E)
                        </button>
                        <button onClick={handleConvertToCourse} className="px-3 py-1.5 bg-brand-600 text-white border border-brand-700 rounded-md text-xs font-bold shadow-sm hover:bg-brand-700">
                            Convert to Course
                        </button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Right Drawer */}
            {selectedNodeData && (
                <div className="w-80 bg-white border-l border-surface-200 shadow-2xl h-full p-6 overflow-y-auto flex flex-col z-10 absolute right-0 top-0">
                    <button 
                        onClick={() => setSelectedNodeData(null)}
                        className="self-end text-surface-400 hover:text-surface-700"
                    >
                        ✕
                    </button>
                    <h3 className="text-xl font-bold text-surface-900 mt-2">{selectedNodeData.label}</h3>
                    <div className="mt-4">
                        <h4 className="text-xs font-bold uppercase text-surface-500 mb-1">Description</h4>
                        <p className="text-sm text-surface-700 leading-relaxed">{selectedNodeData.description || "No description provided."}</p>
                    </div>

                    {selectedNodeData.keywords?.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase text-surface-500 mb-2">Keywords</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedNodeData.keywords.map(kw => (
                                    <span key={kw} className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] rounded-full font-bold">{kw}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedNodeData.estimatedMinutes && (
                        <div className="mt-6 flex items-center gap-2 text-sm text-surface-600">
                            <span>⏱️</span>
                            <span className="font-semibold">{selectedNodeData.estimatedMinutes} minutes to study</span>
                        </div>
                    )}

                    {selectedNodeData.resources?.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase text-surface-500 mb-2">Resources</h4>
                            <ul className="space-y-2">
                                {selectedNodeData.resources.map((res, i) => (
                                    <li key={i} className="text-sm border border-surface-200 p-2 rounded hover:bg-surface-50 transition-colors">
                                        <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                                            {res.kind === 'video' ? '▶️' : '📄'} {res.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MindMapCanvas = (props) => {
    return (
        <ReactFlowProvider>
            <Flow {...props} />
        </ReactFlowProvider>
    );
};

export default MindMapCanvas;
