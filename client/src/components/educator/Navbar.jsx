import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { UserButton, useUser } from '@clerk/clerk-react';

const Navbar = ({ bgColor }) => {

  const { isEducator } = useContext(AppContext)
  const { user } = useUser()

  return isEducator && user && (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-8 border-b border-surface-200 py-3 bg-white/90 backdrop-blur-xl">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <img src={assets.logo} alt="EduNova" className="w-28 lg:w-32" />
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <span className="text-surface-600 font-medium">{user.fullName}</span>
        </div>
        <div className="h-6 w-px bg-surface-200 hidden sm:block"></div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  );
};

export default Navbar;