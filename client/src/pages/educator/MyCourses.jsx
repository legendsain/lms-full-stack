import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
//import { navigate } from 'react-router-dom' // Ensure this matches your router version or use useContext
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets' // Ensure you have a trash/cross icon or use text

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
    <div className='h-screen flex-1 px-8 md:pt-8 pt-4 pb-20 overflow-scroll border-l border-gray-500'>
      <h1 className='text-lg font-medium mb-6'>My Courses</h1>
      <div className='flex flex-col gap-6 mb-16'>
        {courses.map((course) => (
          <div key={course._id} className='flex flex-wrap items-center justify-between border-b border-gray-200 pb-4'>
            <div className='flex items-center gap-4 w-full md:w-auto'>
              <img className='w-20 h-12 object-cover rounded' src={course.courseThumbnail} alt="" />
              <div className='flex flex-col'>
                <h2 className='text-base font-medium text-gray-800 truncate max-w-xs'>{course.courseTitle}</h2>
                <p className='text-xs text-gray-500'>{new Date(course.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className='flex items-center gap-8 text-sm text-gray-500 mt-4 md:mt-0'>
                <div className="flex flex-col items-center">
                    <span className="font-medium text-gray-800">{currency}{course.coursePrice}</span>
                    <span className="text-xs">Price</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="font-medium text-gray-800">{course.enrolledStudents.length}</span>
                    <span className="text-xs">Students</span>
                </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-3 mt-4 md:mt-0'>
                <button 
                    onClick={() => navigate('/educator/edit-course/' + course._id)}
                    className='px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50'
                >
                    Edit
                </button>
                
                <button 
                    onClick={() => navigate('/educator/quiz/' + course._id)}
                    className='px-3 py-1.5 border border-purple-300 text-purple-600 rounded text-sm hover:bg-purple-50'
                >
                    Quiz
                </button>

                <button 
                    onClick={() => navigate('/educator/groups/' + course._id)}
                    className='px-3 py-1.5 border border-indigo-300 text-indigo-600 rounded text-sm hover:bg-indigo-50'
                >
                    Teams
                </button>

                {/* --- DELETE BUTTON --- */}
                <button 
                    onClick={() => handleDelete(course._id)}
                    className='p-2 text-gray-400 hover:text-red-500 transition'
                    title="Delete Course"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : <div className="p-8 text-gray-500">Loading courses...</div>
}

export default MyCourses