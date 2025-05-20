'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv, MotionButton, MotionH1, MotionP } from '../lib/motion';
import AuthForm from './AuthForm';
import { useSupabase } from './SupabaseProvider';
import { useDashboard } from './DashboardContext';

const LandingPage = () => {
  const { session } = useSupabase();
  const { isDashboardVisible, setDashboardVisible } = useDashboard();
  const [showAuth, setShowAuth] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteChanging, setIsQuoteChanging] = useState(false);

  // Zen-inspired quotes
  const quotes = [
    "You're not behind. You're just early to your own clarity.",
    'The moment is already listening.',
    'Clarity comes from letting go, not holding on.',
    'Your thoughts are loops. We help untangle them.',
    'Breathe in possibility. Breathe out limitation.',
    'Each moment is a new beginning.',
  ];

  // Smoothly cycle through quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsQuoteChanging(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setIsQuoteChanging(false);
      }, 500); // Wait for fade-out animation
    }, 8000); // Change quote every 8 seconds

    return () => clearInterval(interval);
  }, [quotes.length]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2,
      },
    },
    hover: {
      scale: 1.05,
      rotate: [0, -1, 1, -1, 0],
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
  };

  const quoteVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.5, ease: 'easeIn' },
    },
  };

  const handleCTAClick = () => {
    if (session) {
      if (!isDashboardVisible) {
        setDashboardVisible(true);
      }
    } else {
      setShowAuth(!showAuth);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-white overflow-hidden z-0">
      <MotionDiv
        className="flex flex-col items-center max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <MotionH1 className="mb-6 text-3xl font-bold text-center" variants={itemVariants}>
          Loopz
        </MotionH1>

        <MotionDiv className="relative w-64 h-64 mb-8" variants={logoVariants} whileHover="hover">
          <Image
            src="/images/loopz-logo.png"
            alt="Loopz Logo"
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            priority
            style={{ objectFit: 'contain' }}
          />
        </MotionDiv>

        <div className="h-20 mb-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <MotionP
              key={currentQuoteIndex}
              className="text-lg text-center text-gray-700"
              variants={quoteVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {quotes[currentQuoteIndex]}
            </MotionP>
          </AnimatePresence>
        </div>

        <MotionButton
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCTAClick}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Untangle Your Mind
        </MotionButton>

        {!session && (
          <AnimatePresence>
            {showAuth && (
              <MotionDiv
                initial={{ opacity: 0, y: 30, height: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: 'auto',
                  transition: {
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 30,
                  height: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                className="w-full max-w-sm mt-6"
              >
                <AuthForm />
              </MotionDiv>
            )}
          </AnimatePresence>
        )}
      </MotionDiv>
    </div>
  );
};

export default LandingPage;
