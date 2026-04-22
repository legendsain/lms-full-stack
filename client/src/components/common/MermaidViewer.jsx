import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

// 1. Professional "Edunova" Color Palette Injection
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#f0f9ff',       // Light blue node background
        primaryTextColor: '#0369a1',   // Dark blue text for high contrast
        primaryBorderColor: '#7dd3fc', // Bright blue borders
        lineColor: '#94a3b8',          // Clean, subtle slate for edges
        secondaryColor: '#f8fafc',     // Off-white for secondary nodes
        tertiaryColor: '#fefce8',      // Soft yellow for accents
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
    },
    securityLevel: 'loose',
});

const MermaidViewer = ({ chartSyntax }) => {
    const containerRef = useRef(null);
    const wrapperRef = useRef(null); // Reference for the panning area
    const [error, setError] = useState(false);
    
    // UI & Pan/Zoom States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
                     // Auto-center the newly rendered diagram
                     setPosition({ x: 0, y: 0 });
                     setScale(1);
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

    // --- Pan & Zoom Logic ---
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    const handleWheel = useCallback((e) => {
        // Only zoom if the user is holding Ctrl/Cmd OR if in fullscreen
        if (!e.ctrlKey && !isFullscreen) return; 
        e.preventDefault();

        const zoomSensitivity = 0.002;
        const delta = e.deltaY * -zoomSensitivity;
        const newScale = Math.min(Math.max(0.3, scale + delta), 4); // Min 30%, Max 400%
        setScale(newScale);
    }, [scale, isFullscreen]);

    // Attach wheel listener manually to prevent default scrolling behavior
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (wrapper) {
            wrapper.addEventListener('wheel', handleWheel, { passive: false });
            return () => wrapper.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const handleResetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Download Logic
    const downloadAsPNG = () => { /* ... existing download logic ... */ };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 w-full">
                <p className="font-bold">Syntax Parsing Failed</p>
                <p className="text-sm mb-2">The diagram logic generated an impossible state or syntax error.</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{chartSyntax}</pre>
            </div>
        );
    }

    const wrapperClasses = isFullscreen 
        ? "fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-8 backdrop-blur-sm bg-opacity-95"
        : "relative w-full h-full flex flex-col border border-gray-200 rounded-xl bg-gray-50 overflow-hidden group";

    // Dynamic cursor styles based on interaction
    const cursorStyle = isDragging ? 'cursor-grabbing' : 'cursor-grab';

    return (
        <div className={wrapperClasses}>
            
            {/* Toolbar */}
            <div className={`absolute top-4 right-4 z-10 flex gap-2 transition-opacity duration-200 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold border-r">-</button>
                    <button onClick={handleResetView} className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm font-medium border-r" title="Reset View">
                        {Math.round(scale * 100)}%
                    </button>
                    <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                </div>
                
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                    {isFullscreen ? '✖️ Close' : '🔲 Expand'}
                </button>
            </div>
            
            {/* Interactive Canvas Area */}
            <div 
                ref={wrapperRef}
                className={`w-full h-full overflow-hidden ${cursorStyle}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {/* We apply BOTH the scale and the pan translation to this inner container. 
                    The transform-origin is important so it scales evenly.
                */}
                <div 
                    ref={containerRef} 
                    className="w-full h-full flex justify-center items-center pointer-events-none"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                />
            </div>
            
            {!isFullscreen && (
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-medium opacity-50 select-none">
                    Scroll + Ctrl to Zoom • Click & Drag to Pan
                </div>
            )}
        </div>
    );
};

export default MermaidViewer;