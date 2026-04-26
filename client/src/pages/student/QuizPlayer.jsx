import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const QuizPlayer = () => {

  const { quizId } = useParams() 
  const { backendUrl, getToken, navigate } = useContext(AppContext)
  
  const [quizData, setQuizData] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({}) 
  const [timeLeft, setTimeLeft] = useState(null)
  
  const [attemptData, setAttemptData] = useState(null); 
  
  // --- PREVENT DOUBLE CLICKS ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const fetchQuiz = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + `/api/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } })
      
      if (data.success && data.quiz) {
        setQuizData(data.quiz)
        
        if (data.attempt) {
            setAttemptData(data.attempt);
            return;
        }

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
    if (timeLeft === null || timeLeft <= 0 || attemptData || isSubmitting) return;

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
  }, [timeLeft, attemptData, isSubmitting]);

  const handleOptionSelect = (optionIndex) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: optionIndex })
  }

  const handleNext = () => { if (currentQuestionIndex < quizData.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1) }
  const handlePrevious = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1) }

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
        if (isSubmitting) return; 

        if (!isAutoSubmit && !window.confirm("Are you sure you want to submit?")) return;
        
        setIsSubmitting(true);

        const token = await getToken();
        const answersArray = quizData.questions.map((_, index) => selectedAnswers[index] ?? null);

        const { data } = await axios.post(backendUrl + '/api/quiz/submit', {
            quizId: quizData._id,
            courseId: quizData.courseId, 
            answers: answersArray
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (data.success) {
            toast.success(`Quiz Submitted! Score: ${data.score}/${data.totalQuestions}`);
            setAttemptData({ score: data.score, totalQuestions: data.totalQuestions });
        } else {
            toast.error(data.message);
            setIsSubmitting(false); 
        }

    } catch (error) {
        toast.error(error.message);
        setIsSubmitting(false);
    }
  }

  useEffect(() => { fetchQuiz() }, [quizId])

  if (!quizData) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-surface-200 border-t-brand-600 animate-spin"></div>
        <p className="text-sm text-surface-400 font-medium">Loading Quiz...</p>
      </div>
    </div>
  );

  // --- VIEW 1: ALREADY ATTEMPTED SCREEN ---
  if (attemptData) {
      return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
            <div className="premium-card p-8 max-w-md w-full text-center animate-scale-in">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                </div>
                <h1 className="text-2xl font-bold text-surface-900 mb-2">Quiz Completed!</h1>
                <p className="text-surface-500 mb-6">You have already attempted this quiz.</p>
                
                <div className="bg-brand-50 p-6 rounded-2xl mb-6">
                    <p className="text-xs text-surface-400 uppercase font-bold tracking-wider mb-2">Your Score</p>
                    <p className="text-4xl font-extrabold text-brand-600">
                      {attemptData.score} <span className="text-xl text-surface-400">/ {attemptData.totalQuestions}</span>
                    </p>
                </div>

                <button onClick={() => navigate(-1)} className="btn-primary w-full">
                    Back to Quiz List
                </button>
            </div>
        </div>
      )
  }

  // --- VIEW 2: QUIZ PLAYER ---
  const currentQuestion = quizData.questions[currentQuestionIndex]
  const progressPercent = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center pt-10 px-4 pb-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-surface-900">{quizData.title}</h1>
          {timeLeft !== null && (
            <div className={`px-4 py-2 rounded-xl font-mono font-bold text-sm border ${
              timeLeft < 60 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-brand-50 text-brand-600 border-brand-200'
            }`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Quiz Card */}
        <div className="premium-card p-6 md:p-8 animate-fade-in">
          {/* Progress */}
          <div className="w-full bg-surface-100 rounded-full h-2 mb-6">
            <div 
              className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <span className="badge-primary mb-3 inline-flex">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
            <h2 className="text-lg md:text-xl text-surface-900 font-semibold mt-2 leading-relaxed">{currentQuestion.questionText}</h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                  selectedAnswers[currentQuestionIndex] === index 
                    ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-sm' 
                    : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50 text-surface-700'
                }`}
              >
                <span className={`font-semibold mr-3 ${
                  selectedAnswers[currentQuestionIndex] === index ? 'text-brand-600' : 'text-surface-400'
                }`}>
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-surface-100">
            <button 
              onClick={handlePrevious} 
              disabled={currentQuestionIndex === 0} 
              className={`btn-ghost ${currentQuestionIndex === 0 ? '!text-surface-300 cursor-not-allowed' : ''}`}
            >
              ← Previous
            </button>
            {currentQuestionIndex === quizData.questions.length - 1 ? (
              <button 
                onClick={() => handleSubmit(false)} 
                disabled={isSubmitting}
                className={`${isSubmitting ? 'bg-surface-300 text-surface-500 cursor-not-allowed px-6 py-2.5 rounded-xl text-sm font-semibold' : 'btn-primary !bg-emerald-600 hover:!bg-emerald-700'}`}
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz ✓"}
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                Next Question →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizPlayer