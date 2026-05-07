import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import beachImg from '../../assets/beach-sunset.png';
import trainImg from '../../assets/nine-arches.png';
import leopardImg from '../../assets/leopard.png';
import bgImage from '../../assets/map.png';

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-8 px-6 lg:px-12 min-h-screen flex flex-col justify-between overflow-hidden bg-slate-900">
      
      {/* --- NEW: Starry / Dot Pattern Background --- */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* --- Animated Misty Background Effects --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Static Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

        {/* Animated Mist Layer 1 */}
        <motion.div 
          className="absolute top-[20%] -left-[20%] w-[140%] h-[400px] bg-white/[0.02] blur-[100px] rounded-[100%] rotate-12"
          animate={{ x: ["-5%", "5%", "-5%"], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated Mist Layer 2 */}
        <motion.div 
          className="absolute bottom-[20%] -right-[20%] w-[150%] h-[500px] bg-cyan-300/[0.03] blur-[120px] rounded-[100%] -rotate-12"
          animate={{ x: ["5%", "-5%", "5%"], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle Cosmic Dust */}
        <motion.div 
          className="absolute top-1/2 left-1/4 w-[80%] h-[300px] bg-blue-400/[0.02] blur-[80px] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* --- Main 3-Column Layout --- */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-[1600px] mx-auto mt-4">
        
        {/* --- LEFT COLUMN: Features --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="mb-8">
            <span className="text-cyan-400 text-[9px] font-black tracking-[0.2em] uppercase block mb-3">
              Discover the Pearl of the Indian Ocean
            </span>
            <h1 className="text-5xl lg:text-6xl font-serif text-white leading-tight mb-4 drop-shadow-md">
              Explore <br />
              <span className="text-cyan-400 font-light">Sri Lanka</span>
            </h1>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[250px]">
              A land of timeless beauty, rich heritage, and unforgettable experiences.
            </p>
          </div>

          <Link to="/plan-trip" className="flex items-center justify-between w-full max-w-[250px] border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-white text-[11px] font-bold px-6 py-3 rounded-full transition-all">
            Plan Your Trip with AI <span>→</span>
          </Link>

          <div className="space-y-3 pt-4 max-w-[280px]">
            {[
              { title: "Pristine Beaches", desc: "Relax on golden sands.", icon: "🏝️" },
              { title: "Lush Tea Gardens", desc: "Wander through plantations.", icon: "🍃" },
              { title: "Rich Cultural Heritage", desc: "Discover ancient temples.", icon: "🏛️" },
              { title: "Thriving Wildlife", desc: "Explore diverse habitats.", icon: "🐘" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-colors cursor-pointer group backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(0,229,255,0.1)] group-hover:bg-cyan-500/20">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-white text-[11px] font-bold">{feature.title}</h4>
                  <p className="text-gray-400 text-[9px] mt-0.5">{feature.desc}</p>
                </div>
                <span className="text-gray-500 text-xs group-hover:text-cyan-400">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CENTER COLUMN: Holographic Map --- */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center h-[500px] lg:h-[650px]">
          

          <motion.img 
            src={bgImage} 
            alt="Sri Lanka Map"
            scale-125
            className="w-full h-full object-contain mix-blend-lighten"
            style={{ mixBlendMode: 'lighten' }} 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <button className="absolute bottom-4 flex items-center gap-2 border border-white/20 bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-bold px-6 py-2.5 rounded-full hover:bg-white/10 transition-all shadow-lg z-10">
            <span>🗺️</span> Explore Sri Lanka
          </button>
        </div>

        {/* --- RIGHT COLUMN: Travel Blog --- */}
        <div className="lg:col-span-3 space-y-4 self-start mt-8 lg:mt-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Travel Blog</h3>
            <span className="text-[9px] text-gray-400 font-bold uppercase cursor-pointer hover:text-white flex items-center gap-1">View All <span>→</span></span>
          </div>
          
          {[
            { title: "10 Best Beaches in Sri Lanka", cat: "BEACHES", date: "May 15, 2026 • 5 min read", img: beachImg },
            { title: "A Journey Through Tea Country", cat: "NATURE", date: "May 10, 2026 • 6 min read", img: trainImg },
            { title: "Top Wildlife Experiences", cat: "WILDLIFE", date: "May 5, 2026 • 7 min read", img: leopardImg }
          ].map((blog, i) => (
            <div key={i} className="group relative h-[100px] rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg bg-white/[0.02]">
              <img src={blog.img} className="absolute right-0 top-0 w-2/5 h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={blog.title} />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent" />
              
              <div className="absolute inset-0 p-4 flex flex-col justify-center">
                <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 w-fit px-2 py-0.5 rounded-md mb-1.5">{blog.cat}</span>
                <p className="text-[11px] text-white font-bold leading-tight max-w-[60%]">{blog.title}</p>
                <p className="text-[8px] text-gray-400 mt-2">{blog.date}</p>
              </div>
              <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[8px] text-white bg-slate-800/80 backdrop-blur-sm">
                →
              </div>
            </div>
          ))}

          {/* Featured Video Box */}
          <div className="relative h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center p-2 overflow-hidden group cursor-pointer mt-6 backdrop-blur-sm">
             <img src={beachImg} className="w-24 h-full object-cover rounded-xl" alt="Video thumbnail" />
             <div className="absolute left-10 w-8 h-8 rounded-full bg-slate-900/80 border border-white/30 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-all">
               <span className="text-[10px] ml-0.5">▶️</span>
             </div>
             <div className="ml-4 flex-1">
               <p className="text-[11px] text-white font-bold leading-tight">The Beauty of Sri Lanka</p>
               <p className="text-[8px] text-gray-400 mt-1">Watch Full Video</p>
             </div>
          </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: Statistics Bar --- */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto mt-12 bg-white/[0.02] backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4">
        {[
          { icon: "🏛️", count: "8", label: "UNESCO Sites" },
          { icon: "🌳", count: "26", label: "National Parks" },
          { icon: "🌊", count: "1,340 km", label: "Coastline" },
          { icon: "👑", count: "2,500+", label: "Years of History" },
          { icon: "☀️", count: "Warm", label: "Tropical Climate" }
        ].map((stat, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4 py-2 flex-1 justify-center lg:justify-start lg:border-r border-white/5 last:border-0">
            <span className="text-xl opacity-80 grayscale">{stat.icon}</span>
            <div>
              <p className="text-white text-sm font-bold leading-none">{stat.count}</p>
              <p className="text-gray-400 text-[9px] uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default HeroSection;