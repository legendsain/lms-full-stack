import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

const MermaidViewer = ({ chartSyntax }) => {
    const containerRef = useRef(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!chartSyntax || !containerRef.current) return;

        const renderChart = async () => {
            try {
                setError(false);
                containerRef.current.innerHTML = ''; 
                
                // --- THE CRITICAL FIX ---
                // Replace all invisible non-breaking spaces (\u00A0) with normal spaces
                const cleanSyntax = chartSyntax.replace(/\u00A0/g, " ").trim();
                
                const id = `mermaid-${Math.random().toString(36).substring(2, 10)}`;
                
                // Pass the cleaned syntax to Mermaid v11
                const renderResult = await mermaid.render(id, cleanSyntax);
                
                const svgText = typeof renderResult === 'string' ? renderResult : renderResult.svg;
                
                if (svgText) {
                     containerRef.current.innerHTML = svgText;
                } else {
                     throw new Error("Empty SVG generated");
                }
            } catch (err) {
                console.error("Mermaid parsing error:", err);
                setError(true);
            }
        };

        renderChart();
    }, [chartSyntax]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <p className="font-bold">Invalid Map Syntax Generated</p>
                <p className="text-sm">Mermaid.js could not render the diagram.</p>
                <pre className="text-xs bg-white p-2 mt-2 rounded border overflow-x-auto">
                    {chartSyntax}
                </pre>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="w-full bg-white rounded-lg p-6 flex justify-center items-center min-h-[300px]"
        />
    );
};

export default MermaidViewer;