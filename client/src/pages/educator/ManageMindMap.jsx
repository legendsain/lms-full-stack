import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import MermaidViewer from '../../components/common/MermaidViewer'; 

const ManageMindMap = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken } = useContext(AppContext);
    
    const [topic, setTopic] = useState("");
    const [generatedSyntax, setGeneratedSyntax] = useState("");
    const [loading, setLoading] = useState(false);
    const [savedMaps, setSavedMaps] = useState([]);

    const fetchMindMaps = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`);
            if (data.success) setSavedMaps(data.mindMaps);
        } catch (error) {
            console.error("Failed to fetch mind maps:", error);
        }
    };

    useEffect(() => {
        fetchMindMaps();
    }, [courseId]);

    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error("Please enter a topic");
        setLoading(true);
        setGeneratedSyntax(""); 

        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/generate`, 
                { topic },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setGeneratedSyntax(data.mermaidSyntax);
                toast.success("AI Draft Generated! You can now edit it.");
            } else {
                toast.error(data.message || "Failed to generate");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Generation failed.");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/save`, {
                courseId,
                title: `${topic} Diagram`,
                mermaidSyntax: generatedSyntax
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (data.success) {
                toast.success("Saved to Course successfully!");
                setGeneratedSyntax(""); 
                setTopic(""); 
                fetchMindMaps(); 
            } else {
                 toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to save the mind map.");
        }
    };

    // Live Editor Handler
    const handleSyntaxChange = (e) => {
        setGeneratedSyntax(e.target.value);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-medium">
                    ← Back
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Dynamic Course Diagrams</h1>
            </div>
            
            {/* 1. Generate Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Enter topic (e.g., Operating System Lifecycle)"
                        className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium min-w-[180px] transition"
                    >
                        {loading ? "Thinking..." : "Generate AI Draft"}
                    </button>
                </div>
            </div>

            {/* 2. The Live "Human-in-the-Loop" Workspace */}
            {generatedSyntax && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Live Editor Workspace</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* LEFT COLUMN: The Code Editor */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                                1. Tweak the Code
                            </label>
                            <textarea 
                                value={generatedSyntax}
                                onChange={handleSyntaxChange}
                                spellCheck="false"
                                className="w-full h-[400px] p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-xl border border-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-inner leading-relaxed"
                                placeholder="Mermaid syntax will appear here..."
                            />
                        </div>

                        {/* RIGHT COLUMN: The Visual Preview */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                                    2. Live Preview
                                </label>
                                <button 
                                    onClick={handleSave} 
                                    className="bg-green-600 text-white px-6 py-2 text-sm rounded-lg hover:bg-green-700 font-bold shadow transition"
                                >
                                    Publish to Students
                                </button>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[400px] flex justify-center items-center overflow-auto p-4 relative">
                                {/* We removed the hard 'key' prop here so typing is smooth and doesn't violently remount the component */}
                                <MermaidViewer chartSyntax={generatedSyntax} />
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* 3. Saved Maps Section */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Published Diagrams</h2>
                {savedMaps.length === 0 ? (
                    <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-200 text-center">No diagrams published for this course yet.</p>
                ) : (
                    <div className="grid gap-6">
                        {savedMaps.map((map) => (
                            <div key={map._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">{map.title}</h3>
                                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto">
                                    <MermaidViewer chartSyntax={map.mermaidSyntax} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageMindMap;