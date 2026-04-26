import React, { useContext, useEffect, useState } from 'react'
import Footer from '../../components/student/Footer'
import { assets } from '../../assets/assets'
import CourseCard from '../../components/student/CourseCard';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import SearchBar from '../../components/student/SearchBar';

const CoursesList = () => {

    const { input } = useParams()

    const { allCourses, navigate } = useContext(AppContext)

    const [filteredCourse, setFilteredCourse] = useState([])

    useEffect(() => {

        if (allCourses && allCourses.length > 0) {

            const tempCourses = allCourses.slice()

            input
                ? setFilteredCourse(
                    tempCourses.filter(
                        item => item.courseTitle.toLowerCase().includes(input.toLowerCase())
                    )
                )
                : setFilteredCourse(tempCourses)

        }

    }, [allCourses, input])

    return (
        <>
            <div className="section-container pt-12 pb-8 text-left animate-fade-in">
                <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
                    <div>
                        <h1 className='text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight'>
                          Explore Courses
                        </h1>
                        <div className="flex items-center gap-1.5 mt-2 text-sm">
                          <span onClick={() => navigate('/')} className='text-brand-600 cursor-pointer hover:underline font-medium'>Home</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                          <span className='text-surface-500'>Courses</span>
                        </div>
                    </div>
                    <SearchBar data={input} />
                </div>

                {input && (
                  <div className='inline-flex items-center gap-3 px-4 py-2 bg-brand-50 border border-brand-200/60 rounded-xl mt-8 -mb-4'>
                    <span className="text-sm font-medium text-brand-700">"{input}"</span>
                    <button 
                      onClick={() => navigate('/course-list')} 
                      className='text-brand-500 hover:text-brand-700 transition-colors'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-12 gap-6">
                    {filteredCourse.map((course, index) => <CourseCard key={index} course={course} />)}
                </div>

                {filteredCourse.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold text-surface-700">No courses found</h3>
                    <p className="text-surface-500 text-sm mt-1">Try adjusting your search to find what you're looking for.</p>
                  </div>
                )}
            </div>
            <Footer />
        </>
    )
}

export default CoursesList 