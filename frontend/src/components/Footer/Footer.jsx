import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
   
    <footer className="relative bg-slate-900 text-white pt-20 pb-10 px-8 lg:px-16  shadow-[0_-15px_40px_rgba(0,0,0,0.5)]">
      
    
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-16 relative z-10">
        
        {/* Brand Section */}
        <div className="lg:w-2/5 space-y-6">
          <div className="flex items-center space-x-2">
             <div className="text-xs font-bold tracking-tighter">
                SRI LANKA <br /> <span className="text-cyan-400">WONDER OF ASIA</span>
             </div>
          </div>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            Sri Lanka, a land like no other. Discover its beauty, culture, and warm hospitality.
          </p>
          <div className="flex space-x-6 text-xs font-bold text-gray-500 pt-2">
            <a href="#" className="hover:text-cyan-400 transition-colors">FACEBOOK</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">INSTAGRAM</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">YOUTUBE</a>
          </div>
        </div>

        {/* Links Column */}
        <div className="lg:w-1/4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Explore</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            {['Destinations', 'Experiences', 'Blog', 'Travel Info'].map((item) => (
              <li key={item} className="hover:text-white transition-colors cursor-pointer w-fit">{item}</li>
            ))}
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="lg:w-1/4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="flex items-center gap-3">
              <span className="text-base opacity-70">📧</span> info@srilanka.travel
            </li>
            <li className="flex items-center gap-3">
              <span className="text-base opacity-70">📞</span> +94 11 234 5678
            </li>
            <li className="flex items-center gap-3">
              <span className="text-base opacity-70">📍</span> Colombo, Sri Lanka
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest relative z-10">
        <p>© {currentYear} Sri Lanka Travel. All rights reserved.</p>
        <p>Designed for Explorers</p>
      </div>
      
    </footer>
  );
};

export default Footer;