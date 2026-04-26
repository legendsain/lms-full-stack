import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import ReactFlowDiagram from '../../components/common/ReactFlowDiagram';
import Footer from '../../components/student/Footer';

const ViewMindMaps = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken } = useContext(AppContext);

    const [mindMaps, setMindMaps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMindMaps = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) setMindMaps(data.mindMaps);
            } catch (error) {
                console.error("Failed to load diagrams");
            }
            setLoading(false);
        };
        fetchMindMaps();
    }, [courseId, backendUrl]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-surface-200 border-t-brand-600 animate-spin"></div>
                    <p className="text-sm text-surface-400 font-medium">Loading Study Materials...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col">
            <div className="flex-grow section-container pt-10 pb-20 animate-fade-in">
                <div className="max-w-6xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-surface-200">
                        <div>
                            <button
                                onClick={() => navigate(-1)}
                                className="btn-ghost mb-4 !px-0 gap-2 text-surface-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                                Back to Course Hub
                            </button>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight">Course Diagrams</h1>
                            <p className="text-surface-500 mt-2 text-base">Interactive visual study guides created by your instructor.</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className="badge-primary">
                                {mindMaps.length} Reference{mindMaps.length !== 1 && 's'} Available
                            </span>
                        </div>
                    </div>

                    {/* Empty State */}
                    {mindMaps.length === 0 ? (
                        <div className="text-center py-20 premium-card">
                            <div className="text-5xl mb-4">📭</div>
                            <h2 className="text-xl font-bold text-surface-800 mb-2">No diagrams yet!</h2>
                            <p className="text-surface-500 text-base">Your instructor hasn't published any visual guides for this course yet. Check back later.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {mindMaps.map((map) => (
                                <div key={map._id} className="premium-card p-6 md:p-8 animate-fade-in-up">
                                    <h3 className="text-xl font-bold mb-6 text-surface-900 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                                            </svg>
                                        </div>
                                        {map.title}
                                    </h3>

                                    {/* Render React Flow if diagramData exists, else show legacy fallback */}
                                    {map.diagramData ? (
                                        <ReactFlowDiagram diagramData={map.diagramData} height="500px" />
                                    ) : map.mermaidSyntax ? (
                                        <div className="bg-surface-50 rounded-xl border border-surface-200 p-8 text-center">
                                            <p className="text-surface-500 text-sm">⚠️ This is a legacy diagram. Ask your instructor to regenerate it for an interactive experience.</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-surface-400">No diagram data available</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ViewMindMaps;