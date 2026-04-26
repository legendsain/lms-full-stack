import React from 'react';
import { assets } from '../../assets/assets';
import SearchBar from '../../components/student/SearchBar';

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-hero-pattern"></div>
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      
      <div className="relative flex flex-col items-center justify-center w-full md:pt-32 pt-20 pb-20 px-6 md:px-0 space-y-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 border border-brand-200/60 rounded-full text-brand-700 text-sm font-medium animate-fade-in">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-soft"></span>
          Trusted by 10,000+ learners worldwide
        </div>

        <h1 className="md:text-home-heading-large text-home-heading-small font-extrabold text-surface-900 max-w-3xl mx-auto tracking-tight leading-tight animate-fade-in-up">
          Empower your future with courses designed to
          <span className="text-gradient"> fit your choice.</span>
        </h1>
        
        <p className="hidden md:block text-surface-500 max-w-2xl mx-auto text-lg leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
        </p>
        <p className="md:hidden text-surface-500 max-w-sm mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          World-class instructors to help you achieve your professional goals.
        </p>
        
        <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <SearchBar />
        </div>

        {/* Trust indicators */}
        <div className="flex items-center gap-3 text-sm text-surface-400 animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="flex -space-x-2">
            <img src={assets.profile_img_1} alt="" className="w-7 h-7 rounded-full border-2 border-white" />
            <img src={assets.profile_img_2} alt="" className="w-7 h-7 rounded-full border-2 border-white" />
            <img src={assets.profile_img_3} alt="" className="w-7 h-7 rounded-full border-2 border-white" />
          </div>
          <span>Join thousands of successful learners</span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
