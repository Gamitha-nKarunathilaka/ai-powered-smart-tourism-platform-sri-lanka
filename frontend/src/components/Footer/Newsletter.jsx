import React from 'react';
import mistyImg from '../../assets/misty-mountains.png'; 

const Newsletter = () => {
  return (
    <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden mb-1 border border-white/5 shadow-2xl">
      
      {/* Background Section */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        
        <img 
          src={mistyImg} 
          alt="Misty Mountains Sri Lanka" 
          className="w-full h-full object-cover opacity-50 mix-blend-screen" 
        />

        {/* යාවත්කාලීන කළ Gradient එක */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
        
        {/* වම් පස අකුරු වලට පිටිපස්සෙන් තවත් කුඩා glow එකක් */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-slate-900/40 backdrop-blur-[2px]" />
      </div>

      {/* Content Section */}
      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-md">
          <h2 className="text-3xl font-serif text-white mb-2 drop-shadow-lg">Stay Inspired</h2>
          <p className="text-gray-300 text-sm drop-shadow-md">
            Subscribe to our newsletter for travel tips, special offers, and inspiration from Sri Lanka.
          </p>
        </div>
        
        {/* Glassmorphism Input Box */}
        <div className="flex w-full md:w-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="bg-transparent px-6 py-3 text-white text-sm outline-none flex-grow md:w-64 placeholder-gray-400"
          />
          <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs px-8 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;