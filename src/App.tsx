import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import FlashcardMaker from './components/flashcard/FlashcardMaker';
import ImageToCode from './components/imagetocode/ImageToCode';
import MagicGif from './components/magicgif/magicGif';
import DictationApp from './components/dictation/DictationApp';
import TinyCats from './components/tinycats/TinyCats';
import CoDrawing from './components/codrawing/CoDrawing';
import MapsExplorer from './components/mapsexplorer/MapsExplorer';
import './App.css';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </main>
  </>
);

const HomePage: React.FC = () => (
  <div className="text-center py-12">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">
      Welcome to AI Tools
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      Choose a tool to get started
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Magical GIF Maker</h2>
        <p className="text-gray-600 mb-4">Turn your ideas into fun animated doodles.</p>
        <Link to="/magicgif" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
          Get Started
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dictation App</h2>
        <p className="text-gray-600 mb-4">Record your voice and get polished, transcribed notes.</p>
        <Link to="/dictation" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
          Get Started
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tiny Cats Explainer</h2>
        <p className="text-gray-600 mb-4">Explain complex topics using fun stories about lots of tiny cats with AI-generated illustrations.</p>
        <Link to="/tinycats" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
          Get Started
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Co-Drawing</h2>
        <p className="text-gray-600 mb-4">Draw and collaborate with AI to create enhanced artwork using Gemini's image generation.</p>
        <Link to="/codrawing" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
          Get Started
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Maps Explorer</h2>
        <p className="text-gray-600 mb-4">Discover amazing places around the world with AI-powered travel recommendations and interactive maps.</p>
        <Link to="/mapsexplorer" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
          Get Started
        </Link>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/mapsexplorer" element={<MapsExplorer />} />
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/flashcardmaker" element={<MainLayout><FlashcardMaker /></MainLayout>} />
        <Route path="/imagetocode" element={<MainLayout><ImageToCode /></MainLayout>} />
        <Route path="/magicgif" element={<MainLayout><MagicGif /></MainLayout>} />
        <Route path="/dictation" element={<MainLayout><DictationApp /></MainLayout>} />
        <Route path="/tinycats" element={<MainLayout><TinyCats /></MainLayout>} />
        <Route path="/codrawing" element={<MainLayout><CoDrawing /></MainLayout>} />
      </Routes>
    </div>
  );
};

export default App;
