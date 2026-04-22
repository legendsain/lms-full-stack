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
    
    // UI States for Upgrade 2
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Render the SVG
    useEffect(() => {
        if (!chartSyntax || !containerRef.current) return;

        const renderChart = async () => {
            try {
                setError(false);
                containerRef.current.innerHTML = ''; 
                
                const cleanSyntax = chartSyntax.replace(/\u00A0/g, " ").trim();
                const id = `mermaid-${Math.random().toString(36).substring(2, 10)}`;
                
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
        // Reset zoom when syntax changes
        setZoomLevel(1); 
    }, [chartSyntax]);

    // Export Logic (From Upgrade 1)
    const downloadAsPNG = () => {
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBox = svgElement.getBoundingClientRect();
        canvas.width = (svgBox.width || 800) * 2; 
        canvas.height = (svgBox.height || 600) * 2;

        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const link = document.createElement('a');
            link.download = `Edunova_Diagram_${Math.floor(Math.random() * 1000)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Zoom Handlers
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Max 300%
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.4)); // Min 40%
    const handleResetZoom = () => setZoomLevel(1); // 100%

    // Error Fallback
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

    // Determine wrapper classes based on Fullscreen state
    const wrapperClasses = isFullscreen 
        ? "fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-8 backdrop-blur-sm bg-opacity-95"
        : "relative w-full h-full flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden group";

    const contentContainerClasses = isFullscreen
        ? "w-full h-full overflow-auto bg-white rounded-xl shadow-2xl p-8 cursor-grab active:cursor-grabbing"
        : "w-full h-full overflow-auto p-4 cursor-grab active:cursor-grabbing min-h-[300px]";

    return (
        <div className={wrapperClasses}>
            
            {/* Toolbar (Visible on hover in normal mode, always visible in fullscreen) */}
            <div className={`absolute top-4 right-4 z-10 flex gap-2 transition-opacity duration-200 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                
                {/* Zoom Controls */}
                <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <button onClick={handleZoomOut} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600 font-bold border-r border-gray-200" title="Zoom Out">-</button>
                    <button onClick={handleResetZoom} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600 text-sm font-medium border-r border-gray-200" title="Reset Zoom">{Math.round(zoomLevel * 100)}%</button>
                    <button onClick={handleZoomIn} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600 font-bold" title="Zoom In">+</button>
                </div>

                {/* Download Button */}
                <button 
                    onClick={downloadAsPNG}
                    className="bg-white text-gray-700 hover:text-blue-600 border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition"
                    title="Download as PNG"
                >
                    ⬇️
                </button>

                {/* Fullscreen Toggle */}
                <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${isFullscreen ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}
                    title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
                >
                    {isFullscreen ? '✖️ Close' : '🔲 Expand'}
                </button>
            </div>
            
            {/* The Pan/Zoom Canvas */}
            <div className={contentContainerClasses}>
                <div 
                    ref={containerRef} 
                    className="w-full h-full flex justify-center items-center origin-center transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoomLevel})` }}
                />
            </div>
        </div>
    );
};

export default MermaidViewer;