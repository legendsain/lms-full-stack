import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const SideBar = () => {

  const { isEducator } = useContext(AppContext)

  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];

  return isEducator && (
    <aside className='md:w-64 w-16 border-r border-surface-200 min-h-screen bg-surface-50/50 py-4 flex flex-col gap-1'>
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          end={item.path === '/educator'} 
          className={({ isActive }) =>
            `flex items-center md:flex-row flex-col md:justify-start justify-center py-3 md:px-6 gap-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
              ? 'bg-brand-50 text-brand-700 shadow-sm'
              : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
            }`
          }
        >
          <img src={item.icon} alt="" className="w-5 h-5 opacity-70" />
          <span className='md:block hidden'>{item.name}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default SideBar;