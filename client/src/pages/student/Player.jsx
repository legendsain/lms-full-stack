import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import YouTube from 'react-youtube';
import { assets } from '../../assets/assets';
import { useParams } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { toast } from 'react-toastify';
import Rating from '../../components/student/Rating';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';

const Player = ({ }) => {

  const { enrolledCourses, backendUrl, getToken, calculateChapterTime, userData, fetchUserEnrolledCourses } = useContext(AppContext)

  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);

  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course)
        course.courseRatings.map((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating)
          }
        })
      }
    })
  }

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData()
    }
  }, [enrolledCourses])

  const markLectureAsCompleted = async (lectureId) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/update-course-progress',
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        getCourseProgress()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const getCourseProgress = async () => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/get-course-progress',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProgressData(data.progressData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const handleRate = async (rating) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/add-rating',
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {

    getCourseProgress()

  }, [])

  return courseData ? (
    <>
    
    <div className='section-container py-8 animate-fade-in'>
      <div className='flex flex-col-reverse md:grid md:grid-cols-2 gap-10'>
        {/* Left: Course Structure */}
        <div className="text-surface-800">
          <h2 className="text-xl font-bold text-surface-900 mb-4">Course Structure</h2>
          <div className="space-y-2">
            {courseData && courseData.courseContent.map((chapter, index) => (
              <div key={index} className="premium-card overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-surface-50 transition-colors"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${openSections[index] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                    <p className="font-medium text-sm">{chapter.chapterTitle}</p>
                  </div>
                  <p className="text-xs text-surface-400">{chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}</p>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-[500px]" : "max-h-0"}`}>
                  <ul className="px-4 py-2 border-t border-surface-100 space-y-0.5">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-surface-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                            </svg>
                          )}
                          <span className="text-sm text-surface-700">{lecture.lectureTitle}</span>
                        </div>
                        <div className='flex items-center gap-3 text-xs'>
                          {lecture.lectureUrl && (
                            <button onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })} className='text-brand-600 font-semibold hover:underline'>
                              Watch
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

          {/* Rating */}
          <div className="flex items-center gap-3 py-6 mt-8 border-t border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Rate this Course:</h3>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* Right: Video Player */}
        <div className='md:sticky md:top-24 md:self-start'>
          {playerData ? (
            <div className="space-y-3">
              <div className="premium-card overflow-hidden">
                <YouTube iframeClassName='w-full aspect-video' videoId={playerData.lectureUrl.split('/').pop()} />
              </div>
              <div className='flex justify-between items-center'>
                <p className='text-base font-semibold text-surface-900'>
                  <span className="text-surface-400 font-normal">{playerData.chapter}.{playerData.lecture}</span> {playerData.lectureTitle}
                </p>
                <button 
                  onClick={() => markLectureAsCompleted(playerData.lectureId)} 
                  className={`text-sm font-semibold transition-colors ${
                    progressData && progressData.lectureCompleted.includes(playerData.lectureId) 
                      ? 'text-emerald-600' 
                      : 'text-brand-600 hover:underline'
                  }`}
                >
                  {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? '✓ Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <img src={courseData ? courseData.courseThumbnail : ''} alt="" className="w-full aspect-video object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
    <Footer />
    </>
  ) : <Loading />
}

export default Player