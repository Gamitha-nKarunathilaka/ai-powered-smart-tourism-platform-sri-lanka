import React from 'react';
import { motion } from 'framer-motion';

import beachSunset from '../../assets/beach-sunset.png';
import leopard from '../../assets/leopard.png';
import nineArches from '../../assets/nine-arches.png';
import turtle from '../../assets/turtle.png';
import sigiriya from '../../assets/sigiriya.png';

const experiences = [
  { id: 1, title: 'Surfing in Arugam Bay', image: beachSunset, category: 'Beaches' },
  { id: 2, title: 'Yala Safari Adventure', image: leopard, category: 'Wildlife' },
  { id: 3, title: 'Scenic Train Journey', image: nineArches, category: 'Nature' },
  { id: 4, title: 'Whale Watching', image: turtle, category: 'Marine' },
  { id: 5, title: 'Sigiriya Lion Rock', image: sigiriya, category: 'Heritage' },
];

const ExperienceCard = ({ experience }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer h-[400px]"
  >
    <img 
      src={experience.image} 
      alt={experience.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent" />
    
    <div className="absolute bottom-0 p-6 w-full">
      <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-2 block">
        {experience.category}
      </span>
      <h3 className="text-lg font-semibold text-white mb-4">{experience.title}</h3>
      <button className="text-xs text-cyan-400 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        Learn More <span className="ml-2">→</span>
      </button>
    </div>
    
    {/* Glowing Border Hover Effect */}
    <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500/50 rounded-2xl transition-all duration-300" />
  </motion.div>
);

const ExperiencesGrid = () => {
  return (
    <div id="experiences" className="bg-slate-900 py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-cyan-400 text-sm font-bold tracking-widest uppercase mb-2">Featured Experiences</h2>
        <h1 className="text-4xl text-white font-serif mb-12">Things to Do in Sri Lanka</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperiencesGrid;