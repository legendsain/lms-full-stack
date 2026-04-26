import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const CourseCard = ({ course }) => {

    const { currency, calculateRating } = useContext(AppContext)

    const discountedPrice = (course.coursePrice - course.discount * course.coursePrice / 100).toFixed(2);
    const rating = calculateRating(course);

    return (
        <Link 
            onClick={() => scrollTo(0, 0)} 
            to={'/course/' + course._id} 
            className="group premium-card overflow-hidden hover-lift"
        >
            {/* Thumbnail with overlay */}
            <div className="relative overflow-hidden">
                <img 
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                    src={course.courseThumbnail} 
                    alt={course.courseTitle} 
                />
                {course.discount > 0 && (
                    <div className="absolute top-3 left-3 badge-danger">
                        -{course.discount}% OFF
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 text-left space-y-2.5">
                <h3 className="text-sm font-semibold text-surface-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                    {course.courseTitle}
                </h3>
                
                <p className="text-xs text-surface-500 font-medium">
                    {course.educator.name}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-600">{rating}</span>
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-400' : 'text-surface-200'}`} viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-xs text-surface-400">({course.courseRatings.length})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-bold text-surface-900">{currency}{discountedPrice}</span>
                    {course.discount > 0 && (
                        <span className="text-sm text-surface-400 line-through">{currency}{course.coursePrice}</span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default CourseCard