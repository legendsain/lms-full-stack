import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';

const StudentQuizList = () => {
  const { courseId } = useParams();
  const { backendUrl, getToken, navigate } = useContext(AppContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/quiz/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <div className="flex-grow section-container pt-10 pb-20 animate-fade-in">
        <button onClick={() => navigate('/my-enrollments')} className="btn-ghost mb-6 !px-0 gap-2 text-surface-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to My Courses
        </button>

        <div className="max-w-4xl">
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">Available Quizzes</h1>
          <p className="text-surface-500 mt-2 mb-8">Select a quiz to start your assessment.</p>

          {quizzes.length === 0 ? (
            <div className="text-center py-20 premium-card">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-surface-700">No quizzes available</h3>
              <p className="text-surface-500 text-sm mt-1">No quizzes have been created for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz, index) => (
                <div 
                  key={quiz._id} 
                  className="premium-card p-5 flex flex-col md:flex-row items-center justify-between gap-4 hover-lift animate-fade-in-up"
                  style={{animationDelay: `${index * 0.08}s`}}
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-surface-900">{quiz.title}</h3>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {quiz.questions.length} Questions • {quiz.timeLimit && quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'No Time Limit'}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/course/quiz/${quiz._id}`)} 
                    className="btn-primary w-full md:w-auto"
                  >
                    Start Quiz
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentQuizList;