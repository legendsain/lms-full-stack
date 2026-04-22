import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid with custom mind map settings
mermaid.initialize({
    startOnLoad: false,
    theme: 'default', 
    securityLevel: 'loose',
    mindmap: { padding: 20 }
});

const MermaidViewer = ({ chartSyntax }) => {
    const containerRef = useRef(null);
    const [svgCode, setSvgCode] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const renderChart = async () => {
            if (!chartSyntax) return;
            
            try {
                setError(false);
                // 1. Generate a valid HTML ID (must start with a letter)
                const id = `mermaid-chart-${Math.random().toString(36).substring(2, 10)}`;
                
                // 2. Safely tell Mermaid to convert the text into an SVG image
                const { svg } = await mermaid.render(id, chartSyntax);
                
                if (isMounted) {
                    setSvgCode(svg);
                }
            } catch (err) {
                console.error("Mermaid parsing error. Ensure syntax is valid:", err);
                if (isMounted) setError(true);
            }
        };

        renderChart();

        // Cleanup function to prevent state updates if unmounted
        return () => {
            isMounted = false;
        };
    }, [chartSyntax]);

    // 3. Fallback UI if the AI generates bad syntax
    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <h3 className="font-bold mb-2">Oops! Invalid Map Generated</h3>
                <p className="text-sm mb-4">The AI generated formatting that Mermaid.js couldn't understand. Please click "Generate" again.</p>
                <div className="bg-white p-4 rounded text-xs text-gray-800 font-mono overflow-x-auto border border-red-100">
                    <p className="font-bold text-red-500 mb-2">Raw Syntax Attempted:</p>
                    <pre>{chartSyntax}</pre>
                </div>
            </div>
        );
    }

    // 4. Render the beautiful SVG
    return (
        <div 
            ref={containerRef} 
            className="w-full overflow-x-auto bg-white rounded-lg p-6 flex justify-center items-center min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: svgCode }} 
        />
    );
};

export default MermaidViewer;