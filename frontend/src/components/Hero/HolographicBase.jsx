import React from 'react';

const HolographicBase = () => {
  return (
    <div className="relative flex justify-center items-center mt-[-40px]">
      {/* Main Circular Platform */}
      <div className="relative w-[300px] h-[60px] md:w-[500px] md:h-[100px] rounded-[100%] 
                      bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t-2 border-cyan-500/40 
                      shadow-[0_-20px_40px_rgba(34,211,238,0.2)] flex justify-center">
        
        {/* Inner Glowing Ring */}
        <div className="absolute top-2 w-[90%] h-[80%] rounded-[100%] border border-cyan-400/20 
                        shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]" />
        
        {/* Central Core Light */}
        <div className="absolute top-4 w-[60%] h-[50%] rounded-[100%] bg-cyan-500/20 blur-xl animate-pulse" />
        
        {/* Tech Details/Segments */}
        <div className="absolute bottom-2 flex space-x-8 opacity-40">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1 h-4 bg-cyan-400/50 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Ambient Floor Glow */}
      <div className="absolute top-10 w-[600px] h-[150px] bg-cyan-500/5 blur-[80px] -z-10 rounded-full" />
    </div>
  );
};

export default HolographicBase;