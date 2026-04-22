import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import MermaidViewer from '../../components/common/MermaidViewer'; 

const ViewMindMaps = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken } = useContext(AppContext);
    
    const [mindMaps, setMindMaps] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all published maps for this specific course
    useEffect(() => {
        const fetchMindMaps = async () => {
            try {
                const token = await getToken(); // Optional: If you secured the route
                const { data } = await axios.get(`${backendUrl}/api/mindmap/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (data.success) {
                    setMindMaps(data.mindMaps);
                }
            } catch (error) {
                console.error("Failed to load mind maps:", error);
                toast.error("Failed to load mind maps");
            }
            setLoading(false);
        };
        fetchMindMaps();
    }, [courseId, backendUrl]);

    if (loading) return <div className="p-8 text-center text-gray-500 mt-20">Loading Mind Maps...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans mt-10">
            <div className="max-w-5xl mx-auto">
                
                <button 
                    onClick={() => navigate(-1)} 
                    className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 transition"
                >
                    ← Back to Enrollments
                </button>

                <h1 className="text-3xl font-bold mb-2 text-gray-800">Course Mind Maps</h1>
                <p className="text-gray-500 mb-8">Visual study guides created by your instructor.</p>

                {mindMaps.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-lg">No mind maps have been published for this course yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {mindMaps.map(map => (
                            <div key={map._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold mb-4 text-blue-600 border-b pb-2">{map.title}</h3>
                                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                                    {/* CRITICAL FIX: Added the key prop here so Mermaid renders correctly */}
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