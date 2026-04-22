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

    // 1. Fetch maps the teacher has already published
    const fetchMindMaps = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`);
            if (data.success) setSavedMaps(data.mindMaps);
        } catch (error) {
            console.error("Failed to fetch mind maps");
        }
    };

    useEffect(() => {
        fetchMindMaps();
    }, [courseId]);

    // 2. Ask Gemini to generate a new map
    const handleGenerate = async () => {
        if (!topic) return toast.error("Please enter a topic");
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/generate`, 
                { topic },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setGeneratedSyntax(data.mermaidSyntax);
                toast.success("Mind Map Generated! Check the preview below.");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Generation failed. Please try again.");
        }
        setLoading(false);
    };

    // 3. Save the approved map to the database
    const handleSave = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/save`, {
                courseId,
                title: `${topic} Mind Map`,
                mermaidSyntax: generatedSyntax
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (data.success) {
                toast.success("Published to students successfully!");
                setGeneratedSyntax(""); // Clear the preview
                setTopic(""); // Clear the input
                fetchMindMaps(); // Refresh the published list
            }
        } catch (error) {
            toast.error("Failed to save the mind map.");
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex-1">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
                    ← Back
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Manage Course Mind Maps</h1>
            </div>
            
            {/* The AI Generator Box */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold mb-4 text-gray-700">Generate New Mind Map with AI</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Enter topic (e.g., The React Component Lifecycle)"
                        className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition min-w-[200px]"
                    >
                        {loading ? "AI is Thinking..." : "Generate Map"}
                    </button>
                </div>

                {/* The Live Preview Area */}
                {generatedSyntax && (
                    <div className="mt-8 border-t pt-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Live Preview</h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <MermaidViewer chartSyntax={generatedSyntax} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={handleSave} 
                                className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 font-medium shadow-md transition"
                            >
                                Publish Map to Students
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List of Already Published Maps */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Published Mind Maps</h2>
                {savedMaps.length === 0 ? (
                    <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-200 text-center">No mind maps generated for this course yet.</p>
                ) : (
                    <div className="grid gap-6">
                        {savedMaps.map(map => (
                            <div key={map._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">{map.title}</h3>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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