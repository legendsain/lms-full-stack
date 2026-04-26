import React from 'react'
import { useNavigate } from 'react-router-dom'

const CallToAction = () => {
  const navigate = useNavigate()

  return (
    <section className="w-full px-6 md:px-0 py-20">
      <div className="relative max-w-5xl mx-auto bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute inset-0 bg-subtle-grid bg-grid opacity-30"></div>
        
        <div className="relative z-10">
          <h2 className='text-2xl md:text-4xl text-white font-extrabold tracking-tight'>
            Learn anything, anytime, anywhere
          </h2>
          <p className='text-white/70 text-sm md:text-base max-w-xl mx-auto mt-4 leading-relaxed'>
            Unlock your potential with EduNova. Whether you're mastering a new skill, 
            advancing your career, or exploring a passion, our expert-led courses give you the tools to succeed.
          </p>
          <div className='flex items-center justify-center gap-4 mt-8'>
            <button 
              onClick={() => navigate('/course-list')}
              className='px-8 py-3 rounded-xl text-brand-700 bg-white font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-lg'
            >
              Get started free
            </button>
            <button 
              onClick={() => navigate('/course-list')}
              className='px-8 py-3 rounded-xl text-white font-semibold text-sm border border-white/30 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 flex items-center gap-2'
            >
              Browse courses
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction