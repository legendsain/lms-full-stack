import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { Line } from 'rc-progress';
import Footer from '../../components/student/Footer';
import { toast } from 'react-toastify'; 

const MyEnrollments = () => {

    const { userData, enrolledCourses, fetchUserEnrolledCourses, navigate, backendUrl, getToken, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext)

    const [progressArray, setProgressData] = useState([])

    const getCourseProgress = async () => {
        try {
            const token = await getToken();

            const tempProgressArray = await Promise.all(
                enrolledCourses.map(async (course) => {
                    const { data } = await axios.post(
                        `${backendUrl}/api/user/get-course-progress`,
                        { courseId: course._id },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    let totalLectures = calculateNoOfLectures(course);
                    const lectureCompleted = data.progressData ? data.progressData.lectureCompleted.length : 0;
                    return { totalLectures, lectureCompleted };
                })
            );

            setProgressData(tempProgressArray);
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (userData) {
            fetchUserEnrolledCourses()
        }
    }, [userData])

    useEffect(() => {
        if (enrolledCourses.length > 0) {
            getCourseProgress()
        }
    }, [enrolledCourses])

    return (
        <>
            <div className='section-container pt-10 pb-16 animate-fade-in'>
                <div className="mb-8">
                  <h1 className='text-2xl md:text-3xl font-extrabold text-surface-900 tracking-tight'>My Enrollments</h1>
                  <p className="text-sm text-surface-500 mt-1">Track your progress and continue learning.</p>
                </div>

                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-20 premium-card">
                    <div className="text-4xl mb-4">📖</div>
                    <h3 className="text-lg font-semibold text-surface-700">No enrollments yet</h3>
                    <p className="text-surface-500 text-sm mt-1 mb-4">Start your learning journey by enrolling in a course.</p>
                    <button onClick={() => navigate('/course-list')} className="btn-primary">Browse Courses</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course, index) => (
                      <div key={index} className="premium-card p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 animate-fade-in-up" style={{animationDelay: `${index * 0.05}s`}}>
                        
                        {/* Course Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <img src={course.courseThumbnail} alt="" className="w-16 sm:w-24 md:w-28 aspect-video object-cover rounded-xl shadow-sm flex-shrink-0" />
                          <div className='flex-1 min-w-0'>
                            <p className='mb-1.5 text-sm md:text-base font-semibold text-surface-900 truncate'>{course.courseTitle}</p>
                            <div className="w-full max-w-xs">
                              <Line 
                                className='rounded-full' 
                                strokeWidth={3} 
                                trailWidth={3}
                                strokeColor="#6366f1"
                                trailColor="#e5e5e5"
                                percent={progressArray[index] ? (progressArray[index].lectureCompleted * 100) / progressArray[index].totalLectures : 0} 
                              />
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-surface-500">
                              <span>{calculateCourseDuration(course)}</span>
                              <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                              <span>
                                {progressArray[index] && `${progressArray[index].lectureCompleted}/${progressArray[index].totalLectures}`} Lectures
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                          <button 
                            onClick={() => navigate('/player/' + course._id)} 
                            className='btn-primary !text-xs !px-4 !py-2'
                          >
                            {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 
                              ? '✓ Completed' 
                              : '▶ Continue'}
                          </button>

                          <button 
                            onClick={() => navigate('/course/quizzes/' + course._id)}
                            className='btn-secondary !text-xs !px-4 !py-2'
                          >
                            Quiz
                          </button>

                          <button 
                            onClick={() => navigate('/student/mindmaps/' + course._id)}
                            className='btn-ghost !text-xs !px-3 !py-2 !text-violet-600 hover:!bg-violet-50'
                          >
                            Mind Maps
                          </button>
                          
                          <button 
                            onClick={() => navigate('/student/teams/' + course._id)}
                            className='btn-ghost !text-xs !px-3 !py-2 !text-brand-600 hover:!bg-brand-50'
                          >
                            Teams
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <Footer />
        </>
    )
}

export default MyEnrollments