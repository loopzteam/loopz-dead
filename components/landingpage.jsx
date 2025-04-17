'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AuthForm from './AuthForm';

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  
  // Random quotes to display
  const quotes = [
    "You're not behind. You're just early to your own clarity.",
    "The moment is already listening.",
    "Clarity comes from letting go, not holding on.",
    "Your thoughts are loops. We help untangle them."
  ];
  
  // Select a random quote
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <h1 className="mb-6 text-3xl font-bold text-center">Loopz</h1>
        
        <div className="relative w-64 h-64 mb-8">
          <Image 
            src="/images/loopz-logo.png" 
            alt="Loopz Logo" 
            fill
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        
        <p className="mb-8 text-lg text-center text-gray-700">{randomQuote}</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAuth(!showAuth)}
          className="px-8 py-3 font-medium text-white bg-black rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Untangle Your Mind
        </motion.button>
      </motion.div>
      
      {showAuth && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mt-12"
        >
          <AuthForm />
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;