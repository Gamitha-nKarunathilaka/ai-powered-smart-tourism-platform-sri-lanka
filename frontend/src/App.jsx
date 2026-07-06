import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import HeroSection from "./components/Hero/HeroSection";
import ExperiencesGrid from "./components/Experiences/ExperiencesGrid";
import Testimonials from "./components/Reviews/Testimonials";
import Newsletter from "./components/Footer/Newsletter";
import Footer from "./components/Footer/Footer";
import SmartRecommender from "./pages/SmartRecommender";
import MapPage from "./pages/MapPage";
import BlogPage from "./Pages/BlogPage";
import ArticlePage from "./pages/ArticlePage";
import ArticleFormPage from "./Pages/admin/ArticleFormPage";
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
            <Route path="/map" element={<MapPage />} />
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