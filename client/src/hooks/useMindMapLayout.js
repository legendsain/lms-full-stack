import { useEffect, useState, useCallback } from 'react';
import { useNodesInitialized, useReactFlow } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import * as d3 from 'd3-hierarchy';

const elk = new ELK();

export const useMindMapLayout = (initialNodes, initialEdges, options = {}) => {
    const { engine = 'dagre', direction = 'LR' } = options;
    const { getNodes, fitView } = useReactFlow();
    const nodesInitialized = useNodesInitialized();
    const [layoutedNodes, setLayoutedNodes] = useState([]);
    const [layoutedEdges, setLayoutedEdges] = useState([]);
    const [isLayouting, setIsLayouting] = useState(true);

    const runLayout = useCallback(async () => {
        // Wait until React Flow has rendered the nodes so we can measure them
        if (!nodesInitialized || initialNodes.length === 0) return;
        setIsLayouting(true);
        
        // Fetch current dimensions directly from the React Flow internal store
        const currentNodes = getNodes();
        
        const nodesWithDim = initialNodes.map(n => {
            const measured = currentNodes.find(cn => cn.id === n.id);
            return {
                ...n,
                measured: {
                    width: measured?.measured?.width || 200,
                    height: measured?.measured?.height || 80
                }
            };
        });

        try {
            let resultNodes = [];
            let resultEdges = initialEdges;

            if (engine === 'dagre') {
                const g = new dagre.graphlib.Graph();
                g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 90, edgesep: 20 });
                g.setDefaultEdgeLabel(() => ({}));

                nodesWithDim.forEach(n => g.setNode(n.id, { width: n.measured.width, height: n.measured.height }));
                initialEdges.forEach(e => g.setEdge(e.source, e.target));

                dagre.layout(g);

                resultNodes = nodesWithDim.map(node => {
                    const nodeWithPosition = g.node(node.id);
                    return {
                        ...node,
                        position: {
                            x: nodeWithPosition.x - node.measured.width / 2,
                            y: nodeWithPosition.y - node.measured.height / 2
                        }
                    };
                });
            } else if (engine === 'elk') {
                const isRadial = direction === 'RADIAL';
                const elkGraph = {
                    id: 'root',
                    layoutOptions: isRadial ? {
                        'elk.algorithm': 'radial'
                    } : {
                        'elk.algorithm': 'layered',
                        'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
                        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
                        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
                        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                        'elk.spacing.nodeNode': '40',
                        'elk.edgeRouting': 'ORTHOGONAL'
                    },
                    children: nodesWithDim.map(n => ({ id: n.id, width: n.measured.width, height: n.measured.height })),
                    edges: initialEdges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
                };

                const layoutedGraph = await elk.layout(elkGraph);
                resultNodes = nodesWithDim.map(node => {
                    const elkNode = layoutedGraph.children.find(n => n.id === node.id);
                    return {
                        ...node,
                        position: { x: elkNode.x, y: elkNode.y }
                    };
                });
            } else if (engine === 'd3') {
                const rootNode = nodesWithDim.find(n => n.type === 'root') || nodesWithDim[0];
                const stratify = d3.stratify()
                    .id(d => d.id)
                    .parentId(d => {
                        const edge = initialEdges.find(e => e.target === d.id);
                        return edge ? edge.source : null;
                    });
                
                try {
                    const root = stratify(nodesWithDim);
                    const treeLayout = d3.tree().nodeSize([100, 200]);
                    treeLayout(root);

                    resultNodes = nodesWithDim.map(node => {
                        const d3Node = root.descendants().find(d => d.id === node.id);
                        if (!d3Node) return node;

                        if (direction === 'RADIAL') {
                            const angle = d3Node.x;
                            const radius = d3Node.y;
                            return {
                                ...node,
                                position: {
                                    x: radius * Math.cos(angle - Math.PI / 2),
                                    y: radius * Math.sin(angle - Math.PI / 2)
                                }
                            };
                        } else {
                            return {
                                ...node,
                                position: { x: d3Node.y, y: d3Node.x }
                            };
                        }
                    });
                } catch(e) {
                    console.error("D3 hierarchy failed. Graph may not be a strict tree.", e);
                    resultNodes = initialNodes;
                }
            }

            setLayoutedNodes(resultNodes);
            setLayoutedEdges(resultEdges);
            
            // Allow React Flow to render the new positions, then fit view
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 800 });
                setIsLayouting(false);
            }, 50);

        } catch (err) {
            console.error("Layout engine failed:", err);
            setLayoutedNodes(initialNodes);
            setLayoutedEdges(initialEdges);
            setIsLayouting(false);
        }
    }, [initialNodes, initialEdges, engine, direction, nodesInitialized, getNodes, fitView]);

    useEffect(() => {
        runLayout();
    }, [runLayout]);

    return { layoutedNodes, layoutedEdges, relayout: runLayout, isLayouting };
};
