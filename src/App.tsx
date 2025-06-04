import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import FlashcardMaker from './components/flashcard/FlashcardMaker';
import ImageToCode from './components/imagetocode/ImageToCode';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to AI Tools
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Choose a tool to get started
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Flashcard Maker</h2>
                  <p className="text-gray-600 mb-4">Create flashcards using AI to help you learn and memorize information.</p>
                  <Link to="/flashcardmaker" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                    Get Started
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Image to Code</h2>
                  <p className="text-gray-600 mb-4">Convert your design images into clean, production-ready code.</p>
                  <Link to="/imagetocode" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          } />
          <Route path="/flashcardmaker" element={<FlashcardMaker />} />
          <Route path="/imagetocode" element={<ImageToCode />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
