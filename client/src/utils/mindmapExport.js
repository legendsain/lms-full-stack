export const convertToMarkdown = (nodes, edges) => {
    const root = nodes.find(n => n.type === 'root');
    if (!root) return "# Invalid MindMap\nNo root node found.";

    let markdown = `# ${root.data.label}\n\n`;
    if (root.data.description) markdown += `${root.data.description}\n\n`;

    // Recursive function to build the markdown tree
    const buildTree = (parentId, level) => {
        const childrenEdges = edges.filter(e => e.source === parentId);
        
        childrenEdges.forEach(edge => {
            const child = nodes.find(n => n.id === edge.target);
            if (!child) return;

            const indent = "  ".repeat(level);
            const prefix = level === 0 ? "## " : level === 1 ? "### " : "- ";
            
            markdown += `${indent}${prefix}${child.data.label}\n`;
            if (child.data.description) {
                markdown += `${indent}  > ${child.data.description}\n`;
            }
            if (child.data.resources && child.data.resources.length > 0) {
                markdown += `${indent}  *Resources:*\n`;
                child.data.resources.forEach(res => {
                    markdown += `${indent}    - [${res.title}](${res.url})\n`;
                });
            }
            markdown += "\n";

            buildTree(child.id, level + 1);
        });
    };

    buildTree(root.id, 0);
    return markdown;
};

export const exportToMarkdownFile = (nodes, edges, filename = 'study-notes.md') => {
    const md = convertToMarkdown(nodes, edges);
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    a.click();
};

export const convertToCourseOutline = (nodes, edges) => {
    // branches -> modules, subBranches -> lessons, leaves -> topics
    const root = nodes.find(n => n.type === 'root');
    if (!root) return null;

    const course = {
        courseTitle: root.data.label,
        courseDescription: root.data.description || "",
        modules: []
    };

    const branches = edges.filter(e => e.source === root.id).map(e => nodes.find(n => n.id === e.target)).filter(Boolean);

    branches.forEach(branch => {
        const module = {
            moduleTitle: branch.data.label,
            lessons: []
        };

        const subBranches = edges.filter(e => e.source === branch.id).map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
        
        subBranches.forEach(sub => {
            const lesson = {
                lessonTitle: sub.data.label,
                topics: []
            };

            const leaves = edges.filter(e => e.source === sub.id).map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
            leaves.forEach(leaf => {
                lesson.topics.push({
                    topicTitle: leaf.data.label,
                    description: leaf.data.description,
                    resources: leaf.data.resources || []
                });
            });

            module.lessons.push(lesson);
        });

        course.modules.push(module);
    });

    return course;
};
