import React from 'react'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-surface-950 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-b border-white/10">
          
          {/* Brand */}
          <div className="space-y-5">
            <img src={assets.logo_dark} alt="EduNova" className="h-8" />
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              EduNova is a comprehensive learning management system designed to empower educators and students alike.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <img src={assets.facebook_icon} alt="Facebook" className="w-4 h-4 opacity-60" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <img src={assets.twitter_icon} alt="Twitter" className="w-4 h-4 opacity-60" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <img src={assets.instagram_icon} alt="Instagram" className="w-4 h-4 opacity-60" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-5 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {['Home', 'About us', 'Contact us', 'Privacy policy'].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-5 uppercase tracking-wider">Stay updated</h3>
            <p className="text-sm text-white/50 mb-4">The latest news, articles, and resources, sent to your inbox weekly.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" 
              />
              <button className="btn-primary !bg-brand-500 hover:!bg-brand-400 !rounded-xl !px-5 flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} EduNova. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer