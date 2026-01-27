import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const GroupGenerator = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken, navigate } = useContext(AppContext);
    
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [groupSize, setGroupSize] = useState(3);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch available quizzes to base groups on
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(backendUrl + `/api/quiz/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setQuizzes(data.quizzes);
                    if(data.quizzes.length > 0) setSelectedQuiz(data.quizzes[0]._id);
                }
            } catch (error) {
                toast.error("Failed to load quizzes");
            }
        };
        fetchQuizzes();
    }, [courseId, backendUrl, getToken]);

    // 2. Load existing groups if a quiz is selected
    useEffect(() => {
        if (!selectedQuiz) return;
        const fetchGroups = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(backendUrl + `/api/group/${selectedQuiz}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) setGroups(data.groups);
            } catch (error) { console.error(error); }
        };
        fetchGroups();
    }, [selectedQuiz, backendUrl, getToken]);

    // 3. Generate Logic
    const handleCreateGroups = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/group/create', 
                { courseId, quizId: selectedQuiz, groupSize },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (data.success) {
                toast.success(data.message);
                // Refresh list
                const res = await axios.get(backendUrl + `/api/group/${selectedQuiz}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGroups(res.data.groups);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2">← Back to Dashboard</button>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Peer Grouping & Collaboration</h1>
                <p className="text-gray-500 mb-8">Automatically generate balanced teams based on quiz performance.</p>

                {/* CONTROLS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-6 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Select Source Quiz</label>
                        <select 
                            value={selectedQuiz} 
                            onChange={(e) => setSelectedQuiz(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 mt-1 bg-white"
                        >
                            {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
                        </select>
                    </div>

                    <div className="w-40">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Members per Team</label>
                        <input 
                            type="number" 
                            min="2" 
                            max="10" 
                            value={groupSize} 
                            onChange={(e) => setGroupSize(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 mt-1"
                        />
                    </div>

                    <button 
                        onClick={handleCreateGroups} 
                        disabled={loading || !selectedQuiz}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 shadow-md transition font-semibold disabled:opacity-50"
                    >
                        {loading ? "Balancing Teams..." : "✨ Create Balanced Groups"}
                    </button>
                </div>

                {/* RESULTS */}
                {groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <div key={group._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                                    <h3 className="font-bold text-indigo-900">{group.groupName}</h3>
                                    <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-200 font-semibold">Avg: {group.avgScore}</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {group.members.map((member, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                                    {member.studentImage ? <img src={member.studentImage} alt="" /> : member.studentName[0]}
                                                </div>
                                                <span className="text-gray-700 font-medium">{member.studentName}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs ${member.score >= 8 ? 'bg-green-100 text-green-700' : member.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {member.score} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400">Select a quiz above to generate teams.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupGenerator;