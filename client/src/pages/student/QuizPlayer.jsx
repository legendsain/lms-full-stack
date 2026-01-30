import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const QuizPlayer = () => {

  // --- CHANGE 1: Get quizId from URL instead of courseId ---
  const { quizId } = useParams() 
  const { backendUrl, getToken, navigate } = useContext(AppContext)
  
  const [quizData, setQuizData] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({}) 
  const [timeLeft, setTimeLeft] = useState(null)
  
  const [attemptData, setAttemptData] = useState(null); 

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const fetchQuiz = async () => {
    try {
      const token = await getToken()
      
      // --- CHANGE 2: Fetch specific quiz by ID ---
      const { data } = await axios.get(backendUrl + `/api/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } })
      
      if (data.success && data.quiz) {
        setQuizData(data.quiz)
        
        // Check for previous attempt
        if (data.attempt) {
            setAttemptData(data.attempt);
            return;
        }

        // Set Timer
        if (data.quiz.timeLimit && data.quiz.timeLimit > 0) {
            setTimeLeft(data.quiz.timeLimit * 60); 
        }
      } else {
        toast.error("Quiz not found")
        navigate(-1)
      }
    } catch (error) {
      toast.error("Failed to load quiz")
    }
  }

  useEffect(() => {
    // Timer Logic
    if (timeLeft === null || timeLeft <= 0 || attemptData) return;

    const timerId = setInterval(() => {
        setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
                clearInterval(timerId);
                handleSubmit(true);
                return 0;
            }
            return prevTime - 1;
        });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, attemptData]);

  const handleOptionSelect = (optionIndex) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: optionIndex })
  }

  const handleNext = () => { if (currentQuestionIndex < quizData.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1) }
  const handlePrevious = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1) }

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
        if (!isAutoSubmit && !window.confirm("Are you sure you want to submit?")) return;
        
        const token = await getToken();
        const answersArray = quizData.questions.map((_, index) => selectedAnswers[index] ?? null);

        const { data } = await axios.post(backendUrl + '/api/quiz/submit', {
            quizId: quizData._id,
            // --- CHANGE 3: Get courseId from the loaded quiz data (since it's not in URL anymore) ---
            courseId: quizData.courseId, 
            answers: answersArray
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (data.success) {
            toast.success(`Quiz Submitted! Score: ${data.score}/${data.totalQuestions}`);
            setAttemptData({ score: data.score, totalQuestions: data.totalQuestions });
        } else {
            toast.error(data.message);
        }

    } catch (error) {
        toast.error(error.message);
    }
  }

  // --- CHANGE 4: Dependency array now watches quizId ---
  useEffect(() => { fetchQuiz() }, [quizId])

  if (!quizData) return <div className="p-10 text-center">Loading Quiz...</div>

  // --- VIEW 1: ALREADY ATTEMPTED SCREEN ---
  if (attemptData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
                <p className="text-gray-500 mb-6">You have already attempted this quiz.</p>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Your Score</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{attemptData.score} <span className="text-xl text-gray-400">/ {attemptData.totalQuestions}</span></p>
                </div>

                {/* Return to the Quiz List (or Enrolled Courses) */}
                <button onClick={() => navigate(-1)} className="bg-black text-white px-6 py-2.5 rounded hover:bg-gray-800 transition w-full">
                    Back to Quiz List
                </button>
            </div>
        </div>
      )
  }

  // --- VIEW 2: QUIZ PLAYER (Normal) ---
  const currentQuestion = quizData.questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
      {/* Header & Timer */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{quizData.title}</h1>
        {timeLeft !== null && (
            <div className={`px-4 py-2 rounded font-mono font-bold text-lg border ${timeLeft < 60 ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : 'bg-blue-100 text-blue-600 border-blue-300'}`}>
                ⏱ {formatTime(timeLeft)}
            </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl border border-gray-200">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}></div>
        </div>

        <div className="mb-6">
            <span className="text-sm text-gray-500 font-medium">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
            <h2 className="text-xl text-gray-800 font-semibold mt-2">{currentQuestion.questionText}</h2>
        </div>

        <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option, index) => (
                <button 
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`text-left p-4 rounded border transition-all ${selectedAnswers[currentQuestionIndex] === index ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                    <span className="font-medium mr-3 text-gray-500">{String.fromCharCode(65 + index)}.</span>
                    {option}
                </button>
            ))}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className={`px-6 py-2 rounded ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>Previous</button>
            {currentQuestionIndex === quizData.questions.length - 1 ? (
                <button onClick={() => handleSubmit(false)} className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 font-medium">Submit Quiz</button>
            ) : (
                <button onClick={handleNext} className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 font-medium">Next Question</button>
            )}
        </div>
      </div>
    </div>
  )
}

export default QuizPlayer