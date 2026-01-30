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
            setQuestions(quiz.questions);
            
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
                // --- CRITICAL FIX: Convert AI Text Answer to Number Index ---
                const formattedQuestions = data.quizData.map(q => {
                    // If AI returns a string (e.g., "Dennis Richie"), find its index in the options
                    if (typeof q.correctAnswer === 'string') {
                        const index = q.options.findIndex(opt => opt === q.correctAnswer);
                        // If found, use the index. If not found, default to 0 (First Option)
                        return { ...q, correctAnswer: index !== -1 ? index : 0 };
                    }
                    // If AI returned a number, keep it
                    return q;
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

    // --- HELPER: ADD MANUAL QUESTION ---
    const addManualQuestion = () => {
        setQuestions([
            ...questions, 
            { 
                question: "", 
                options: ["", "", "", ""], 
                correctAnswer: 0 // Default to first option being correct (Index 0)
            }
        ]);
    };

    // --- HELPER: UPDATE QUESTION FIELD ---
    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    // --- HELPER: UPDATE OPTION ---
    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    // --- HELPER: SET CORRECT ANSWER ---
    const setCorrectOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctAnswer = oIndex; // Store the INDEX (0-3)
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
                            <div key={quiz._id} onClick={() => openQuiz(quiz)} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition cursor-pointer flex flex-col justify-between h-64">
                                <div>
                                    <div className="flex justify-between mb-4"><span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">QUIZ</span><span className="text-xs text-gray-400">{new Date(quiz.createdAt).toLocaleDateString()}</span></div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{quiz.title}</h3>
                                    <p className="text-gray-500 text-sm">{quiz.questions.length} Questions • {quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No Limit'}</p>
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

                {/* SETTINGS HEADER */}
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
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md transition h-[42px] self-end">Save Quiz</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {activeTab === 'manage' && (
                        <div>
                            {/* AI GENERATOR */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gray-50">
                                <div><h3 className="text-sm font-bold text-gray-700">Auto-Generate with AI</h3><p className="text-xs text-gray-500 mt-1">Upload content to generate questions.</p></div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Count</label><input type="number" min="1" max="50" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-16 border border-gray-300 rounded p-1 text-sm text-center" /></div>
                                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm w-48" />
                                    <button onClick={handleGenerate} disabled={genLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50">{genLoading ? "Generating..." : "Generate"}</button>
                                </div>
                            </div>

                            {/* QUESTIONS LIST */}
                            <div className="space-y-6">
                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className="border border-gray-200 p-5 rounded-lg hover:bg-gray-50 transition relative group">
                                        <button onClick={() => {const newQ = questions.filter((_, i) => i !== qIdx); setQuestions(newQ)}} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">✕</button>
                                        
                                        <div className="flex gap-3 mb-4 items-center">
                                            <span className="text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded text-sm">Q{qIdx+1}</span>
                                            <input 
                                                className="font-medium text-gray-800 w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none pb-1" 
                                                value={q.question} 
                                                onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)} 
                                                placeholder="Type your question here..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-10">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-3 rounded-md text-sm flex items-center gap-3 border transition-colors ${oIdx === q.correctAnswer ? 'bg-green-50 border-green-300 ring-1 ring-green-300' : 'bg-white border-gray-200'}`}>
                                                    
                                                    {/* CLICKABLE CIRCLE FOR SELECTION */}
                                                    <div 
                                                        onClick={() => setCorrectOption(qIdx, oIdx)}
                                                        className={`w-5 h-5 rounded-full cursor-pointer border flex items-center justify-center flex-shrink-0 transition-colors ${oIdx === q.correctAnswer ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}
                                                    >
                                                        {oIdx === q.correctAnswer && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                    </div>

                                                    <input 
                                                        className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400" 
                                                        value={opt} 
                                                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} 
                                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} // Shows Option A, Option B...
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                <button onClick={addManualQuestion} className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition font-medium flex items-center justify-center gap-2">
                                    <span className="text-2xl leading-none">+</span> Add Manual Question
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ManageQuiz;