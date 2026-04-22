import React, { useState } from 'react';
import axios from 'axios';
import MermaidViewer from '../common/MermaidViewer';

const MindMapGenerator = ({ courseId }) => {
    const [topic, setTopic] = useState("");
    const [generatedSyntax, setGeneratedSyntax] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return alert("Please enter a topic");
        setLoading(true);
        setGeneratedSyntax(""); // Clear previous map while loading
        
        try {
            // Adjust endpoint if your route structure is different
            const { data } = await axios.post('/api/mindmap/generate', { topic });
            
            if (data.success) {
                console.log("Received Syntax in Frontend:", data.mermaidSyntax); // Debug log
                setGeneratedSyntax(data.mermaidSyntax);
            } else {
                alert(data.message || "Failed to generate mind map.");
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("Generation failed due to server error.");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            await axios.post('/api/mindmap/save', {
                courseId,
                title: `${topic} Mind Map`,
                mermaidSyntax: generatedSyntax
            });
            alert("Published to students!");
        } catch (error) {
            alert("Save failed");
        }
    };

    return (
        <div className="p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Generate AI Mind Map</h2>
            
            <div className="flex gap-4 mb-6">
                <input 
                    type="text" 
                    placeholder="Enter topic (e.g., Photosynthesis)"
                    className="flex-1 p-2 border rounded"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Thinking..." : "Generate Map"}
                </button>
            </div>

            {/* The Safe Viewer */}
            {generatedSyntax && (
                <div className="mt-4">
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        {/* We use a key to force React to completely unmount and remount the viewer on new syntax */}
                        <MermaidViewer key={generatedSyntax} chartSyntax={generatedSyntax} />
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        Publish to Students
                    </button>
                </div>
            )}
        </div>
    );
};

export default MindMapGenerator;