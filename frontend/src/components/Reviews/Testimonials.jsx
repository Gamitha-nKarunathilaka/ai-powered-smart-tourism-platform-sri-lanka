import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// රටවල් ලැයිස්තුව (ඔයාට අවශ්‍ය පරිදි මේකට තව රටවල් එකතු කරන්න පුළුවන්)
const countryList = [
  "Australia", "Austria", "Belgium", "Canada", "China", "Denmark", 
  "France", "Germany", "India", "Italy", "Japan", "Malaysia", 
  "Maldives", "Netherlands", "New Zealand", "Russia", "Singapore", 
  "Spain", "Sweden", "Switzerland", "UAE", "UK", "USA", "Other"
];

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/reviews') 
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      });
  }, []);

  const handleAddReview = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    const newReviewData = {
      name: newName,
      country: newCountry,
      rating: Number(newRating),
      text: newText,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const savedReview = await response.json();

      setReviews([savedReview, ...reviews]);

      setNewName('');
      setNewCountry('');
      setNewRating(5);
      setNewText('');
      setShowForm(false);
    } catch (error) {
      console.error("Error saving review:", error);
      setSubmitError('Failed to save review. Please try again.');
    }
  };

  return (
    <section className="bg-slate-900 py-20 px-8 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Travelers Love Sri Lanka</h2>
            <h1 className="text-4xl text-white font-serif">What Our Travelers Say</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="text-xs text-slate-900 bg-cyan-400 font-bold px-4 py-2 rounded-full hover:bg-cyan-300 transition-colors"
            >
              {showForm ? "✕" : "+"}
            </button>
            <button className="text-xs text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-full transition-colors hidden md:block">
              View All Reviews →
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 32 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAddReview} className="bg-white/5 border border-cyan-500/30 p-6 rounded-2xl backdrop-blur-md max-w-2xl">
                <h3 className="text-white text-lg font-bold mb-4">Share Your Experience</h3>
                
                {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input 
                    type="text" required placeholder="Your Name" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-cyan-500 outline-none text-sm"
                  />
                  {/* වෙනස් කළ Country Dropdown එක */}
                  <select 
                    required 
                    value={newCountry} 
                    onChange={(e) => setNewCountry(e.target.value)}
                    className={`bg-slate-800 p-3 rounded-lg border border-slate-700 focus:border-cyan-500 outline-none text-sm ${newCountry ? 'text-white' : 'text-gray-400'}`}
                  >
                    <option value="" disabled>Select Your Country</option>
                    {countryList.map((country, index) => (
                      <option key={index} value={country} className="text-white">
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <select 
                    value={newRating} onChange={(e) => setNewRating(e.target.value)}
                    className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-cyan-500 outline-none text-sm w-full md:w-auto"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>
                <textarea 
                  required placeholder="Write your review here..." value={newText} onChange={(e) => setNewText(e.target.value)} rows="3"
                  className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-cyan-500 outline-none text-sm mb-4"
                ></textarea>
                <button type="submit" className="bg-cyan-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-cyan-400 transition-colors text-sm">
                  Submit Review
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-white">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet. Be the first to share your experience!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {reviews.map((t) => (
                <motion.div 
                  key={t._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border border-cyan-500/50 object-cover bg-slate-800" />
                    <div>
                      <h4 className="text-white font-bold text-sm">{t.name}</h4>
                      <p className="text-gray-500 text-xs">{t.country}</p>
                    </div>
                    <div className="flex text-yellow-400 text-xs ml-auto tracking-widest">
                      {"★".repeat(t.rating)}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "{t.text}"
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </section>
  );
};

export default Testimonials;