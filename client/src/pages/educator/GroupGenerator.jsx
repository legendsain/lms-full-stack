import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const GroupGenerator = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken, navigate } = useContext(AppContext);
    
    // Data States
    const [quizzes, setQuizzes] = useState([]);
    const [batches, setBatches] = useState([]); // List of saved records
    const [groups, setGroups] = useState([]);   // Current displayed teams

    // Selection States
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [selectedBatch, setSelectedBatch] = useState(null); // Which record are we viewing?

    // Input States
    const [numberOfTeams, setNumberOfTeams] = useState(2);
    const [batchTitle, setBatchTitle] = useState("");
    
    const [loading, setLoading] = useState(false);

    // 1. Fetch available quizzes
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
            } catch (error) { toast.error("Failed to load quizzes"); }
        };
        fetchQuizzes();
    }, [courseId, backendUrl, getToken]);

    // 2. Fetch Saved Batches when Quiz Changes
    useEffect(() => {
        if (!selectedQuiz) return;
        fetchBatches();
    }, [selectedQuiz]);

    const fetchBatches = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/group/list/${selectedQuiz}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) setBatches(data.batches);
            setGroups([]); // Clear display
            setSelectedBatch(null);
        } catch (error) { console.error(error); }
    };

    // 3. Create New Groups
    const handleCreateGroups = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/group/create', 
                { courseId, quizId: selectedQuiz, numberOfGroups: numberOfTeams, batchTitle }, // Using Number of Teams
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (data.success) {
                toast.success(data.message);
                setBatchTitle(""); // Reset
                fetchBatches(); // Refresh list
            } else {
                toast.error(data.message);
            }
        } catch (error) { toast.error(error.message); }
        setLoading(false);
    };

    // 4. Load a Saved Batch
    const loadBatch = async (batch) => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/group/batch/${batch.batchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setGroups(data.groups);
                setSelectedBatch(batch);
            }
        } catch (error) { toast.error(error.message); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2">← Back to Dashboard</button>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Builder</h1>
                <p className="text-gray-500 mb-8">Create balanced student groups based on quiz performance.</p>

                {/* --- CONTROLS SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* LEFT: Generator */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Generate New Teams
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Select Quiz</label>
                                <select value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 mt-1">
                                    {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Number of Teams</label>
                                <input type="number" min="2" max="20" value={numberOfTeams} onChange={(e) => setNumberOfTeams(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Record Name (Optional)</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="text" placeholder="e.g. Week 1 Project Groups" value={batchTitle} onChange={(e) => setBatchTitle(e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2.5" />
                                    <button onClick={handleCreateGroups} disabled={loading || !selectedQuiz} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 whitespace-nowrap">
                                        {loading ? "Creating..." : "Create Teams"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">*Note: Only a student's first quiz attempt is used for scoring.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Saved Records */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80 overflow-y-auto">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                            Saved Records
                        </h2>
                        {batches.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-10">No saved teams yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {batches.map((batch) => (
                                    <div 
                                        key={batch.batchId} 
                                        onClick={() => loadBatch(batch)}
                                        className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center ${selectedBatch?.batchId === batch.batchId ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-sm">{batch.batchTitle}</h4>
                                            <p className="text-xs text-gray-500">{new Date(batch.createdAt).toLocaleDateString()} • {batch.teamCount} Teams</p>
                                        </div>
                                        <span className="text-indigo-600 text-lg">→</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- DISPLAY AREA --- */}
                {groups.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Teams View: <span className="text-indigo-600">{selectedBatch?.batchTitle}</span>
                        </h2>
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
                                                        {member.studentImage ? <img src={member.studentImage} alt="" /> : (member.studentName ? member.studentName[0] : "U")}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupGenerator;