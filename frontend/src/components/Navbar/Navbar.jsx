import React from 'react';
import { Search, Globe, Send } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link'; // Section වලට scroll වෙන්න මෙය අවශ්‍යයි

const Navbar = () => {
  // සාමාන්‍ය Link එකක style එක
  const defaultStyle = "hover:text-cyan-400 transition-colors";
  // දැනට ඉන්න පිටුව (Active) නම් පෙන්විය යුතු style එක
  const activeStyle = "text-cyan-400";

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/5 px-8 py-4 flex justify-between items-center">
      
      {/* --- Logo Section --- */}
      <div className="flex items-center space-x-2 cursor-pointer">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xs">SL</span>
        </div>
        <span className="text-white font-bold text-xs tracking-tighter uppercase">
          Sri Lanka <br/> <span className="text-cyan-400 text-[8px]">Wonder of Asia</span>
        </span>
      </div>
      
      {/* --- Nav Links Section --- */}
      <div className="hidden lg:flex space-x-8 text-[11px] uppercase tracking-widest text-gray-400 font-bold">
        
        {/* 1. Home - ප්‍රධාන පිටුවට යයි */}
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}
          end
        >
          Home
        </NavLink>

        {/* 2. Destinations - Home පිටුවේ "destinations" කොටසට scroll වෙයි */}
        <NavHashLink smooth to="/#experiences" className={defaultStyle}>
          Destinations
        </NavHashLink>

        {/* 3. Experiences - Home පිටුවේ "experiences" කොටසට scroll වෙයි */}
        <NavHashLink smooth to="/#experiences" className={defaultStyle}>
          Experiences
        </NavHashLink>

        {/* 4. අනිත් පිටු (මේවාට අනාගතයේදී වෙනම පිටු හැදුවොත් වැඩ කරයි) */}
        <NavLink to="/blog" className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}>
          Blog
        </NavLink>
        
        <NavLink to="/travel-info" className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}>
          Travel Info
        </NavLink>
        
        <NavLink to="/about" className={({ isActive }) => isActive ? `${defaultStyle} ${activeStyle}` : defaultStyle}>
          About Us
        </NavLink>

      </div>

      {/* --- Right Icons & Button Section --- */}
      <div className="flex items-center space-x-6 text-white">
        <Search size={18} className="cursor-pointer hover:text-cyan-400 transition-colors" />
        <Globe size={18} className="cursor-pointer hover:text-cyan-400 transition-colors" />
        
        {/* Plan Your Trip Button - මෙය අලුත් AI Recommender පිටුවට යයි */}
        <Link 
          to="/plan-trip" 
          className="bg-cyan-500/10 border border-cyan-500/50 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center hover:bg-cyan-500 hover:text-black transition-all w-fit"
        >
          Plan Your Trip <Send size={12} className="ml-2" />
        </Link>
      </div>
      
    </nav>
  );
};

export default Navbar;