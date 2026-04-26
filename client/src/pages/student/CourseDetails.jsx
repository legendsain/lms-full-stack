import React, { useContext, useEffect, useState } from 'react';
import Footer from '../../components/student/Footer';
import { assets } from '../../assets/assets';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube';
import { useAuth } from '@clerk/clerk-react';
import Loading from '../../components/student/Loading';

const CourseDetails = () => {

  const { id } = useParams()
  const navigate = useNavigate()

  const [courseData, setCourseData] = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)

  const { backendUrl, currency, userData, calculateChapterTime, calculateCourseDuration, calculateRating, calculateNoOfLectures } = useContext(AppContext)
  const { getToken } = useAuth()


  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/course/' + id)
      if (data.success) {
        setCourseData(data.courseData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.warn('Login to Enroll')
      }
      if (isAlreadyEnrolled) {
        return toast.warn('Already Enrolled')
      }
      const token = await getToken();
      const { data } = await axios.post(backendUrl + '/api/user/purchase',
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        const { session_url } = data
        window.location.replace(session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchCourseData()
  }, [])

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
    }
  }, [userData, courseData])

  const rating = courseData ? calculateRating(courseData) : 0;

  return courseData ? (
    <>
      <div className="relative animate-fade-in">
        {/* Background gradient */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-50/60 to-transparent -z-10"></div>

        <div className="section-container flex md:flex-row flex-col-reverse gap-10 items-start pt-10 md:pt-16 text-left">
          
          {/* --- LEFT COLUMN --- */}
          <div className="max-w-xl z-10 space-y-6 flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span onClick={() => navigate('/')} className='text-brand-600 cursor-pointer hover:underline font-medium'>Home</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span onClick={() => navigate('/course-list')} className='text-brand-600 cursor-pointer hover:underline font-medium'>Courses</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span className='text-surface-500 truncate max-w-[200px]'>{courseData.courseTitle}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
              {courseData.courseTitle}
            </h1>
            
            <div className="text-surface-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: courseData.courseDescription.slice(0, 200) }}></div>

            {/* Rating & Meta */}
            <div className='flex flex-wrap items-center gap-3 text-sm'>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-600">{rating}</span>
                <div className='flex gap-0.5'>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-400' : 'text-surface-200'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                  ))}
                </div>
                <span className='text-brand-600 font-medium'>({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})</span>
              </div>
              <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
              <span className="text-surface-500">{courseData.enrolledStudents.length} {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}</span>
            </div>

            <p className='text-sm text-surface-500'>Course by <span className='text-brand-600 font-semibold'>{courseData.educator.name}</span></p>

            {/* Course Structure */}
            <div className="pt-4">
              <h2 className="text-xl font-bold text-surface-900 mb-4">Course Structure</h2>
              <div className="space-y-2">
                {courseData.courseContent.map((chapter, index) => (
                  <div key={index} className="premium-card overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-surface-50 transition-colors"
                      onClick={() => toggleSection(index)}
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${openSections[index] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                        <p className="font-medium text-surface-800 text-sm">{chapter.chapterTitle}</p>
                      </div>
                      <p className="text-xs text-surface-400">{chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}</p>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                      <ul className="px-4 py-2 border-t border-surface-100 space-y-1">
                        {chapter.chapterContent.map((lecture, i) => (
                          <li key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                              </svg>
                              <span className="text-sm text-surface-700">{lecture.lectureTitle}</span>
                            </div>
                            <div className='flex items-center gap-3 text-xs'>
                              {lecture.isPreviewFree && (
                                <button onClick={() => setPlayerData({
                                  videoId: lecture.lectureUrl.split('/').pop()
                                })} className='text-brand-600 font-semibold hover:underline'>
                                  Preview
                                </button>
                              )}
                              <span className="text-surface-400">{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz Section */}
            {isAlreadyEnrolled && (
              <div className="premium-card p-6 bg-gradient-to-r from-violet-50 to-brand-50 border-violet-200/60 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-xl">📝</div>
                  <div>
                    <h3 className="text-base font-bold text-surface-900">Ready to test your knowledge?</h3>
                    <p className="text-violet-600 text-sm">Complete the quiz to evaluate your understanding.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/course/quizzes/' + courseData._id)} 
                  className="btn-accent !rounded-full whitespace-nowrap"
                >
                  Take Quiz
                </button>
              </div>
            )}

            {/* Description */}
            <div className="py-12">
              <h3 className="text-xl font-bold text-surface-900 mb-4">Course Description</h3>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}></div>
            </div>
          </div>

          {/* --- RIGHT COLUMN (Sidebar Card) --- */}
          <div className="w-full md:w-[420px] md:sticky md:top-24 z-10 flex-shrink-0">
            <div className="premium-card overflow-hidden">
              {playerData
                ? <YouTube videoId={playerData.videoId} opts={{ playerVars: { autoplay: 1 } }} iframeClassName='w-full aspect-video' />
                : <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className="w-full aspect-video object-cover" />
              }
              <div className="p-5 space-y-4">
                {/* Urgency */}
                <div className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-red-500"><span className="font-semibold">5 days</span> left at this price!</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-extrabold text-surface-900">{currency}{(courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)}</span>
                  <span className="text-lg text-surface-400 line-through">{currency}{courseData.coursePrice}</span>
                  <span className="badge-success">{courseData.discount}% off</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-surface-500">
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                    <span>{rating}</span>
                  </div>
                  <div className="h-4 w-px bg-surface-200"></div>
                  <span>{calculateCourseDuration(courseData)}</span>
                  <div className="h-4 w-px bg-surface-200"></div>
                  <span>{calculateNoOfLectures(courseData)} lessons</span>
                </div>
                
                <button onClick={enrollCourse} className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isAlreadyEnrolled 
                    ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                    : 'btn-primary !w-full'
                }`}>
                  {isAlreadyEnrolled ? "✓ Already Enrolled" : "Enroll Now"}
                </button>

                {/* Features */}
                <div className="pt-4 border-t border-surface-100">
                  <p className="font-semibold text-surface-900 mb-3">What's included</p>
                  <ul className="space-y-2.5 text-sm text-surface-600">
                    {['Lifetime access with free updates', 'Hands-on project guidance', 'Downloadable resources & source code', 'Quizzes to test your knowledge', 'Certificate of completion'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : <Loading />
};

export default CourseDetails;