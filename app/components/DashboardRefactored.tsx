'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { HeadCoach } from './coach';
import { TaskList } from './tasks';
import LoopDetail from './LoopDetail';
import { ChatMessage } from '../types';
import { shallow } from 'zustand/shallow';

export default function DashboardRefactored() {
  // Use individual selectors with shallow comparison for UI state
  const user = useStore((state) => state.user);
  const loopzList = useStore((state) => state.loopzList || []);
  const isDashboardVisible = useStore((state) => state.isDashboardVisible);
  const showLoopDetail = useStore((state) => state.showLoopDetail);
  const selectedLoopzId = useStore((state) => state.selectedLoopzId);
  const isChatExpanded = useStore((state) => state.isChatExpanded);
  const messages = useStore((state) => state.messages || []);
  const authLoading = useStore((state) => state.authLoading);
  const loopzLoading = useStore((state) => state.loopzLoading);

  // Get action functions (these references are stable in Zustand)
  const {
    setDashboardVisible,
    setShowLoopDetail,
    setSelectedLoopzId,
    setChatExpanded,
    addUserMessage,
    addAIMessage,
  } = useStore(
    (state) => ({
      setDashboardVisible: state.setDashboardVisible,
      setShowLoopDetail: state.setShowLoopDetail,
      setSelectedLoopzId: state.setSelectedLoopzId,
      setChatExpanded: state.setChatExpanded,
      addUserMessage: state.addUserMessage,
      addAIMessage: state.addAIMessage,
    }),
    shallow, // Use shallow comparison for these action functions
  );

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Memoized handler for loop item click to avoid recreating functions in the loop
  const handleLoopClick = useCallback(
    (loopId: string) => {
      setSelectedLoopzId(loopId);
      setShowLoopDetail(true);
      // Use requestAnimationFrame instead of setTimeout to avoid unnecessary re-renders
      requestAnimationFrame(() => setDashboardVisible(false));
    },
    [setSelectedLoopzId, setShowLoopDetail, setDashboardVisible],
  );

  // Memoized handler for showing dashboard
  const handleShowDashboard = useCallback(() => {
    setDashboardVisible(true);
    setShowLoopDetail(false);
  }, [setDashboardVisible, setShowLoopDetail]);

  // Memoized handler for closing detail view
  const handleCloseDetail = useCallback(() => {
    setShowLoopDetail(false);
  }, [setShowLoopDetail]);

  // Handle sign out - memoized to avoid recreating on each render
  const handleSignOut = useCallback(async () => {
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }, []);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-2 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {isDashboardVisible && (
          <motion.div
            className="fixed inset-y-0 left-0 w-[85%] bg-white shadow-lg flex flex-col z-30"
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
              {loopzLoading ? (
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
                    onClick={() => handleLoopClick(lz.id)}
                  >
                    <h3 className="font-medium">{lz.title}</h3>
                    {lz.progress !== undefined && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-black h-1.5 rounded-full"
                            style={{ width: `${lz.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {new Date(lz.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Coach/Chat Section */}
            <div className="border-t">
              <HeadCoach />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loop detail overlay */}
      <AnimatePresence>
        {selectedLoopzId && showLoopDetail && (
          <motion.div
            className="fixed inset-0 bg-white z-20"
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
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <div className="flex items-center flex-1">
                  <button
                    onClick={handleShowDashboard}
                    className="p-2 mr-3 hover:bg-gray-100 rounded-full"
                    aria-label="Show Dashboard"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>

                  <h1 className="text-xl font-semibold">
                    {loopzList.find((l) => l.id === selectedLoopzId)?.title || 'Loop Detail'}
                  </h1>
                </div>

                <button
                  onClick={handleCloseDetail}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-auto p-4">
                <TaskList loopzId={selectedLoopzId} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
