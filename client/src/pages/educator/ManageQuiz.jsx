import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const ManageQuiz = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken } = useContext(AppContext);
    
    const [view, setView] = useState('list');
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [activeTab, setActiveTab] = useState('manage'); 
    
    // Quiz Data State
    const [questions, setQuestions] = useState([]);
    const [results, setResults] = useState([]);
    const [file, setFile] = useState(null);
    const [quizTitle, setQuizTitle] = useState("New Quiz");

    // NEW STATES
    const [numQuestions, setNumQuestions] = useState(10);
    const [passingPercentage, setPassingPercentage] = useState(50);
    
    const [loading, setLoading] = useState(false);
    const [genLoading, setGenLoading] = useState(false);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/quiz/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) setQuizzes(data.quizzes);
        } catch (error) { toast.error(error.message); }
        setLoading(false);
    };

    useEffect(() => { fetchQuizzes(); }, [courseId]);

    const openQuiz = async (quiz) => {
        setLoading(true);
        try {
            const token = await getToken();
            setSelectedQuiz(quiz);
            setQuizTitle(quiz.title);
            setQuestions(quiz.questions);
            setPassingPercentage(quiz.passingPercentage || 50); // Load existing setting

            const resData = await axios.get(backendUrl + `/api/quiz/results/${quiz._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resData.data.success) setResults(resData.data.results);

            setView('editor');
            setActiveTab('manage');
        } catch (error) { toast.error("Failed to load quiz details"); }
        setLoading(false);
    };

    const createNewQuiz = () => {
        setSelectedQuiz(null);
        setQuizTitle("Untitled Quiz");
        setQuestions([]);
        setResults([]);
        setFile(null);
        setNumQuestions(10); // Reset default
        setPassingPercentage(50); // Reset default
        setView('editor');
        setActiveTab('manage');
    };

    const handleGenerate = async () => {
        if (!file) return toast.error("Upload a file first");
        if (numQuestions < 1 || numQuestions > 50) return toast.error("Questions must be between 1 and 50");
        
        setGenLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('numQuestions', numQuestions); // Send count to backend

        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/generate', formData, { headers: { Authorization: `Bearer ${token}` }});
            if (data.success) {
                setQuestions(data.quizData);
                toast.success(`Generated ${data.quizData.length} Questions!`);
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
                passingPercentage, // Send to backend
                quizId: selectedQuiz ? selectedQuiz._id : null
            };
            const { data } = await axios.post(backendUrl + '/api/quiz/save', payload, { headers: { Authorization: `Bearer ${token}` }});
            if (data.success) {
                toast.success("Quiz Saved Successfully!");
                fetchQuizzes();
                setView('list');
            } else toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    if (loading && view === 'list') return <Loading />;

    // LIST VIEW (Unchanged basically, just context)
    if (view === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Quiz Library</h1>
                            <p className="text-gray-500">Manage all assessments for this course.</p>
                        </div>
                        <button onClick={createNewQuiz} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md transition">+ Create New Quiz</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div onClick={createNewQuiz} className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition h-64 group">
                            <span className="text-3xl text-gray-400 group-hover:text-blue-500 mb-2">+</span>
                            <h3 className="text-lg font-semibold text-gray-600 group-hover:text-blue-600">Add New Quiz</h3>
                        </div>
                        {quizzes.map((quiz) => (
                            <div key={quiz._id} onClick={() => openQuiz(quiz)} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition cursor-pointer flex flex-col justify-between h-64">
                                <div>
                                    <div className="flex justify-between mb-4"><span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">QUIZ</span><span className="text-xs text-gray-400">{new Date(quiz.createdAt).toLocaleDateString()}</span></div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{quiz.title}</h3>
                                    <p className="text-gray-500 text-sm">{quiz.questions.length} Questions • Pass: {quiz.passingPercentage}%</p>
                                </div>
                                <span className="text-blue-600 text-sm font-semibold hover:underline mt-4 block">Manage & Results →</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // EDITOR VIEW
    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2">← Back to Library</button>

                {/* HEADER SETTINGS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex-1 min-w-[300px]">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quiz Title</label>
                            <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="text-3xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 outline-none pb-2 mt-1" placeholder="Enter Quiz Title..." />
                        </div>
                        <div className="w-32">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pass Score (%)</label>
                             <input type="number" min="1" max="100" value={passingPercentage} onChange={(e) => setPassingPercentage(e.target.value)} className="w-full border border-gray-300 rounded p-2 mt-1" />
                        </div>
                        <button onClick={handleSave} className="bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 shadow-md transition">Save Quiz</button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-6 border-b border-gray-300 mb-8">
                    <button onClick={() => setActiveTab('manage')} className={`pb-3 text-lg font-medium transition-all ${activeTab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Questions ({questions.length})</button>
                    <button onClick={() => setActiveTab('results')} disabled={!selectedQuiz} className={`pb-3 text-lg font-medium transition-all ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Results ({results.length})</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {activeTab === 'manage' && (
                        <div>
                            {/* GENERATOR SECTION */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700">Auto-Generate with AI</h3>
                                    <p className="text-xs text-gray-500 mt-1">Upload content and choose how many questions you want.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Count</label>
                                        <input type="number" min="1" max="50" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-16 border border-gray-300 rounded p-1 text-sm text-center" />
                                    </div>
                                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm w-48" />
                                    <button onClick={handleGenerate} disabled={genLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50">
                                        {genLoading ? "Generating..." : "Generate"}
                                    </button>
                                </div>
                            </div>

                            {/* QUESTIONS LIST */}
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition">
                                        <div className="flex gap-3 mb-3">
                                            <span className="text-blue-600 font-bold">Q{idx+1}</span>
                                            <input className="font-medium text-gray-800 w-full bg-transparent outline-none" value={q.question} onChange={(e) => { const newQ = [...questions]; newQ[idx].question = e.target.value; setQuestions(newQ); }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 ml-8">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`p-2 rounded text-sm flex items-center gap-2 border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                                                    <div className={`w-3 h-3 rounded-full ${opt === q.correctAnswer ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <input className="bg-transparent w-full outline-none text-gray-700" value={opt} onChange={(e) => { const newQ = [...questions]; newQ[idx].options[i] = e.target.value; if(opt === q.correctAnswer) newQ[idx].correctAnswer = e.target.value; setQuestions(newQ); }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <table className="min-w-full text-left">
                            <thead><tr className="border-b border-gray-200 text-gray-500 text-sm uppercase"><th className="py-3 px-4">Student</th><th className="py-3 px-4">Score</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Status</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((res, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 flex items-center gap-3">{res.studentImage && <img src={res.studentImage} className="w-8 h-8 rounded-full" alt="" />}<span className="font-medium text-gray-800">{res.studentName}</span></td>
                                        <td className="py-3 px-4 font-bold">{res.score} / {res.totalQuestions}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{new Date(res.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${((res.score/res.totalQuestions)*100) >= passingPercentage ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{((res.score/res.totalQuestions)*100) >= passingPercentage ? "Passed" : "Failed"}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ManageQuiz;