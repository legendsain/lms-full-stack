import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const CareerDashboard = () => {
    const { backendUrl, getToken, navigate } = useContext(AppContext);
    
    const [targetRole, setTargetRole] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!targetRole.trim()) return toast.error("Please enter a target job role");
        
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                backendUrl + '/api/career/analyze',
                { targetRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setAnalysis(data.analysisData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/')} className="text-gray-500 mb-6 flex items-center gap-2">
                    ← Back to Home
                </button>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-2">CareerLink 🚀</h1>
                <p className="text-gray-500 mb-8">Analyze your skill gap for your dream job using AI.</p>

                {/* Input Section */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">I want to become a...</label>
                    <div className="flex gap-4 mt-2">
                        <input 
                            type="text" 
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            placeholder="e.g. Full Stack Developer, Data Scientist, Product Manager"
                            className="flex-1 border border-gray-300 rounded-lg p-3 text-lg outline-none focus:border-indigo-500"
                        />
                        <button 
                            onClick={handleAnalyze} 
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition"
                        >
                            Analyze Gap
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                        
                        {/* Score Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                            <h3 className="text-gray-500 font-medium mb-2">Readiness Score</h3>
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                                analysis.score >= 80 ? 'border-green-500 text-green-600' : 
                                analysis.score >= 50 ? 'border-yellow-500 text-yellow-600' : 
                                'border-red-500 text-red-600'
                            }`}>
                                {analysis.score}%
                            </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
                            <h3 className="text-gray-800 font-bold mb-4">Missing Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.missingSkills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium border border-red-100">
                                        ⚠ {skill}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-gray-800 font-bold mb-2">AI Advice:</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">{analysis.advice}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerDashboard;