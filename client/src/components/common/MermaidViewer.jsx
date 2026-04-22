import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid with custom mind map settings
mermaid.initialize({
    startOnLoad: false,
    theme: 'default', // You can change this to 'dark', 'forest', or 'neutral' later if you want!
    securityLevel: 'loose',
    mindmap: { padding: 20 }
});

const MermaidViewer = ({ chartSyntax }) => {
    const containerRef = useRef(null);
    const [svgCode, setSvgCode] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const renderChart = async () => {
            if (!chartSyntax) return;
            
            try {
                setError(false);
                // 1. Generate a random ID so multiple maps on the same page don't conflict
                const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;
                
                // 2. Safely tell Mermaid to convert the text into an SVG image
                const { svg } = await mermaid.render(id, chartSyntax);
                setSvgCode(svg);
            } catch (err) {
                console.error("Mermaid parsing error:", err);
                setError(true);
            }
        };

        renderChart();
    }, [chartSyntax]);

    // 3. Fallback UI if the AI generates bad syntax
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium">
                Oops! The AI generated invalid mind map syntax. Please click "Generate" to try again.
            </div>
        );
    }

    // 4. Render the beautiful SVG
    return (
        <div 
            ref={containerRef} 
            className="w-full overflow-x-auto bg-white rounded-lg p-6 flex justify-center"
            // This is safe because mermaid.render() sanitizes the SVG against XSS attacks
            dangerouslySetInnerHTML={{ __html: svgCode }} 
        />
    );
};

export default MermaidViewer;