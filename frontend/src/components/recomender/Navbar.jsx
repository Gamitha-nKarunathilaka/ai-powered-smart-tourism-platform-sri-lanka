import React from 'react';
import { Search, Globe, Send } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
// NavHashLink වෙනුවට HashLink යොදාගන්න
import { HashLink } from 'react-router-hash-link';

export default function Navbar() {
  
  const defaultStyle = "hover:text-cyan-400 transition-colors cursor-pointer";
  const activeStyle = "text-cyan-400";

  return (
    <nav className="h-[74px] flex items-center justify-between px-5 lg:px-8 bg-[#07162d] border-b border-white/10">
      
      {/* Logo Section */}
      <Link to="/" className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-cyan-400 text-[#051225] flex items-center justify-center font-bold">
          SL
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-white">SRI LANKA</h1>
          <p className="text-[9px] text-cyan-300 font-bold">WONDER OF ASIA</p>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center gap-10 text-xs font-bold tracking-[2px] text-white/70">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}
          end
        >
          HOME
        </NavLink>

        {/* NavHashLink වෙනුවට HashLink භාවිතා කර ඇත */}
        <HashLink smooth to="/#destinations" className={defaultStyle}>
          DESTINATIONS
        </HashLink>

        <HashLink smooth to="/#experiences" className={defaultStyle}>
          EXPERIENCES
        </HashLink>

        <NavLink 
          to="/blog" 
          className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}
        >
          BLOG
        </NavLink>
        
        <NavLink 
          to="/travel-info" 
          className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}
        >
          TRAVEL INFO
        </NavLink>
        
        <NavLink 
          to="/about" 
          className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}
        >
          ABOUT US
        </NavLink>
      </div>

      {/* Action Buttons & Icons */}
      <div className="flex items-center gap-5 text-white/80">
        <Search size={20} className="hidden sm:block cursor-pointer hover:text-cyan-400 transition-colors" />
        <Globe size={20} className="hidden sm:block cursor-pointer hover:text-cyan-400 transition-colors" />
        
        <Link
          to="/plan-trip"
          className="hidden md:flex items-center gap-2 rounded-full border border-cyan-400/50 px-6 py-3 text-xs tracking-widest font-bold text-white hover:bg-cyan-400 hover:text-[#051225] transition-all"
        >
          PLAN YOUR TRIP <Send size={14} className="ml-1" />
        </Link>
      </div>
    </nav>
  );
}