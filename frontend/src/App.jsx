import React from "react";
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import HeroSection from "./components/hero/HeroSection";
import ExperiencesGrid from "./components/experiences/ExperiencesGrid";
import Testimonials from "./components/reviews/Testimonials";
import Newsletter from "./components/footer/Newsletter";
import Footer from "./components/footer/Footer";
import SmartRecommender from "./pages/Recommender";
import RoutePlanner from "./pages/RoutePlanner";
import BlogPage from "./pages/BlogPage";
import ArticlePage from "./pages/ArticlePage";
import ArticleFormPage from "./pages/admin/ArticleFormPage";
import ManageArticlesPage from "./pages/admin/ManageArticlesPage";

function App() {
  return (
    
    <Router>
      <main className="bg-background min-h-screen flex flex-col">
        
        <Navbar />

        <div className="flex-grow">
          <Routes>
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

            <Route path="/plan-trip" element={<SmartRecommender />} />
            <Route path="/map" element={<RoutePlanner/>} />
            <Route path="/blog"element={<BlogPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            
            <Route
              path="/admin/articles"
              element={<ManageArticlesPage />}
            />
            
            <Route
              path="/admin/articles/create"
              element={<ArticleFormPage />}
            />
            
            <Route
              path="/admin/articles/:slug/edit"
              element={<ArticleFormPage />}
            />
            

          </Routes>
        </div>

        <Footer />
      </main>
    </Router>
  );
}

export default App;