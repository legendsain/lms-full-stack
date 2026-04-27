/**
 * Converts a flat React Flow JSON structure (nodes/edges) into a nested
 * hierarchical JSON structure required by react-d3-tree.
 * 
 * @param {Array} nodes - React Flow nodes array
 * @param {Array} edges - React Flow edges array
 * @returns {Object} - Nested hierarchy object { name, attributes, children }
 */
export const convertReactFlowToD3Tree = (nodes, edges) => {
    if (!nodes || nodes.length === 0) return null;

    // 1. Identify the root node
    // It's either explicitly marked as type 'root'/'input', or it's the node with no incoming edges.
    let rootNode = nodes.find(n => n.type === 'root' || n.type === 'input');
    
    if (!rootNode) {
        // Find node with no incoming edges
        const targetIds = new Set(edges.map(e => e.target));
        rootNode = nodes.find(n => !targetIds.has(n.id));
    }
    
    // Fallback if there are cycles or weird data
    if (!rootNode) rootNode = nodes[0];

    // 2. Recursive function to build the tree
    const buildTree = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;

        // D3 Tree expects a specific format
        const treeNode = {
            name: node.data.label || "Unnamed",
            attributes: { ...node.data },
            // Keep the original styling/types if needed for custom rendering
            _originalType: node.type, 
            _originalStyle: node.style
        };

        // Find all children connected via edges
        const childrenEdges = edges.filter(e => e.source === nodeId);
        
        if (childrenEdges.length > 0) {
            treeNode.children = [];
            childrenEdges.forEach(edge => {
                const childTree = buildTree(edge.target);
                if (childTree) {
                    treeNode.children.push(childTree);
                }
            });
        }

        return treeNode;
    };

    return buildTree(rootNode.id);
};
