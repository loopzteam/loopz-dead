'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from './SupabaseProvider'; // Assuming SupabaseProvider is in the same directory
import { useDashboard } from './DashboardContext'; // Import useDashboard

// Interface for messages (moved from ChatBox)
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

// NOTE: This component now takes props from the example, but they might not be needed
// if SupabaseProvider/DashboardContext are used instead. Adjust if necessary.
// For now, sticking to the provided code structure.

// interface DashboardProps {
//   isVisible: boolean; // Controlled by DashboardContext via RootLayout
//   onClose: () => void; // Should likely use setDashboardVisible(false)
//   user: any; // Should likely get from useSupabase session
// }

export default function Dashboard() {
  // Hooks from Supabase and Dashboard context
  const { session, loading, supabase } = useSupabase(); // Get session, loading state, and supabase client
  const { isDashboardVisible, setDashboardVisible } = useDashboard(); // Use context for visibility
  
  // Chat state integrated into Dashboard
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for input focus

  // Dashboard panel animation variants
  const dashboardVariants = {
    hidden: { x: '-100%' }, // Start off-screen to the left
    visible: { x: '0%' },   // Slide in to occupy the screen from the left
    exit: { x: '-100%' }    // Slide out to the left
  };

  const transition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.5
  };

  // Auto-scroll chat messages
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);
  
  // Set initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: 'Hi there! What\'s on your mind today?',
          isAI: true,
          timestamp: new Date()
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once
  
  // Handle chat toggle
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    // Focus input shortly after expanding animation starts
    if (!isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150); // Adjust delay if needed
    }
  };
  
  // Handle chat message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isAI: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    if (!isExpanded) setIsExpanded(true); // Ensure expanded on send
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I hear you saying "${inputValue.trim()}". Tell me more about that.`,
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1000);
  };

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsExpanded(false); // Collapse chat on sign out
    // Context state change will hide dashboard
  };

  // Handler to close the dashboard (triggered by overlay click)
  const handleCloseDashboard = () => {
    setDashboardVisible(false);
    setIsExpanded(false); // Also collapse chat when dashboard hides
  };

  // Conditional rendering based on loading/session
  if (loading || !session) { 
    return null;
  }

  // Variants for chat area height animation
  const chatAreaVariants = {
    collapsed: { height: "68px" }, // Height for input bar + padding
    expanded: { height: "75%" } // Takes 75% of parent height
  };

  const chatTransition = { type: 'spring', damping: 40, stiffness: 400 };

  return (
    <AnimatePresence> 
      {isDashboardVisible && ( // Use context state for dashboard visibility
        <>
          {/* Overlay - uses handleCloseDashboard now */}
          <motion.div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-5 cursor-pointer" // Was z-40, now behind dashboard (z-10)
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleCloseDashboard} // Use the handler to collapse chat too
          />
          
          {/* Dashboard panel */} 
          <motion.div 
            className="fixed top-0 left-0 w-[85%] h-full bg-white shadow-lg z-10 flex flex-col overflow-hidden" // Added overflow-hidden
            variants={dashboardVariants} // Use variants for panel slide
            initial="hidden"
            animate="visible"
            exit="hidden" // Use variants for exit
            transition={{ 
              type: 'spring', 
              damping: 40, 
              stiffness: 300, 
            }}
          >
            {/* Dashboard header */} 
            <div className="flex-shrink-0 p-4 border-b border-gray-100 flex items-center justify-between">
              <h1 className="text-xl font-medium">Your Loopz</h1>
              <button 
                onClick={handleSignOut} // Sign out handles collapsing chat
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            </div>
            
            {/* Dashboard content area (adapts height via flex-1) */}
            <div className="flex-1 p-6 overflow-y-auto pb-20"> {/* Increased padding-bottom */} 
              <p>Welcome back!</p>
              {/* Dashboard content goes here */} 
            </div>
            
            {/* Chat interface - fixed positioning to viewport */}
            {/* NOTE: This div is OUTSIDE the dashboard motion.div to be fixed relative to viewport */} 
            {/* It might need adjustment if it should be fixed relative to the dashboard panel itself */}
            {/* For now, implementing as fixed to viewport per Claude's example */} 
            <div className="fixed bottom-0 left-0 right-0 z-20 w-[85%]"> {/* Constrain width to match dashboard? */} 
              
              {/* Collapsed chat placeholder */} 
              <AnimatePresence>
                {!isExpanded && (
                  <motion.div 
                    key="collapsed-chat"
                    className="bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] border-t border-gray-200 p-2 rounded-t-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button 
                      className="flex items-center rounded-full border border-gray-200 px-4 py-2 cursor-pointer w-full text-left hover:bg-gray-50"
                      onClick={() => setIsExpanded(true)}
                      aria-label="Expand chat"
                    >
                      <span className="text-gray-500 text-sm">What's on your mind?</span>
                      <div className="ml-auto">
                        {/* Up Arrow SVG */} 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded chat interface */} 
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    key="expanded-chat"
                    className="bg-white shadow-lg rounded-t-lg border border-gray-200 overflow-hidden flex flex-col" // Added flex flex-col
                    style={{ height: '75vh' }} // Use viewport height units
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 250, damping: 40 }} // Adjusted spring physics
                  >
                    {/* Chat header */} 
                    <div className="flex-shrink-0 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                      <h2 className="font-medium text-sm">Chat</h2>
                      <button 
                        onClick={() => setIsExpanded(false)} 
                        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        aria-label="Collapse chat"
                      >
                        {/* Down Arrow SVG */} 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Messages area */} 
                    <div className="flex-1 overflow-y-auto p-4 space-y-3"> {/* flex-1 takes space */} 
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
                        >
                          <motion.div 
                            className={`inline-block px-3 py-1.5 rounded-lg text-sm max-w-[85%] ${ // Max width
                              message.isAI 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-black text-white'
                            }`}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {message.content}
                          </motion.div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} /> 
                    </div>

                    {/* Chat input */} 
                    <div className="flex-shrink-0 p-2 border-t border-gray-100 bg-white">
                      <form onSubmit={handleSubmit} className="flex items-center">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="What's on your mind?" 
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black mr-2"
                          disabled={isProcessing}
                          // Auto-focus handled by handleToggle
                        />
                        <button 
                          type="submit" 
                          className={`flex-shrink-0 ml-2 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 ${ 
                            inputValue.trim() && !isProcessing
                              ? 'bg-black text-white hover:bg-gray-800 focus:ring-black'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          }`}
                          disabled={!inputValue.trim() || isProcessing}
                          aria-label="Send message"
                        >
                          {/* Send Icon SVG */} 
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* End Chat Interface Fixed Container */} 
            
          </motion.div>
          {/* End Dashboard Panel */} 
        </>
      )}
    </AnimatePresence>
  );
} 