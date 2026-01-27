import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const ManageQuiz = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken } = useContext(AppContext);
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!file) return toast.error("Please upload a file first");
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/generate', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setQuestions(data.quizData);
                toast.success("Quiz Generated!");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/quiz/save', 
                { courseId, title: "Course Quiz", questions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) toast.success("Quiz Published!");
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Manage Quiz</h1>
            
            {/* Upload Section */}
            <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">1. Generate with AI</h2>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-4" accept="application/pdf, image/*" />
                <button 
                    onClick={handleGenerate} 
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate Quiz"}
                </button>
            </div>

            {/* Preview Section */}
            {questions.length > 0 && (
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">2. Review & Publish</h2>
                    {questions.map((q, index) => (
                        <div key={index} className="mb-4 border-b pb-4">
                            <p className="font-medium">Q{index + 1}: {q.question}</p>
                            <ul className="list-disc pl-5 text-gray-600">
                                {q.options.map((opt, i) => (
                                    <li key={i} className={opt === q.correctAnswer ? "text-green-600 font-bold" : ""}>
                                        {opt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded mt-4">
                        Publish Quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageQuiz;