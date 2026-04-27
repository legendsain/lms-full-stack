import React, { useMemo, useState } from 'react';
import Tree from 'react-d3-tree';
import { convertReactFlowToD3Tree } from '../../utils/treeConverter';

// Custom Node Renderer for NotebookLM Aesthetic
const renderCustomNode = ({ nodeDatum, toggleNode }) => {
    // Determine styles based on hierarchy/type
    const isRoot = nodeDatum._originalType === 'root' || nodeDatum._originalType === 'input';
    const isLeaf = !nodeDatum.children || nodeDatum.children.length === 0;
    
    // Width and height of the HTML card
    const cardWidth = 240;
    const cardHeight = isRoot ? 80 : 60;
    
    // Centers the card relative to the SVG anchor
    // For horizontal tree, we want the node to start at the anchor, so xOffset is 0
    // But for a balanced look, we shift it slightly.
    const xOffset = 0;
    const yOffset = -(cardHeight / 2);

    return (
        <g>
            <foreignObject x={xOffset} y={yOffset} width={cardWidth} height={cardHeight}>
                <div 
                    onClick={toggleNode}
                    className={`
                        w-full h-full flex flex-col items-center justify-center p-3 cursor-pointer
                        bg-white border rounded-xl shadow-sm transition-all duration-300 relative
                        ${isRoot ? 'border-brand-500 shadow-brand-100/50 border-2' : 'border-surface-200 hover:border-brand-400 hover:shadow-md'}
                    `}
                    style={{
                        // Use inline styles if AI provided specific colors
                        backgroundColor: nodeDatum._originalStyle?.backgroundColor || '#ffffff',
                        borderColor: nodeDatum._originalStyle?.borderColor || (isRoot ? '#6366f1' : '#cbd5e1'),
                        color: nodeDatum._originalStyle?.color || '#0f172a'
                    }}
                >
                    <div className={`text-center font-bold text-sm leading-tight ${isRoot ? 'text-base' : ''}`}>
                        {nodeDatum.name}
                    </div>
                    {/* Collapsible indicator for branches */}
                    {!isLeaf && (
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-surface-300 rounded-full w-5 h-5 flex items-center justify-center text-[12px] text-surface-500 font-black shadow-sm z-10 transition-colors hover:bg-surface-50 hover:text-brand-600">
                            {nodeDatum.__rd3t.collapsed ? '+' : '-'}
                        </div>
                    )}
                </div>
            </foreignObject>
        </g>
    );
};

const NotebookLMMindMap = ({ diagramData, height = "100%", zoom = 0.8 }) => {
    // We need a ref and state to center the tree properly
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        if (containerRef.current) {
            const dimensions = containerRef.current.getBoundingClientRect();
            setTranslate({
                x: dimensions.width * 0.15, // Start 15% from the left edge
                y: dimensions.height / 2,   // Center vertically
            });
        }
    }, [diagramData]); // Re-calculate if diagram changes causing re-render

    const d3Data = useMemo(() => {
        if (!diagramData || !diagramData.nodes || diagramData.nodes.length === 0) return null;
        return convertReactFlowToD3Tree(diagramData.nodes, diagramData.edges);
    }, [diagramData]);

    if (!d3Data) {
        return <div className="p-8 text-center text-surface-500 font-medium bg-surface-50 h-full flex items-center justify-center">Invalid or Empty Diagram Data</div>;
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height }} className="bg-surface-50/30 overflow-hidden rounded-xl">
            <Tree 
                data={d3Data} 
                orientation="horizontal" 
                pathFunc="diagonal"
                translate={translate}
                renderCustomNodeElement={renderCustomNode}
                nodeSize={{ x: 300, y: 80 }} // Spacing between nodes: x is horizontal spacing, y is vertical spacing
                separation={{ siblings: 1.2, nonSiblings: 1.5 }}
                zoom={zoom}
                zoomable={true}
                draggable={true}
                collapsible={true}
                pathProps={{
                    className: 'link',
                    stroke: '#cbd5e1', // Soft slate color matching UI
                    strokeWidth: '2px',
                    fill: 'none',
                }}
                enableLegacyTransitions={true}
                transitionDuration={400}
            />
        </div>
    );
};

export default NotebookLMMindMap;
