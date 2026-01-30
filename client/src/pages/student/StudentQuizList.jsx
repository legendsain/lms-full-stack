import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

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
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/my-enrollments')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2">
          ← Back to My Courses
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Quizzes</h1>
        <p className="text-gray-500 mb-8">Select a quiz to start your assessment.</p>

        {quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400">No quizzes available for this course yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz, index) => (
              <div key={quiz._id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">
                      {/* Check if timeLimit exists and is greater than 0 */}
                      {quiz.questions.length} Questions • {quiz.timeLimit && quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'No Time Limit'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/course/quiz/${quiz._id}`)} 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizList;