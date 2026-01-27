import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const QuizPlayer = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken } = useContext(AppContext);
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + `/api/quiz/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) setQuiz(data.quiz);
        };
        fetchQuiz();
    }, [courseId]);

    const handleOptionSelect = (qId, option) => {
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const handleSubmit = async () => {
        const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedOption: answers[qId]
        }));
        
        const token = await getToken();
        const { data } = await axios.post(backendUrl + '/api/quiz/submit', 
            { courseId, quizId: quiz._id, answers: formattedAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (data.success) setResult({ score: data.score, total: data.totalQuestions });
    };

    if (result) return (
        <div className="h-screen flex items-center justify-center text-center">
            <div className="bg-white p-10 rounded shadow-xl">
                <h1 className="text-4xl font-bold text-blue-600">{result.score} / {result.total}</h1>
                <p className="text-gray-600 mt-2">Your Score</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 underline">Retry</button>
            </div>
        </div>
    );

    if (!quiz) return <div className="p-10 text-center">Loading Quiz...</div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>
            {quiz.questions.map((q) => (
                <div key={q._id} className="mb-6 bg-white p-6 rounded shadow">
                    <p className="text-lg font-medium mb-4">{q.question}</p>
                    <div className="grid gap-2">
                        {q.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleOptionSelect(q._id, opt)}
                                className={`p-3 text-left border rounded ${answers[q._id] === opt ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded text-lg font-semibold w-full">
                Submit Quiz
            </button>
        </div>
    );
};

export default QuizPlayer;