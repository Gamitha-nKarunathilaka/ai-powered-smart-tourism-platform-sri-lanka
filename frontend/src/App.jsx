import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ඔබගේ දැනට ඇති Components
import Navbar from './components/Navbar/Navbar';
import HeroSection from './components/Hero/HeroSection';
import ExperiencesGrid from './components/Experiences/ExperiencesGrid';
import Testimonials from './components/Reviews/Testimonials';
import Newsletter from './components/Footer/Newsletter';
import Footer from './components/Footer/Footer';

// අලුත් AI Page එක
import SmartRecommender from './pages/SmartRecommender'; 

function App() {
  return (
    <Router>
      {/* flex සහ flex-col යොදා ඇත්තේ Footer එක හැමවිටම පතුලටම යැවීමටයි */}
      <main className="bg-background min-h-screen flex flex-col">
        
        {/* 1. Navbar එක මෙතැන දැමූ විට හැම පිටුවකදීම පෙනේවි */}
        <Navbar />

        {/* 2. පිටු මාරු වන කොටස (මැද කොටස) */}
        <div className="flex-grow">
          <Routes>
            
            {/* --- ප්‍රධාන පිටුව (Home Page) --- */}
            <Route 
              path="/" 
              element={
                <>
                  <HeroSection />
                  <ExperiencesGrid />
                  <Testimonials />
                  <Newsletter />
                </>
              } 
            />

            {/* --- අලුත් AI Recommender පිටුව --- */}
            <Route path="/plan-trip" element={<SmartRecommender />} />

          </Routes>
        </div>

        {/* 3. Footer එක මෙතැන දැමූ විට හැම පිටුවකදීම පහළින්ම පෙනේවි */}
        <Footer />
        
      </main>
    </Router>
  );
}

export default App;