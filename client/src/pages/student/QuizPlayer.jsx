import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';

const QuizPlayer = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken, navigate } = useContext(AppContext);
    
    // STATES
    const [view, setView] = useState('list'); // 'list' | 'quiz' | 'result'
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [scoreData, setScoreData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. FETCH ALL QUIZZES FOR THIS COURSE
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = await getToken();
                // Using the generic course quiz fetcher
                const { data } = await axios.get(backendUrl + `/api/quiz/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setQuizzes(data.quizzes);
                }
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        fetchQuizzes();
    }, [courseId, backendUrl, getToken]);

    // 2. START A QUIZ
    const startQuiz = async (quizId) => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setCurrentQuiz(data.quiz);
                setAnswers({}); // Reset answers
                setView('quiz');
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // 3. SUBMIT QUIZ
    const handleSubmit = async () => {
        const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedOption: answers[qId]
        }));
        
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/submit', 
                { courseId, quizId: currentQuiz._id, answers: formattedAnswers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (data.success) {
                setScoreData({
                    score: data.score,
                    total: data.totalQuestions,
                    passingPercentage: currentQuiz.passingPercentage || 50
                });
                setView('result');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <Loading />;

    // VIEW 1: QUIZ SELECTION LIST (Solves the "Loading..." issue)
    if (view === 'list') {
        return (
            <div className="max-w-4xl mx-auto p-8 font-sans">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Quizzes</h1>
                <p className="text-gray-500 mb-8">Select a quiz to test your knowledge.</p>

                {quizzes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-400">No quizzes available for this course yet.</p>
                        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quizzes.map((quiz) => (
                            <div key={quiz._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                        <span>📝 {quiz.questions.length} Questions</span>
                                        <span>🎯 Pass: {quiz.passingPercentage || 50}%</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => startQuiz(quiz._id)}
                                    className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    Start Quiz
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // VIEW 2: QUIZ INTERFACE
    if (view === 'quiz' && currentQuiz) {
        return (
            <div className="max-w-3xl mx-auto p-8 font-sans">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{currentQuiz.title}</h1>
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-red-500">Exit Quiz</button>
                </div>

                <div className="space-y-8">
                    {currentQuiz.questions.map((q, index) => (
                        <div key={q._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">{index + 1}. {q.question}</h3>
                            <div className="space-y-2">
                                {q.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAnswers(prev => ({ ...prev, [q._id]: opt }))}
                                        className={`w-full text-left p-3 rounded-lg border transition ${answers[q._id] === opt ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 border-t pt-6">
                    <button 
                        onClick={handleSubmit} 
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 shadow-md transition"
                        disabled={Object.keys(answers).length < currentQuiz.questions.length}
                    >
                        Submit Quiz ({Object.keys(answers).length}/{currentQuiz.questions.length})
                    </button>
                </div>
            </div>
        );
    }

    // VIEW 3: RESULT SCREEN
    if (view === 'result' && scoreData) {
        const percentage = Math.round((scoreData.score / scoreData.total) * 100);
        const passed = percentage >= scoreData.passingPercentage;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {passed ? '🏆' : '⚠️'}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{passed ? "Congratulations!" : "Keep Practicing!"}</h1>
                    <p className="text-gray-500 mb-6">{passed ? "You passed the quiz." : "You didn't reach the passing score."}</p>
                    
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <div className="text-5xl font-black text-gray-800 mb-2">{percentage}%</div>
                        <p className="text-sm text-gray-400 uppercase tracking-wide font-bold">Your Score: {scoreData.score} / {scoreData.total}</p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition">Back to List</button>
                        <button onClick={() => setView('quiz')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Retry Quiz</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default QuizPlayer;