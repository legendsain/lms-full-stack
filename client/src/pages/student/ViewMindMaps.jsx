import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import MermaidViewer from '../../components/common/MermaidViewer'; 

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-xl text-blue-600 font-bold tracking-widest">Loading Study Materials...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 pt-24 font-sans">
            <div className="max-w-6xl mx-auto">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-gray-200">
                    <div>
                        <button 
                            onClick={() => navigate(-1)} 
                            className="text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-2 transition font-medium"
                        >
                            ← Back to Course Hub
                        </button>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Course Diagrams</h1>
                        <p className="text-gray-500 mt-2 text-lg">Visual study guides and structural maps created by your instructor.</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-4 py-2 rounded-full">
                            {mindMaps.length} Reference{mindMaps.length !== 1 && 's'} Available
                        </span>
                    </div>
                </div>

                {mindMaps.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No diagrams yet!</h2>
                        <p className="text-gray-500 text-lg">Your instructor hasn't published any visual guides for this course yet. Check back later.</p>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {mindMaps.map((map) => (
                            <div key={map._id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 transition hover:shadow-md">
                                <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                                    <span className="text-blue-500">❖</span> {map.title}
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden p-6 relative group">
                                    <MermaidViewer key={map.mermaidSyntax} chartSyntax={map.mermaidSyntax} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewMindMaps;