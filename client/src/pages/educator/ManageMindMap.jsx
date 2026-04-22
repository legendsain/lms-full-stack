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
                toast.success("Mind Map Generated!");
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
                title: `${topic} Mind Map`,
                mermaidSyntax: generatedSyntax
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (data.success) {
                toast.success("Saved successfully!");
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

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Course Mind Maps</h1>
            
            {/* Generate Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Enter topic (e.g., HTML Basics)"
                        className="flex-1 p-3 border border-gray-300 rounded-lg outline-none"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Thinking..." : "Generate Map"}
                    </button>
                </div>

                {generatedSyntax && (
                    <div className="mt-8 border-t pt-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Preview</h3>
                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                            <MermaidViewer key={generatedSyntax} chartSyntax={generatedSyntax} />
                        </div>
                        <button onClick={handleSave} className="mt-4 bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700">
                            Save to Course
                        </button>
                    </div>
                )}
            </div>

            {/* Saved Maps Section */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Saved Maps</h2>
                <div className="grid gap-6">
                    {savedMaps.map((map) => (
                        <div key={map._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">{map.title}</h3>
                            <MermaidViewer key={map.mermaidSyntax} chartSyntax={map.mermaidSyntax} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageMindMap;