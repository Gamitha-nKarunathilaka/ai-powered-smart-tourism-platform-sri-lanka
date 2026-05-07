import React from 'react';
import hologramImg from "../../assets/map.png";

const HolographicMap = () => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <img 
        src={hologramImg} 
        alt="Sri Lanka Hologram Map"
        className="w-full max-w-[500px] lg:max-w-[700px] object-contain drop-shadow-[0_0_25px_rgba(0,229,255,0.15)]"
      />
    </div>
  );
};

export default HolographicMap;