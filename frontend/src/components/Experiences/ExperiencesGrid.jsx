import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // 1. Navigate වෙන්න මේක එකතු කරන්න

const ExperienceCard = ({ experience }) => {
  const navigate = useNavigate();

  // Card එක Click කළාම අදාළ slug එකට navigate වෙන්න (උදා: /articles/sigiriya-lion-rock)
  const handleClick = () => {
    navigate(`/blog/${experience.slug}`); 
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      onClick={handleClick} // 2. Click event එක මෙතැනට දෙනවා
      className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer h-[400px]"
    >
      {/* 3. Image එක */}
      <img 
        src={experience.hero_image} 
        alt={experience.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent" />
      
      {/* 4. Category එක සහ Title එක පමණක් පෙන්වීම (Learn More button එක ඉවත් කර ඇත) */}
      <div className="absolute bottom-0 p-6 w-full">
        <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-2 block">
          {experience.category}
        </span>
        <h3 className="text-lg font-semibold text-white mb-2">{experience.title}</h3>
      </div>
      
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500/50 rounded-2xl transition-all duration-300" />
    </motion.div>
  );
};

const ExperiencesGrid = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/articles')
      .then((res) => res.json())
      .then((data) => {
        setExperiences(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching experiences:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div id="experiences" className="bg-slate-900 py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-cyan-400 text-sm font-bold tracking-widest uppercase mb-2">Featured Experiences</h2>
        <h1 className="text-4xl text-white font-serif mb-12">Things to Do in Sri Lanka</h1>
        
        {loading ? (
          <p className="text-white">Loading experiences...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {experiences.map((exp) => (
              <ExperienceCard key={exp._id || exp.id} experience={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperiencesGrid;