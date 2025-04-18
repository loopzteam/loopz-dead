'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from './SupabaseProvider';
import { useDashboard } from './DashboardContext';
import { useAI } from '../hooks/useAI';
import LoopDetail from './LoopDetail';

// Interface for messages
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

export default function Dashboard() {
  // Hooks from Supabase and Dashboard context
  const { session, loading, supabase } = useSupabase();
  const { isDashboardVisible, setDashboardVisible } = useDashboard();
  const { isProcessing: aiProcessing, processInput } = useAI();
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Loop suggestion state
  const [loopSuggestion, setLoopSuggestion] = useState<LoopSuggestion | null>(null);
  const [isCreatingLoop, setIsCreatingLoop] = useState(false);
  
  // User's loops state
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loadingLoops, setLoadingLoops] = useState(true);
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  
  // State for chat expanded
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Auto-scroll chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle chat message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    // Expand chat when user sends a message
    setIsChatExpanded(true);
    
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
    
    // Check for loop creation confirmation
    if (loopSuggestion && 
        (userInput.toLowerCase().includes('yes') || 
         userInput.toLowerCase().includes('sure') ||
         userInput.toLowerCase().includes('ok') ||
         userInput.toLowerCase().includes('create') ||
         userInput.toLowerCase().includes('loop') ||
         userInput.toLowerCase().includes('yea'))) {
      
      console.log('Detected loop creation confirmation:', userInput);
      await handleCreateLoop();
      setIsProcessing(false);
      return;
    }
    
    // Check for loop rejection
    if (loopSuggestion && 
        (userInput.toLowerCase().includes('no') || 
         userInput.toLowerCase().includes('don\'t') ||
         userInput.toLowerCase().includes('not now') ||
         userInput.toLowerCase().includes('cancel'))) {
      
      console.log('Detected loop creation rejection:', userInput);
      
      // Clear the loop suggestion
      setLoopSuggestion(null);
      
      // Add message that loop creation was canceled
      const cancelMessage: Message = {
        id: Date.now().toString(),
        content: "No problem. We won't create a loop for this. Is there anything else you'd like to discuss?",
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, cancelMessage]);
      setIsProcessing(false);
      return;
    }
    
    try {
      // Get last 5 messages for context
      const recentMessages = [...messages.slice(-5), userMessage];
      
      // Use OpenAI integration with chat history
      const aiResponse = await processInput(userInput, recentMessages);
      
      // Add reflection message if it exists
      if (aiResponse.reflection) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.reflection,
          isAI: true,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
      
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
        // Save the suggestion
        setLoopSuggestion({
          title: aiResponse.suggestedTitle || "New Loop",
          tasks: aiResponse.tasks
        });
        
        // Send a follow-up message asking to create the loop (without showing tasks)
        setTimeout(() => {
          const loopSuggestionMessage: Message = {
            id: (Date.now() + 3).toString(),
            content: `Would you like me to create a loop called "${aiResponse.suggestedTitle}" to track this?`,
            isAI: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, loopSuggestionMessage]);
        }, 1500);
      } else {
        // Clear any existing suggestion if AI doesn't think we need a loop anymore
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
      setIsCreatingLoop(true);
      console.log('Starting loop creation:', loopSuggestion);
      
      // Add a message indicating loop creation is in progress
      const processingMessage: Message = {
        id: Date.now().toString(),
        content: `Creating your "${loopSuggestion.title}" loop...`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Insert new loop into Supabase
      console.log('Inserting loop into Supabase');
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
      
      if (error) {
        console.error('Error inserting loop:', error);
        throw error;
      }
      
      console.log('Loop created successfully:', data);
      let newLoopId = null;
      
      // If there are suggested tasks, add them
      if (loopSuggestion.tasks && loopSuggestion.tasks.length > 0 && data && data[0]) {
        const loopId = data[0].id;
        newLoopId = loopId;
        console.log('Creating tasks for loop:', loopId);
        
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
        
        if (tasksError) {
          console.error('Error creating tasks:', tasksError);
        } else {
          console.log('Tasks created successfully');
        }
      } else if (data && data[0]) {
        newLoopId = data[0].id;
        console.log('No tasks to create, just using loop ID:', newLoopId);
      }
      
      // Clear suggestion
      setLoopSuggestion(null);
      
      // Add confirmation message
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        content: `Perfect! I've created your "${loopSuggestion.title}" loop. Opening it now...`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      
      // Wait a moment and then navigate to the new loop
      console.log('Setting timeout to navigate to loop:', newLoopId);
      setTimeout(() => {
        if (newLoopId) {
          console.log('Navigating to loop:', newLoopId);
          setSelectedLoopId(newLoopId);
          console.log('Collapsing chat');
          setIsChatExpanded(false); // Optionally collapse chat when showing loop detail
        } else {
          console.error('No loop ID available for navigation');
        }
      }, 1000);
      
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
    } finally {
      setIsCreatingLoop(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Toggle chat expanded state
  const handleChatToggle = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  // Focus input when chat is expanded
  useEffect(() => {
    if (isChatExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatExpanded]);

  // Conditional rendering based on loading/session
  if (loading || !session || !isDashboardVisible) { 
    return null;
  }

  return (
    <>
      {/* Dashboard Panel - slides in from left */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed inset-y-0 left-0 w-[85%] bg-white shadow-lg flex flex-col z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Your Loopz</h1>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>

        {/* Main Content (Loops) */}
        <div className="flex-1 overflow-y-auto p-4">
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
        
        {/* Chat Section */}
        <div className="border-t border-gray-100">
          {/* Expandable Chat Area */}
          <AnimatePresence>
            {isChatExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-gray-50 overflow-y-auto"
                style={{ maxHeight: '60vh' }}
              >
                <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white">
                  <div className="text-sm text-gray-500">Conversation</div>
                  <button 
                    onClick={() => setIsChatExpanded(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {messages.map((message, index) => {
                    // Check if this message is part of a sequence from the same sender
                    const isFirstInSequence = index === 0 || messages[index - 1].isAI !== message.isAI;
                    const isLastInSequence = index === messages.length - 1 || messages[index + 1].isAI !== message.isAI;
                    
                    // Determine border radius based on position in sequence
                    let borderRadiusClass = '';
                    if (message.isAI) {
                      if (isFirstInSequence && isLastInSequence) {
                        borderRadiusClass = 'rounded-2xl'; // Single message
                      } else if (isFirstInSequence) {
                        borderRadiusClass = 'rounded-t-2xl rounded-br-2xl rounded-bl-lg'; // First in sequence
                      } else if (isLastInSequence) {
                        borderRadiusClass = 'rounded-b-2xl rounded-tr-2xl rounded-tl-lg'; // Last in sequence
                      } else {
                        borderRadiusClass = 'rounded-r-2xl rounded-l-lg'; // Middle of sequence
                      }
                    } else {
                      if (isFirstInSequence && isLastInSequence) {
                        borderRadiusClass = 'rounded-2xl'; // Single message
                      } else if (isFirstInSequence) {
                        borderRadiusClass = 'rounded-t-2xl rounded-bl-2xl rounded-br-lg'; // First in sequence
                      } else if (isLastInSequence) {
                        borderRadiusClass = 'rounded-b-2xl rounded-tl-2xl rounded-tr-lg'; // Last in sequence
                      } else {
                        borderRadiusClass = 'rounded-l-2xl rounded-r-lg'; // Middle of sequence
                      }
                    }
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
                      >
                        <div 
                          className={`px-4 py-2 max-w-[85%] ${borderRadiusClass} ${
                            message.isAI 
                              ? 'bg-gray-200 text-gray-800' 
                              : 'bg-gray-800 text-white'
                          } text-sm`}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Chat Input */}
          <div className="bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onClick={() => !isChatExpanded && setIsChatExpanded(true)}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What's on your mind?"
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-sm border border-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 italic"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 text-white rounded-full disabled:bg-gray-300 focus:outline-none"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
      
      {/* Overlay to close dashboard - 15% on the right side */}
      <div 
        className="fixed inset-y-0 right-0 w-[15%] z-5 cursor-pointer" 
        onClick={() => setDashboardVisible(false)}
      />
      
      {/* Selected Loop Detail Overlay */}
      <AnimatePresence>
        {selectedLoopId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-20"
          >
            <LoopDetail 
              loopId={selectedLoopId} 
              onClose={() => setSelectedLoopId(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 