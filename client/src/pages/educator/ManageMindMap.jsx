import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import ReactFlowDiagram from '../../components/common/ReactFlowDiagram';

const ManageMindMap = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken } = useContext(AppContext);

    // UI State
    const [activeTab, setActiveTab] = useState('ai');

    // Form State
    const [topic, setTopic] = useState("");
    const [subjectDomain, setSubjectDomain] = useState("");
    const [diagramType, setDiagramType] = useState("mindmap");
    const [loading, setLoading] = useState(false);

    // Data State
    const [generatedDiagram, setGeneratedDiagram] = useState(null);
    const [savedMaps, setSavedMaps] = useState([]);

    // ---- FETCH SAVED DIAGRAMS ----
    const fetchMindMaps = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`);
            if (data.success) setSavedMaps(data.mindMaps);
        } catch (error) {
            console.error("Failed to fetch diagrams");
        }
    };

    useEffect(() => { fetchMindMaps(); }, [courseId]);

    // ---- GENERATE WITH AI ----
    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error("Please enter a topic");
        setLoading(true);
        setGeneratedDiagram(null);

        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/generate`,
                { topic, diagramType, subjectDomain },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setGeneratedDiagram(data.diagramData);
                toast.success("AI diagram generated!");
            } else {
                toast.error(data.message || "Failed to generate");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Generation failed.");
        }
        setLoading(false);
    };

    // ---- SAVE / PUBLISH ----
    const handleSave = async () => {
        if (!generatedDiagram) return toast.error("No diagram to save!");

        try {
            const token = await getToken();
            const { data } = await axios.post(`${backendUrl}/api/mindmap/save`, {
                courseId,
                title: topic ? `${topic} — ${diagramType}` : "Course Diagram",
                diagramData: generatedDiagram,
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                toast.success("Published to students!");
                setGeneratedDiagram(null);
                setTopic("");
                setSubjectDomain("");
                fetchMindMaps();
                setActiveTab('saved');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to save.");
        }
    };

    // ---- DELETE ----
    const handleDelete = async (mapId) => {
        if (!window.confirm("Delete this diagram? Students will lose access immediately.")) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(`${backendUrl}/api/mindmap/delete/${mapId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Diagram deleted.");
                fetchMindMaps();
            } else {
                toast.error(data.message || "Failed to delete.");
            }
        } catch (error) {
            toast.error("An error occurred while deleting.");
        }
    };

    // ---- TAB BUTTON CLASS HELPER ----
    const tabClass = (tab) => `px-6 py-3.5 font-semibold text-sm tracking-wide transition-all whitespace-nowrap rounded-t-xl ${
        activeTab === tab
            ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50/50'
            : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
    }`;

    return (
        <div className="p-6 md:p-8 min-h-screen animate-fade-in">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="btn-ghost !px-0 gap-2 text-surface-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Manage Course Diagrams</h1>
                        <p className="text-sm text-surface-500 mt-0.5">Generate AI-powered visual study guides for your students.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-surface-200 mb-8 overflow-x-auto bg-white rounded-t-xl shadow-sm px-2 pt-2">
                    <button onClick={() => setActiveTab('ai')} className={tabClass('ai')}>
                        <span className="mr-2">✨</span> AI Generator
                    </button>
                    <button onClick={() => setActiveTab('saved')} className={`${tabClass('saved')} flex items-center gap-2`}>
                        <span className="mr-1">📁</span> Published
                        <span className="bg-surface-200 text-surface-600 py-0.5 px-2 rounded-full text-xs font-bold">{savedMaps.length}</span>
                    </button>
                </div>

                {/* ================================================================ */}
                {/* TAB 1: AI GENERATOR                                              */}
                {/* ================================================================ */}
                {activeTab === 'ai' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="premium-card p-6 md:p-8">
                            <h2 className="text-lg font-bold text-surface-900 mb-1">Generate with Edunova AI</h2>
                            <p className="text-surface-500 text-sm mb-6">Provide a topic and optional domain context for precise, professional diagrams.</p>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Diagram Type */}
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1.5 block">Format</label>
                                    <select
                                        value={diagramType}
                                        onChange={(e) => setDiagramType(e.target.value)}
                                        className="input-field !py-3 cursor-pointer"
                                    >
                                        <option value="mindmap">🧠 Concept Breakdown</option>
                                        <option value="flowchart">↘️ Step-by-Step Process</option>
                                        <option value="state">🔄 Lifecycle / Continuous Loop</option>
                                        <option value="ai_decide">✨ Let AI Decide</option>
                                    </select>
                                </div>

                                {/* Topic Input */}
                                <div className="md:col-span-5">
                                    <label className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1.5 block">Topic *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Photosynthesis, The React Virtual DOM"
                                        className="input-field !py-3"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                    />
                                </div>

                                {/* Subject/Domain (NEW) */}
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1.5 block">
                                        Subject / Domain
                                        <span className="text-surface-300 font-normal normal-case ml-1">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Quantum Physics, Renaissance Art"
                                        className="input-field !py-3"
                                        value={subjectDomain}
                                        onChange={(e) => setSubjectDomain(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="mt-6">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="btn-primary min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                                            </svg>
                                            Generate Diagram
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Generated Diagram Preview */}
                        {generatedDiagram && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-surface-900">Preview</h3>
                                    <div className="flex gap-3">
                                        <button onClick={() => { setGeneratedDiagram(null); }} className="btn-ghost text-surface-400">
                                            Discard
                                        </button>
                                        <button onClick={handleSave} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                            </svg>
                                            Publish to Students
                                        </button>
                                    </div>
                                </div>
                                <ReactFlowDiagram diagramData={generatedDiagram} height="550px" />
                            </div>
                        )}
                    </div>
                )}

                {/* ================================================================ */}
                {/* TAB 2: SAVED / PUBLISHED DIAGRAMS                                */}
                {/* ================================================================ */}
                {activeTab === 'saved' && (
                    <div className="animate-fade-in">
                        {savedMaps.length === 0 ? (
                            <div className="premium-card p-16 text-center">
                                <div className="text-5xl mb-4">📭</div>
                                <h2 className="text-xl font-bold text-surface-700 mb-2">Your Collection is Empty</h2>
                                <p className="text-surface-500 mb-6">You haven't published any diagrams for this course yet.</p>
                                <button onClick={() => setActiveTab('ai')} className="btn-primary">Create your first one</button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {savedMaps.map((map) => (
                                    <div key={map._id} className="premium-card overflow-hidden animate-fade-in-up">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center p-5 border-b border-surface-100">
                                            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                                                    </svg>
                                                </div>
                                                {map.title}
                                            </h3>
                                            <button
                                                onClick={() => handleDelete(map._id)}
                                                className="btn-ghost !text-red-500 hover:!bg-red-50 !text-xs gap-1"
                                                title="Delete this diagram"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>

                                        {/* Diagram Viewer */}
                                        <div className="p-5">
                                            {map.diagramData ? (
                                                <ReactFlowDiagram diagramData={map.diagramData} height="400px" />
                                            ) : map.mermaidSyntax ? (
                                                <div className="bg-surface-50 rounded-xl border border-surface-200 p-6 text-center">
                                                    <p className="text-surface-500 text-sm">⚠️ Legacy Mermaid diagram — please regenerate with AI to upgrade.</p>
                                                    <pre className="text-xs text-surface-400 mt-3 bg-surface-100 p-3 rounded-lg overflow-x-auto text-left">{map.mermaidSyntax}</pre>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-surface-400">No diagram data</div>
                                            )}
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