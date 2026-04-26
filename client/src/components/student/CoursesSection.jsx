import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import CourseCard from './CourseCard';
import { Link } from 'react-router-dom';

const CoursesSection = () => {

  const { allCourses } = useContext(AppContext)

  return (
    <section className="section-container py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="badge-primary mb-3 inline-flex">Popular Courses</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight">
          Learn from the best
        </h2>
        <p className="text-surface-500 mt-4 text-base leading-relaxed">
          Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allCourses.slice(0, 4).map((course, index) => (
          <div key={index} className="animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
            <CourseCard course={course} />
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link 
          to={'/course-list'} 
          onClick={() => scrollTo(0, 0)} 
          className="btn-secondary"
        >
          Show all courses
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
};

export default CoursesSection;
