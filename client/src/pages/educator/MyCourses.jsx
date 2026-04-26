import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyCourses = () => {

  const { backendUrl, isEducator, currency, getToken, navigate } = useContext(AppContext)
  
  const [courses, setCourses] = useState(null)

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/courses', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        setCourses(data.courses)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // --- DELETE FUNCTION ---
  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
        return;
    }

    try {
        const token = await getToken();
        const { data } = await axios.delete(backendUrl + '/api/educator/delete-course/' + courseId, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success) {
            toast.success(data.message);
            // Remove the deleted course from the local state immediately
            setCourses(prev => prev.filter(course => course._id !== courseId));
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses()
    }
  }, [isEducator])

  return courses ? (
    <div className='min-h-screen p-6 md:p-8 animate-fade-in'>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className='text-2xl font-bold text-surface-900 tracking-tight'>My Courses</h1>
            <p className="text-sm text-surface-500 mt-1">Manage your courses, quizzes, and teams.</p>
          </div>
          <button onClick={() => navigate('/educator/add-course')} className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Course
          </button>
        </div>

        <div className='space-y-3'>
          {courses.map((course) => (
            <div key={course._id} className='premium-card p-4 flex flex-wrap items-center justify-between gap-4 hover-lift'>
              <div className='flex items-center gap-4 flex-1 min-w-0'>
                <img className='w-20 h-12 object-cover rounded-xl shadow-sm flex-shrink-0' src={course.courseThumbnail} alt="" />
                <div className='min-w-0'>
                  <h2 className='text-sm font-semibold text-surface-900 truncate'>{course.courseTitle}</h2>
                  <p className='text-xs text-surface-400 mt-0.5'>{new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className='flex items-center gap-6 text-sm'>
                <div className="text-center">
                  <span className="font-semibold text-surface-900 block">{currency}{course.coursePrice}</span>
                  <span className="text-xs text-surface-400">Price</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-surface-900 block">{course.enrolledStudents.length}</span>
                  <span className="text-xs text-surface-400">Students</span>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2'>
                <button 
                  onClick={() => navigate('/educator/edit-course/' + course._id)}
                  className='btn-secondary !text-xs !px-3 !py-1.5'
                >
                  Edit
                </button>
                
                <button 
                  onClick={() => navigate('/educator/quiz/' + course._id)}
                  className='btn-ghost !text-xs !px-3 !py-1.5 !text-blue-600 hover:!bg-blue-50'
                >
                  Quiz
                </button>

                <button 
                  onClick={() => navigate('/educator/mindmap/' + course._id)}
                  className='btn-ghost !text-xs !px-3 !py-1.5 !text-violet-600 hover:!bg-violet-50'
                >
                  Mind Maps
                </button>
                
                <button 
                  onClick={() => navigate('/educator/groups/' + course._id)}
                  className='btn-ghost !text-xs !px-3 !py-1.5 !text-brand-600 hover:!bg-brand-50'
                >
                  Teams
                </button>

                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(course._id)}
                  className='p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all'
                  title="Delete Course"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="text-center py-20 premium-card">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-surface-700">No courses yet</h3>
              <p className="text-surface-500 text-sm mt-1 mb-4">Create your first course to get started.</p>
              <button onClick={() => navigate('/educator/add-course')} className="btn-primary">Create Course</button>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="p-8 flex items-center gap-3 text-surface-400">
      <div className="w-5 h-5 rounded-full border-2 border-surface-200 border-t-brand-600 animate-spin"></div>
      Loading courses...
    </div>
  )
}

export default MyCourses