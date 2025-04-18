'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { useSupabase } from './SupabaseProvider'; // Assuming SupabaseProvider is in the same directory
import { useDashboard } from './DashboardContext'; // Import useDashboard
import { useAI } from '../hooks/useAI';
import LoopDetail from './LoopDetail';

// Interface for messages (moved from ChatBox)
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

// Interface for loop suggestion
interface LoopSuggestion {
  title: string;
  tasks?: string[];
}

// Interface for loops
interface Loop {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  const { isProcessing: aiProcessing, processInput } = useAI();
  
  // Chat state integrated into Dashboard
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for input focus
  
  // Loop suggestion state
  const [loopSuggestion, setLoopSuggestion] = useState<LoopSuggestion | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  // User's loops state
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loadingLoops, setLoadingLoops] = useState(true);
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);

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
    
    const userInput = inputValue.trim();
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    if (!isExpanded) setIsExpanded(true); // Ensure expanded on send
    
    try {
      // Get last 5 messages for context
      const recentMessages = [...messages.slice(-5), userMessage];
      
      // Use OpenAI integration with chat history
      const aiResponse = await processInput(userInput, recentMessages);
      
      // Create AI message from response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.reflection,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If AI suggests coaching advice, add it as a separate message
      if (aiResponse.coaching) {
        setTimeout(() => {
          const coachingMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: aiResponse.coaching,
            isAI: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, coachingMessage]);
        }, 1000);
      }
      
      // Check if AI suggests creating a loop
      if (aiResponse.shouldCreateLoopz && aiResponse.suggestedTitle) {
        setTimeout(() => {
          setLoopSuggestion({
            title: aiResponse.suggestedTitle || "New Loop",
            tasks: aiResponse.tasks
          });
          setShowSuggestion(true);
        }, 1500);
      } else {
        // Clear any existing suggestion
        setShowSuggestion(false);
        setLoopSuggestion(null);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble processing that right now. Can we try a different approach?",
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch user's loops
  useEffect(() => {
    const fetchLoops = async () => {
      if (!session) return;
      
      try {
        setLoadingLoops(true);
        const { data, error } = await supabase
          .from('loops')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setLoops(data || []);
      } catch (error) {
        console.error('Error fetching loops:', error);
      } finally {
        setLoadingLoops(false);
      }
    };
    
    fetchLoops();
    
    // Subscribe to changes
    const loopsSubscription = supabase
      .channel('loops-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'loops',
        filter: `user_id=eq.${session?.user.id}`
      }, (payload) => {
        fetchLoops();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(loopsSubscription);
    };
  }, [session, supabase]);

  // Handle creating a new loop
  const handleCreateLoop = async () => {
    if (!loopSuggestion || !session) return;
    
    try {
      // Insert new loop into Supabase
      const { data, error } = await supabase
        .from('loops')
        .insert([
          {
            title: loopSuggestion.title,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // If there are suggested tasks, add them
      if (loopSuggestion.tasks && loopSuggestion.tasks.length > 0 && data && data[0]) {
        const loopId = data[0].id;
        
        const tasks = loopSuggestion.tasks.map((task, index) => ({
          loop_id: loopId,
          content: task,
          is_completed: false,
          order: index,
          created_at: new Date().toISOString()
        }));
        
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasks);
        
        if (tasksError) console.error('Error creating tasks:', tasksError);
        
        // Show the new loop
        setSelectedLoopId(loopId);
      }
      
      // Clear suggestion and add confirmation message
      setShowSuggestion(false);
      setLoopSuggestion(null);
      
      // Add confirmation message
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        content: `I've created a new loop called "${loopSuggestion.title}" for you.`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      
    } catch (error) {
      console.error('Error creating loop:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I couldn't create the loop right now. Let's try again later.",
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
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
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left side: Loopz list */}
              <div className="w-1/3 border-r border-gray-100 overflow-y-auto p-4">
                <h2 className="font-medium text-sm text-gray-500 mb-3">My Loops</h2>
                
                {loadingLoops ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-t-black border-gray-200 rounded-full animate-spin"></div>
                  </div>
                ) : loops.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No loops yet. Start a conversation to create one.</p>
                ) : (
                  <div className="space-y-2">
                    {loops.map(loop => (
                      <div 
                        key={loop.id} 
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setSelectedLoopId(loop.id)}
                      >
                        <h3 className="font-medium">{loop.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Last updated {new Date(loop.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right side: Content area / Oracle chat */}
              <div className="w-2/3 flex flex-col overflow-hidden relative">
                {selectedLoopId ? (
                  <LoopDetail 
                    loopId={selectedLoopId} 
                    onClose={() => setSelectedLoopId(null)} 
                  />
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h2 className="font-medium">Oracle Chat</h2>
                      <p className="text-xs text-gray-500">Talk to Oracle about anything on your mind</p>
                    </div>
                    
                    <div className="flex-1 overflow-hidden pb-16">
                      {/* Chat will be rendered here by the fixed chat interface below */}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Chat interface - fixed positioning to viewport */}
            {!selectedLoopId && (
              <div className="fixed bottom-0 left-0 right-0 z-20 w-[85%]">
                
                {/* Loop suggestion notification */}
                <AnimatePresence>
                  {showSuggestion && loopSuggestion && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="bg-black text-white p-4 mx-4 mb-4 rounded-lg shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm mb-1">Would you like to create a loop for this?</h3>
                          <p className="text-sm text-gray-300 mb-2">{loopSuggestion.title}</p>
                          
                          {loopSuggestion.tasks && loopSuggestion.tasks.length > 0 && (
                            <div className="mt-2 text-xs">
                              <p className="text-gray-300 mb-1">Suggested tasks:</p>
                              <ul className="list-disc pl-4">
                                {loopSuggestion.tasks.slice(0, 2).map((task, index) => (
                                  <li key={index} className="text-gray-300">{task}</li>
                                ))}
                                {loopSuggestion.tasks.length > 2 && (
                                  <li className="text-gray-300">+{loopSuggestion.tasks.length - 2} more tasks</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex">
                          <button 
                            onClick={() => setShowSuggestion(false)}
                            className="text-xs text-gray-300 hover:text-white px-3 py-1"
                          >
                            Dismiss
                          </button>
                          <button 
                            onClick={handleCreateLoop}
                            className="text-xs bg-white text-black font-medium px-3 py-1 rounded hover:bg-gray-200"
                          >
                            Create Loop
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
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
            )}
          </motion.div>
          {/* End Dashboard Panel */}
        </>
      )}
      
      {/* Loop Detail View when not in dashboard */}
      {!isDashboardVisible && selectedLoopId && (
        <LoopDetail 
          loopId={selectedLoopId} 
          onClose={() => setSelectedLoopId(null)} 
        />
      )}
    </AnimatePresence>
  );
} 