import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import ReactFlowDiagram from '../common/ReactFlowDiagram';

const MindMapGenerator = ({ courseId }) => {
    const { backendUrl, getToken } = useContext(AppContext);
    const [topic, setTopic] = useState("");
    const [generatedDiagram, setGeneratedDiagram] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error("Please enter a topic");
        setLoading(true);
        setGeneratedDiagram(null);

        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/generate`,
                { topic, diagramType: 'mind map' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setGeneratedDiagram(data.diagramData);
                toast.success("AI diagram generated!");
            } else {
                toast.error(data.message || "Failed to generate mind map.");
            }
        } catch (error) {
            toast.error("Generation failed due to server error.");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const token = await getToken();
            await axios.post(`${backendUrl}/api/mindmap/save`, {
                courseId,
                title: `${topic} Mind Map`,
                diagramData: generatedDiagram,
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Published to students!");
        } catch (error) {
            toast.error("Save failed");
        }
    };

    return (
        <div className="premium-card p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Generate AI Mind Map</h2>

            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Enter topic (e.g., Photosynthesis)"
                    className="input-field flex-1"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                >
                    {loading ? "Generating..." : "Generate Map"}
                </button>
            </div>

            {generatedDiagram && (
                <div className="space-y-4">
                    <ReactFlowDiagram diagramData={generatedDiagram} height="400px" />
                    <button onClick={handleSave} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                        Publish to Students
                    </button>
                </div>
            )}
        </div>
    );
};

export default MindMapGenerator;