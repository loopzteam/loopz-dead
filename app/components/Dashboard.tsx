'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from './SupabaseProvider';
import { useDashboard } from './DashboardContext';
import { useAI } from '../hooks/useAI';
import LoopDetail from './LoopDetail';

interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

interface LoopzSuggestion {
  title: string;
  tasks?: string[];
}

interface Loopz {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  // Supabase session + client
  const { session, loading, supabase } = useSupabase();

  // Dashboard visibility
  const { isDashboardVisible, setDashboardVisible } = useDashboard();

  // AI hook
  const { isProcessing: aiProcessing, processInput } = useAI();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Loopz suggestion
  const [loopzSuggestion, setLoopzSuggestion] = useState<LoopzSuggestion | null>(null);
  const [isCreatingLoopz, setIsCreatingLoopz] = useState(false);

  // User's loopz list
  const [loopzList, setLoopzList] = useState<Loopz[]>([]);
  const [loadingLoopz, setLoadingLoopz] = useState(true);
  const [selectedLoopzId, setSelectedLoopzId] = useState<string | null>(null);
  const [showLoopDetail, setShowLoopDetail] = useState(false);

  // Chat expansion
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle chat submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    setIsChatExpanded(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isAI: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const text = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    // Confirm loopz creation
    if (loopzSuggestion && /^(yes|sure|ok|create|loopz)/i.test(text)) {
      await handleCreateLoopz();
      setIsProcessing(false);
      return;
    }

    // Decline suggestion
    if (loopzSuggestion && /^(no|cancel|not now)/i.test(text)) {
      setLoopzSuggestion(null);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: 'Okay, no loopz created. Anything else?',
          isAI: true,
          timestamp: new Date(),
        },
      ]);
      setIsProcessing(false);
      return;
    }

    try {
      const context = [...messages.slice(-5), userMsg];
      const aiRes = await processInput(text, context);

      // Reflection
      if (aiRes.reflection) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: aiRes.reflection,
            isAI: true,
            timestamp: new Date(),
          },
        ]);
      }

      // Coaching
      if (aiRes.coaching) {
        // Instead of using setTimeout, add an effect dependency that will trigger the new message
        // after the first message has been added to state
        const coachingMessage = {
          id: (Date.now() + 2).toString(),
          content: aiRes.coaching!,
          isAI: true,
          timestamp: new Date(),
        };

        // Schedule in the next frame to avoid batched state updates
        requestAnimationFrame(() => {
          setMessages((prev) => [...prev, coachingMessage]);
        });
      }

      // Suggest loopz
      if (aiRes.shouldCreateLoopz && aiRes.suggestedTitle) {
        setLoopzSuggestion({
          title: aiRes.suggestedTitle,
          tasks: aiRes.tasks,
        });

        const loopzSuggestionMessage = {
          id: (Date.now() + 3).toString(),
          content: `Create a loopz called "${aiRes.suggestedTitle}" to track this?`,
          isAI: true,
          timestamp: new Date(),
        };

        // Use Promise.resolve().then() to schedule in next microtask,
        // avoiding setTimeout which could cause re-render loops
        Promise.resolve().then(() => {
          setMessages((prev) => [...prev, loopzSuggestionMessage]);
        });
      } else {
        setLoopzSuggestion(null);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I couldn't process that. Try again?",
          isAI: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch loopz list & realtime updates
  useEffect(() => {
    if (!session) return;
    let sub: any;

    const loadLoopz = async () => {
      setLoadingLoopz(true);
      const { data, error } = await supabase
        .from('loopz')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Fetch loopz error:', error);
      else setLoopzList(data || []);
      setLoadingLoopz(false);
    };

    loadLoopz();

    sub = supabase
      .channel('loopz-ch')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loopz',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => loadLoopz(),
      )
      .subscribe();

    // Make cleanup synchronous
    return () => {
      supabase.removeChannel(sub);
    };
  }, [session, supabase]);

  // Create loopz handler
  const handleCreateLoopz = async () => {
    if (!loopzSuggestion || !session) return;
    setIsCreatingLoopz(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: `Creating your "${loopzSuggestion.title}" loopz...`,
        isAI: true,
        timestamp: new Date(),
      },
    ]);

    try {
      const { data, error } = await supabase
        .from('loopz')
        .insert([{ title: loopzSuggestion.title, user_id: session.user.id }])
        .select();
      if (error) throw error;
      const newId = data?.[0]?.id;

      if (loopzSuggestion.tasks?.length && newId) {
        await supabase.from('steps').insert(
          loopzSuggestion.tasks.map((t, i) => ({
            loopz_id: newId,
            content: t,
            is_completed: false,
            order_num: i,
          })),
        );
      }

      setLoopzSuggestion(null);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `Done! "${loopzSuggestion.title}" created. Opening now…`,
          isAI: true,
          timestamp: new Date(),
        },
      ]);

      // Use requestAnimationFrame for better animation timing
      if (newId) {
        // Schedule the state updates for the next animation frame
        requestAnimationFrame(() => {
          setLoopzList((prev) => [
            {
              id: newId,
              title: loopzSuggestion.title,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          setSelectedLoopzId(newId);
          setShowLoopDetail(true);

          // Schedule dashboard visibility for the next frame
          requestAnimationFrame(() => {
            setDashboardVisible(false);
            setIsChatExpanded(false);
          });
        });
      }
    } catch (err) {
      console.error('Create loopz error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Couldn't create loopz. Try later?",
          isAI: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsCreatingLoopz(false);
    }
  };

  const handleSignOut = async () => supabase.auth.signOut();

  if (loading || !session) return null;

  return (
    <>
      <AnimatePresence>
        {isDashboardVisible && (
          <motion.div
            {...({
              className: 'fixed inset-y-0 left-0 w-[85%] bg-white shadow-lg flex flex-col z-30',
            } as any)}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 180 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-semibold">Your Loopz</h1>
              <button onClick={handleSignOut} className="px-2 py-1 bg-gray-700 text-white rounded">
                Sign Out
              </button>
            </div>

            {/* Loopz List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingLoopz ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-t-black rounded-full animate-spin" />
                </div>
              ) : loopzList.length === 0 ? (
                <p className="text-gray-500">No loopz yet. Start chatting to create one.</p>
              ) : (
                loopzList.map((lz) => (
                  <div
                    key={lz.id}
                    className="p-3 bg-gray-50 rounded mb-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedLoopzId(lz.id);
                      setShowLoopDetail(true);
                      // Use requestAnimationFrame instead of setTimeout for smoother animation
                      requestAnimationFrame(() => setDashboardVisible(false));
                    }}
                  >
                    <h3 className="font-medium">{lz.title}</h3>
                    <p className="text-xs text-gray-500">
                      Updated {new Date(lz.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Section */}
            <div className="border-t">
              <AnimatePresence>
                {isChatExpanded && (
                  <motion.div
                    {...({ className: 'bg-gray-50 overflow-y-auto' } as any)}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ maxHeight: '60vh' }}
                  >
                    <div className="flex justify-between items-center p-2 bg-white border-b">
                      <span className="text-sm text-gray-500">Conversation</span>
                      <button
                        onClick={() => setIsChatExpanded(false)}
                        className="p-1 text-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.isAI ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`px-4 py-2 max-w-[80%] ${m.isAI ? 'bg-gray-200 text-black' : 'bg-black text-white'} rounded-2xl text-sm`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 bg-white">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onClick={() => !isChatExpanded && setIsChatExpanded(true)}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="What's on your mind?"
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none italic text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isProcessing}
                    className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full disabled:bg-gray-300"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 9.707l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loop detail overlay */}
      <AnimatePresence>
        {selectedLoopzId && showLoopDetail && (
          <motion.div
            {...({ className: 'fixed inset-0 bg-white z-20' } as any)}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 180 }}
            onAnimationComplete={(definition) => {
              if (definition === 'exit') {
                setSelectedLoopzId(null);
              }
            }}
          >
            <LoopDetail loopId={selectedLoopzId} onClose={() => setShowLoopDetail(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
