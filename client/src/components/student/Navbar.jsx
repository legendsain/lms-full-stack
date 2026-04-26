import React, { useContext, useState } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {

  const location = useLocation();
  const isCoursesListPage = location.pathname.includes('/course-list');
  const [mobileOpen, setMobileOpen] = useState(false);

  // 1. Get userData to access tokens
  const { backendUrl, isEducator, setIsEducator, navigate, getToken, userData } = useContext(AppContext)

  const { openSignIn } = useClerk()
  const { user } = useUser()

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate('/educator')
        return;
      }
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/update-role', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        toast.success(data.message)
        setIsEducator(true)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
      isCoursesListPage 
        ? 'bg-white/90 border-surface-200' 
        : 'bg-white/80 border-surface-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <img 
            onClick={() => navigate('/')} 
            src={assets.logo} 
            alt="EduNova Logo" 
            className="w-28 lg:w-32 cursor-pointer hover:opacity-80 transition-opacity" 
          />
          
          {/* --- DESKTOP NAV --- */}
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={becomeEducator}
                  className="btn-ghost text-sm"
                >
                  {isEducator ? 'Educator Dashboard' : 'Become Educator'}
                </button>
                
                <Link to='/my-enrollments' className="btn-ghost text-sm">
                  My Enrollments
                </Link>
                
                <Link to='/leaderboard' className="btn-ghost text-sm">
                  Leaderboard
                </Link>

                <button 
                  onClick={() => navigate('/career-dashboard')} 
                  className="btn-accent text-sm !py-2 !px-4 !rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 0 1-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                  </svg>
                  CareerLink
                </button>
              </div>
            )}

            {/* Token Wallet Badge */}
            {user && userData && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60 ml-2 cursor-default select-none" title="Your Learning Tokens">
                <span className="text-base">🪙</span> 
                <span className="font-bold text-amber-700 text-sm tabular-nums">
                  {userData.gamification ? userData.gamification.tokens : 0}
                </span>
              </div>
            )}

            {user
              ? <div className="ml-2"><UserButton afterSignOutUrl="/" /></div>
              : <button onClick={() => openSignIn()} className="btn-primary ml-2">
                Get Started
              </button>}
          </div>

          {/* --- MOBILE NAV --- */}
          <div className='md:hidden flex items-center gap-3'>
            {/* Token badge mobile */}
            {user && userData && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-200/60">
                <span className="text-xs">🪙</span> 
                <span className="font-bold text-amber-700 text-xs tabular-nums">{userData.gamification ? userData.gamification.tokens : 0}</span>
              </div>
            )}

            {/* Hamburger / User */}
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMobileOpen(!mobileOpen)} 
                  className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    {mobileOpen 
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    }
                  </svg>
                </button>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <button onClick={() => openSignIn()} className="btn-primary !text-xs !px-4 !py-2">
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileOpen && user && (
          <div className="md:hidden border-t border-surface-100 py-3 animate-fade-in-down">
            <div className="flex flex-col gap-1">
              <button onClick={() => { becomeEducator(); setMobileOpen(false); }} className="btn-ghost text-sm justify-start">
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>
              <Link to='/my-enrollments' onClick={() => setMobileOpen(false)} className="btn-ghost text-sm justify-start">
                My Enrollments
              </Link>
              <Link to='/leaderboard' onClick={() => setMobileOpen(false)} className="btn-ghost text-sm justify-start">
                Leaderboard
              </Link>
              <button onClick={() => { navigate('/career-dashboard'); setMobileOpen(false); }} className="btn-ghost text-sm justify-start text-brand-600">
                🚀 CareerLink
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;