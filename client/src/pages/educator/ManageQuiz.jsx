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

    // Settings States
    const [numQuestions, setNumQuestions] = useState(10);
    const [passingPercentage, setPassingPercentage] = useState(50);
    const [timeLimit, setTimeLimit] = useState(0);
    
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
            
            const mappedQuestions = quiz.questions.map(q => ({
                ...q,
                questionText: q.questionText || q.question || "" 
            }));
            setQuestions(mappedQuestions);
            
            setPassingPercentage(quiz.passingPercentage || 50); 
            setTimeLimit(quiz.timeLimit || 0);

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
        setNumQuestions(10); 
        setPassingPercentage(50); 
        setTimeLimit(0);
        setView('editor');
        setActiveTab('manage');
    };

    // --- NEW FUNCTION: DELETE QUIZ ---
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(backendUrl + `/api/quiz/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Quiz Deleted Successfully");
                // If we are in editor view, go back to list
                if (view === 'editor') {
                    setView('list');
                }
                // Refresh list
                fetchQuizzes();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleGenerate = async () => {
        if (!file) return toast.error("Upload a file first");
        setGenLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('numQuestions', numQuestions); 

        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/generate', formData, { headers: { Authorization: `Bearer ${token}` }});
            if (data.success) {
                const formattedQuestions = data.quizData.map(q => {
                    let correctIndex = 0;
                    if (typeof q.correctAnswer === 'string') {
                        const idx = q.options.findIndex(opt => opt === q.correctAnswer);
                        correctIndex = idx !== -1 ? idx : 0;
                    } else {
                        correctIndex = q.correctAnswer;
                    }
                    return { 
                        questionText: q.question || q.questionText, 
                        options: q.options,
                        correctAnswer: correctIndex
                    };
                });
                
                setQuestions(formattedQuestions);
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
                passingPercentage: Number(passingPercentage),
                timeLimit: Number(timeLimit),
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

    const exportToCSV = () => {
        if (results.length === 0) return toast.error("No results to export");
        const headers = ["Student Name,Score,Total Questions,Percentage,Status,Date"];
        const rows = results.map(res => {
            const percentage = ((res.score / res.totalQuestions) * 100).toFixed(1);
            const status = percentage >= passingPercentage ? "Passed" : "Failed";
            const date = new Date(res.date).toLocaleDateString();
            return `"${res.studentName}",${res.score},${res.totalQuestions},${percentage}%,${status},${date}`;
        });
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${quizTitle.replace(/\s+/g, '_')}_Results.csv`);
        link.click();
    };

    const addManualQuestion = () => {
        setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }]);
    };
    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };
    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };
    const setCorrectOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctAnswer = oIndex;
        setQuestions(newQuestions);
    };

    if (loading && view === 'list') return <Loading />;

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
                            <div key={quiz._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition flex flex-col justify-between h-64 relative">
                                {/* --- DELETE BUTTON (List View) --- */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz._id); }} 
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                    title="Delete Quiz"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>

                                <div onClick={() => openQuiz(quiz)} className="cursor-pointer">
                                    <div className="flex justify-between mb-4"><span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">QUIZ</span><span className="text-xs text-gray-400">{new Date(quiz.createdAt).toLocaleDateString()}</span></div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{quiz.title}</h3>
                                    <p className="text-gray-500 text-sm">{quiz.questions.length} Questions • {quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No Limit'}</p>
                                </div>
                                <span onClick={() => openQuiz(quiz)} className="text-blue-600 text-sm font-semibold hover:underline mt-4 block cursor-pointer">Manage & Results →</span>
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quiz Title</label>
                            <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="text-3xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 outline-none pb-2 mt-1" placeholder="Enter Quiz Title..." />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Timer (mins)</label>
                                <input type="number" min="0" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full border border-gray-300 rounded p-2 mt-1 bg-gray-50" placeholder="0 = None" />
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pass (%)</label>
                                <input type="number" min="1" max="100" value={passingPercentage} onChange={(e) => setPassingPercentage(e.target.value)} className="w-full border border-gray-300 rounded p-2 mt-1 bg-gray-50" />
                            </div>
                            
                            {/* --- DELETE BUTTON (Editor View) --- */}
                            {selectedQuiz && (
                                <button 
                                    onClick={() => handleDelete(selectedQuiz._id)} 
                                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition h-[42px] self-end"
                                    title="Delete Quiz"
                                >
                                    Delete
                                </button>
                            )}
                            
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md transition h-[42px] self-end">Save Quiz</button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 border-b border-gray-300 mb-8">
                    <button onClick={() => setActiveTab('manage')} className={`pb-3 text-lg font-medium transition-all ${activeTab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Questions ({questions.length})</button>
                    <button onClick={() => setActiveTab('results')} disabled={!selectedQuiz} className={`pb-3 text-lg font-medium transition-all ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Results ({results.length})</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {activeTab === 'manage' && (
                        <div>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700">Auto-Generate with AI</h3>
                                    <p className="text-xs text-gray-500 mt-1">Upload content (PDF/Text) to generate questions.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Count</label>
                                        <input type="number" min="1" max="50" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-16 border border-gray-300 rounded p-2 text-sm text-center outline-none focus:border-blue-500" />
                                    </div>
                                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm font-medium">
                                        <span className="truncate max-w-[120px]">{file ? file.name : "Choose File"}</span>
                                        <input type="file" hidden accept=".pdf,.txt,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} />
                                    </label>
                                    <button onClick={handleGenerate} disabled={genLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50 shadow-md min-w-[100px]">{genLoading ? "Working..." : "Generate"}</button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className="border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition relative group">
                                        <button onClick={() => {const newQ = questions.filter((_, i) => i !== qIdx); setQuestions(newQ)}} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">✕</button>
                                        <div className="flex gap-3 mb-4 items-center">
                                            <span className="text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded text-sm">Q{qIdx+1}</span>
                                            <input className="font-medium text-gray-800 w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none pb-1" value={q.questionText} onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)} placeholder="Type your question here..." />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-10">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-3 rounded-md text-sm flex items-center gap-3 border transition-colors ${oIdx === q.correctAnswer ? 'bg-green-50 border-green-300 ring-1 ring-green-300' : 'bg-white border-gray-200'}`}>
                                                    <div onClick={() => setCorrectOption(qIdx, oIdx)} className={`w-5 h-5 rounded-full cursor-pointer border flex items-center justify-center flex-shrink-0 transition-colors ${oIdx === q.correctAnswer ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}>
                                                        {oIdx === q.correctAnswer && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                    </div>
                                                    <input className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400" value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addManualQuestion} className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition font-medium flex items-center justify-center gap-2"><span className="text-2xl leading-none">+</span> Add Manual Question</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Student Performance</h3>
                                <button onClick={exportToCSV} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Download CSV
                                </button>
                            </div>

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
                                    {results.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400">No attempts yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ManageQuiz;