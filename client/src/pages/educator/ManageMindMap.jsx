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
    
    // UI State
    const [activeTab, setActiveTab] = useState('ai'); 
    
    // Data State
    const [topic, setTopic] = useState("");
    const [generatedSyntax, setGeneratedSyntax] = useState("");
    const [draftSyntax, setDraftSyntax] = useState(""); // NEW: Fast local state for typing
    const [loading, setLoading] = useState(false);
    const [savedMaps, setSavedMaps] = useState([]);

    const fetchMindMaps = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`);
            if (data.success) setSavedMaps(data.mindMaps);
        } catch (error) {
            console.error("Failed to fetch diagrams");
        }
    };

    useEffect(() => { fetchMindMaps(); }, [courseId]);

    // NEW: The "Performance Bomb" Fix - 500ms Debounce Timer
    useEffect(() => {
        // Wait 500ms after the user stops typing to update the actual diagram
        const handler = setTimeout(() => {
            setGeneratedSyntax(draftSyntax);
        }, 500);

        // If the user types a new key before 500ms is up, cancel the timer and start over
        return () => clearTimeout(handler);
    }, [draftSyntax]);

    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error("Please enter a topic");
        setLoading(true);

        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/generate`, 
                { topic },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setGeneratedSyntax(data.mermaidSyntax);
                setDraftSyntax(data.mermaidSyntax); // NEW: Update the draft editor too
                toast.success("AI Draft Generated!");
                setActiveTab('compiler'); 
            } else {
                toast.error(data.message || "Failed to generate");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Generation failed.");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!generatedSyntax.trim()) return toast.error("No code to save!");
        
        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/save`, {
                courseId,
                title: topic ? `${topic} Diagram` : "Custom Course Diagram",
                mermaidSyntax: generatedSyntax
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (data.success) {
                toast.success("Published successfully!");
                setGeneratedSyntax(""); 
                setDraftSyntax(""); // NEW: Clear the draft editor
                setTopic(""); 
                fetchMindMaps(); 
                setActiveTab('saved'); 
            } else {
                 toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to save.");
        }
    };

    // Delete Handler
    const handleDelete = async (mapId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this diagram? Students will instantly lose access to it.");
        if (!confirmDelete) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(`${backendUrl}/api/mindmap/delete/${mapId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Diagram deleted successfully.");
                fetchMindMaps(); 
            } else {
                toast.error(data.message || "Failed to delete.");
            }
        } catch (error) {
            toast.error("An error occurred while deleting.");
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
                        ← Back to Course
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Manage Course Diagrams</h1>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-8 overflow-x-auto bg-white rounded-t-xl shadow-sm px-2 pt-2">
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`px-8 py-4 font-bold text-sm tracking-wide transition-colors whitespace-nowrap rounded-t-lg ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        ✨ AI Generator
                    </button>
                    <button 
                        onClick={() => setActiveTab('compiler')}
                        className={`px-8 py-4 font-bold text-sm tracking-wide transition-colors whitespace-nowrap rounded-t-lg ${activeTab === 'compiler' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        💻 Raw Compiler
                    </button>
                    <button 
                        onClick={() => setActiveTab('saved')}
                        className={`px-8 py-4 font-bold text-sm tracking-wide transition-colors whitespace-nowrap rounded-t-lg flex items-center gap-2 ${activeTab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        📁 Saved Collection
                        <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{savedMaps.length}</span>
                    </button>
                </div>

                {/* TAB 1: AI Generator */}
                {activeTab === 'ai' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-3xl animate-fadeIn">
                        <h2 className="text-xl font-bold mb-2 text-gray-800">Generate with Edunova AI</h2>
                        <p className="text-gray-500 mb-6 text-sm">Enter a core concept and our AI will structuralize it into a professional diagram for your students.</p>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                placeholder="Enter topic (e.g., The React Virtual DOM)"
                                className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <button 
                                onClick={handleGenerate} 
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium min-w-[180px] transition-all"
                            >
                                {loading ? "Thinking..." : "Generate Draft"}
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: Raw Compiler (Live Editor) */}
                {activeTab === 'compiler' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Mermaid Compiler Workspace</h2>
                                <p className="text-xs text-gray-500">Edit the raw syntax on the left to update the preview on the right.</p>
                            </div>
                            <button 
                                onClick={handleSave} 
                                disabled={!generatedSyntax.trim()}
                                className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 font-bold shadow transition-all disabled:opacity-50"
                            >
                                Publish to Students
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Editor */}
                            <div className="flex flex-col">
                                <textarea 
                                    value={draftSyntax} // NEW: Bound to fast draft state
                                    onChange={(e) => setDraftSyntax(e.target.value)} // NEW: Updates draft instantly
                                    spellCheck="false"
                                    className="w-full h-[550px] p-5 bg-[#0d1117] text-[#58a6ff] font-mono text-sm rounded-xl border border-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none shadow-inner leading-relaxed"
                                    placeholder="Paste or type raw Mermaid.js syntax here..."
                                />
                            </div>
                            {/* Preview */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[550px] flex justify-center items-center overflow-auto p-4">
                                {generatedSyntax.trim() ? (
                                    <MermaidViewer chartSyntax={generatedSyntax} /> // Renders only when Debounce triggers
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <div className="text-4xl mb-2">👁️</div>
                                        <p className="font-medium">Live preview will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: Saved Diagrams (With Delete Feature) */}
                {activeTab === 'saved' && (
                    <div className="animate-fadeIn">
                        {savedMaps.length === 0 ? (
                            <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
                                <div className="text-5xl mb-4">📭</div>
                                <h2 className="text-xl font-bold text-gray-700 mb-2">Your Collection is Empty</h2>
                                <p className="text-gray-500">You haven't published any diagrams for this course yet.</p>
                                <button onClick={() => setActiveTab('ai')} className="mt-6 bg-blue-50 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-100 font-medium transition-colors">Create your first one</button>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                                {savedMaps.map((map) => (
                                    <div key={map._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <span className="text-blue-500 text-lg">❖</span> {map.title}
                                            </h3>
                                            
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDelete(map._id)}
                                                className="flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                title="Delete this diagram"
                                            >
                                                <span>🗑️</span> Delete
                                            </button>
                                        </div>
                                        
                                        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto p-4 min-h-[200px] flex justify-center items-center">
                                            <MermaidViewer chartSyntax={map.mermaidSyntax} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageMindMap;