import React, { useState } from 'react';
import axios from 'axios';
import MermaidViewer from '../common/MermaidViewer';

const MindMapGenerator = ({ courseId }) => {
    const [topic, setTopic] = useState("");
    const [generatedSyntax, setGeneratedSyntax] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Replace with your actual token fetching logic
            const { data } = await axios.post('/api/mindmap/generate', { topic });
            if (data.success) {
                setGeneratedSyntax(data.mermaidSyntax);
            }
        } catch (error) {
            alert("Generation failed");
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
                />
                <button 
                    onClick={handleGenerate} 
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Thinking..." : "Generate Map"}
                </button>
            </div>

            {/* The Safe Viewer */}
            {generatedSyntax && (
                <div className="mt-4">
                    <MermaidViewer chartSyntax={generatedSyntax} />
                    
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