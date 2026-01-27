import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets'; // Ensure you have access to assets

const ManageQuiz = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken } = useContext(AppContext);
    
    // VIEW STATE: 'list' | 'editor'
    const [view, setView] = useState('list');
    
    // DATA STATE
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null); // The quiz currently being edited
    
    // EDITOR STATE
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'results'
    const [questions, setQuestions] = useState([]);
    const [results, setResults] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [genLoading, setGenLoading] = useState(false);
    const [quizTitle, setQuizTitle] = useState("New Quiz");

    // --- FETCH ALL QUIZZES (LIST VIEW) ---
    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/quiz/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setQuizzes(data.quizzes);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuizzes();
    }, [courseId]);

    // --- OPEN A SPECIFIC QUIZ ---
    const openQuiz = async (quiz) => {
        setLoading(true);
        try {
            const token = await getToken();
            
            // 1. Set Basic Data
            setSelectedQuiz(quiz);
            setQuizTitle(quiz.title);
            setQuestions(quiz.questions);

            // 2. Fetch Results for THIS quiz
            const resData = await axios.get(backendUrl + `/api/quiz/results/${quiz._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resData.data.success) {
                setResults(resData.data.results);
            }

            setView('editor');
            setActiveTab('manage');
        } catch (error) {
            toast.error("Failed to load quiz details");
        }
        setLoading(false);
    };

    // --- CREATE NEW QUIZ MODE ---
    const createNewQuiz = () => {
        setSelectedQuiz(null);
        setQuizTitle("Untitled Quiz");
        setQuestions([]);
        setResults([]);
        setFile(null);
        setView('editor');
        setActiveTab('manage');
    };

    // --- GENERATE & SAVE HANDLERS ---
    const handleGenerate = async () => {
        if (!file) return toast.error("Upload a file first");
        setGenLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/generate', formData, { headers: { Authorization: `Bearer ${token}` }});
            if (data.success) {
                setQuestions(data.quizData);
                toast.success("Questions Generated!");
            } else toast.error(data.message);
        } catch (error) { toast.error(error.message); }
        setGenLoading(false);
    };

    const handleSave = async () => {
        if(!quizTitle) return toast.error("Please enter a Quiz Title");
        if(questions.length === 0) return toast.error("No questions to save");

        try {
            const token = await getToken();
            const payload = {
                courseId,
                title: quizTitle,
                questions,
                quizId: selectedQuiz ? selectedQuiz._id : null // Update if exists, else create
            };

            const { data } = await axios.post(backendUrl + '/api/quiz/save', payload, { headers: { Authorization: `Bearer ${token}` }});
            
            if (data.success) {
                toast.success("Quiz Saved Successfully!");
                fetchQuizzes(); // Refresh List
                setView('list'); // Go back to list
            } else toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    if (loading && view === 'list') return <Loading />;

    // --- VIEW 1: QUIZ COLLECTIONS (LIST) ---
    if (view === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Quiz Library</h1>
                            <p className="text-gray-500">Manage all assessments for this course.</p>
                        </div>
                        <button 
                            onClick={createNewQuiz}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2"
                        >
                             + Create New Quiz
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Quiz Card */}
                        <div 
                            onClick={createNewQuiz}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition h-64 group"
                        >
                            <div className="bg-gray-100 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition">
                                <span className="text-3xl text-gray-400 group-hover:text-blue-500">+</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 group-hover:text-blue-600">Add New Quiz</h3>
                        </div>

                        {/* Existing Quizzes */}
                        {quizzes.map((quiz) => (
                            <div 
                                key={quiz._id}
                                onClick={() => openQuiz(quiz)}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition cursor-pointer flex flex-col justify-between h-64"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-bold">QUIZ</div>
                                        <p className="text-xs text-gray-400">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{quiz.title}</h3>
                                    <p className="text-gray-500 text-sm">{quiz.questions.length} Questions</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-blue-600 text-sm font-semibold hover:underline">Manage & Results →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: EDITOR (MANAGE & RESULTS) ---
    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                
                {/* Back Navigation */}
                <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2">
                    ← Back to Library
                </button>

                {/* Header */}
                <div className="flex justify-between items-start mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="w-full">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quiz Title</label>
                        <input 
                            type="text" 
                            value={quizTitle} 
                            onChange={(e) => setQuizTitle(e.target.value)}
                            className="text-3xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 outline-none pb-2 mt-1"
                            placeholder="Enter Quiz Title..."
                        />
                    </div>
                    <button 
                        onClick={handleSave} 
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 shadow-md transition ml-8 whitespace-nowrap"
                    >
                        Save Quiz
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-300 mb-8">
                    <button 
                        onClick={() => setActiveTab('manage')}
                        className={`pb-3 text-lg font-medium transition-all ${activeTab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Questions <span className="ml-2 bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{questions.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('results')}
                        className={`pb-3 text-lg font-medium transition-all ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        disabled={!selectedQuiz} // Can't see results for unsaved quiz
                    >
                        Student Results <span className="ml-2 bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{results.length}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    
                    {/* TAB: MANAGE */}
                    {activeTab === 'manage' && (
                        <div>
                            {/* Generator */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center mb-8 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 mb-1">Auto-Generate Questions</h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
                                    <button 
                                        onClick={handleGenerate} 
                                        disabled={genLoading}
                                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-semibold disabled:opacity-50"
                                    >
                                        {genLoading ? "Generating..." : "Generate with AI"}
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition">
                                        <div className="flex gap-3 mb-3">
                                            <span className="text-blue-600 font-bold">Q{idx+1}</span>
                                            <input 
                                                className="font-medium text-gray-800 w-full bg-transparent outline-none" 
                                                value={q.question}
                                                onChange={(e) => {
                                                    const newQ = [...questions];
                                                    newQ[idx].question = e.target.value;
                                                    setQuestions(newQ);
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 ml-8">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`p-2 rounded text-sm flex items-center gap-2 border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                                                    <div className={`w-3 h-3 rounded-full ${opt === q.correctAnswer ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <input 
                                                        className="bg-transparent w-full outline-none text-gray-700"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newQ = [...questions];
                                                            newQ[idx].options[i] = e.target.value;
                                                            // If we edit the correct answer text, update correctAnswer field too
                                                            if(opt === q.correctAnswer) newQ[idx].correctAnswer = e.target.value;
                                                            setQuestions(newQ);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: RESULTS */}
                    {activeTab === 'results' && (
                        <div>
                             <table className="min-w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase">
                                        <th className="py-3 px-4">Student</th>
                                        <th className="py-3 px-4">Score</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {results.map((res, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 flex items-center gap-3">
                                                {res.studentImage && <img src={res.studentImage} className="w-8 h-8 rounded-full" />}
                                                <span className="font-medium text-gray-800">{res.studentName}</span>
                                            </td>
                                            <td className="py-3 px-4 font-bold">{res.score} / {res.totalQuestions}</td>
                                            <td className="py-3 px-4 text-sm text-gray-500">{new Date(res.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${res.score/res.totalQuestions >= 0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {res.score/res.totalQuestions >= 0.5 ? "Passed" : "Failed"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {results.length === 0 && <p className="text-center py-10 text-gray-400">No results yet.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageQuiz;