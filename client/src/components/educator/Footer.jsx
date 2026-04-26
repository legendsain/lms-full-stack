import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className="flex md:flex-row flex-col-reverse items-center justify-between text-left w-full px-8 border-t border-surface-200 bg-white">
      <div className='flex items-center gap-4'>
        <img className='hidden md:block w-20 opacity-60' src={assets.logo} alt="logo" />
        <div className='hidden md:block h-5 w-px bg-surface-200'></div>
        <p className='py-4 text-center text-xs text-surface-400'>
          © {new Date().getFullYear()} EduNova. All rights reserved.
        </p>
      </div>
      <div className='flex items-center gap-3 max-md:mt-4'>
        <a href="#" className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
          <img src={assets.facebook_icon} alt="" className="w-3.5 h-3.5 opacity-50" />
        </a>
        <a href="#" className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
          <img src={assets.twitter_icon} alt="" className="w-3.5 h-3.5 opacity-50" />
        </a>
        <a href="#" className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
          <img src={assets.instagram_icon} alt="" className="w-3.5 h-3.5 opacity-50" />
        </a>
      </div>
    </footer>
  )
}

export default Footer