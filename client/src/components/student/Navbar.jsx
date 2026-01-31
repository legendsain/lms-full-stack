import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {

  const location = useLocation();
  const isCoursesListPage = location.pathname.includes('/course-list');

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
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCoursesListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      <img onClick={() => navigate('/')} src={assets.logo} alt="Logo" className="w-28 lg:w-32 cursor-pointer" />
      
      {/* --- DESKTOP VIEW --- */}
      <div className="md:flex hidden items-center gap-5 text-gray-500">
        <div className="flex items-center gap-5">
          {
            user && <>
              <button onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
              | <Link to='/my-enrollments' >My Enrollments</Link>
              
              {/* NEW: Leaderboard Link */}
              | <Link to='/leaderboard' className="hover:text-blue-600 transition">Leaderboard</Link>

              {/* NEW: Career Button */}
              <button 
                  onClick={() => navigate('/career-dashboard')} 
                  className="ml-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:scale-105 transition shadow-md"
              >
                  CareerLink 🚀
              </button>
            </>
          }
        </div>

        {/* NEW: Token Wallet Badge */}
        {user && userData && (
           <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200 shadow-sm cursor-default select-none" title="Your Learning Tokens">
              <span className="text-lg">🪙</span> 
              <span className="font-bold text-yellow-800 text-sm">
                 {/* Display tokens (default to 0 if undefined) */}
                 {userData.gamification ? userData.gamification.tokens : 0}
              </span>
           </div>
        )}

        {user
          ? <UserButton />
          : <button onClick={() => openSignIn()} className="bg-blue-600 text-white px-5 py-2 rounded-full">
            Create Account
          </button>}
      </div>

      {/* --- PHONE VIEW --- */}
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {/* Show Tokens on Mobile too if space permits, simplified */}
          {user && userData && (
            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200">
               <span className="text-xs">🪙</span> 
               <span className="font-bold text-yellow-800 text-xs">{userData.gamification ? userData.gamification.tokens : 0}</span>
            </div>
          )}

          <button onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
          | {
            user && (
              <>
                 <Link to='/my-enrollments' >My Enrollments</Link>
                 {/* Mobile Leaderboard Link */}
                 | <Link to='/leaderboard'>Leaderboard</Link>
                 | <button onClick={() => navigate('/career-dashboard')} className="text-indigo-600 font-bold">Career</button>
              </>
            )
          }
        </div>
        {user
          ? <UserButton />
          : <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt="" />
          </button>}
      </div>
    </div>
  );
};

export default Navbar;