
import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Emma Johnson",
    country: "Australia",
    rating: 5,
    text: "Sri Lanka is simply breathtaking! From the lush tea gardens to the beautiful beaches, every moment was unforgettable.",
    img: "/path-to-avatar-1.jpg"
  },
  {
    name: "Liam Carter",
    country: "UK",
    rating: 5,
    text: "The people, the culture, the food – everything about Sri Lanka is amazing. Can't wait to come back!",
    img: "/path-to-avatar-2.jpg"
  },
  {
    name: "Sophie Martin",
    country: "Canada",
    rating: 5,
    text: "We had the best safari experience in Yala and the train ride to Ella was the highlight of our trip.",
    img: "/path-to-avatar-3.jpg"
  }
];

const Testimonials = () => {
  return (
    <section className="bg-slate-900 py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Travelers Love Sri Lanka</h2>
            <h1 className="text-4xl text-white font-serif">What Our Travelers Say</h1>
          </div>
          <button className="text-xs text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-full transition-colors">
            View All Reviews →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md"
            >
              <div className="flex items-center space-x-4 mb-6">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border border-cyan-500/50" />
                <div>
                  <h4 className="text-white font-bold text-sm">{t.name}</h4>
                  <p className="text-gray-500 text-xs">{t.country}</p>
                </div>
                <div className="flex text-yellow-400 text-xs ml-auto">
                  {"★".repeat(t.rating)}
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed italic">
                "{t.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;