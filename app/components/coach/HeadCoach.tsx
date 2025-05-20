'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Message } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeadCoachProps {
  loopzId?: string; // Optional - if provided, we're continuing a conversation in an existing loop
}

export default function HeadCoach({ loopzId }: HeadCoachProps) {
  // Local state for the text input and messages
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global state from Zustand store - use individual selectors to avoid unstable references
  const user = useStore((state) => state.user);
  const addLoopz = useStore((state) => state.addLoopz);
  const setCurrentLoopzId = useStore((state) => state.setCurrentLoopzId);
  const setTasks = useStore((state) => state.setTasks);
  const setDashboardVisible = useStore((state) => state.setDashboardVisible);
  const setSelectedLoopzId = useStore((state) => state.setSelectedLoopzId);
  const setShowLoopDetail = useStore((state) => state.setShowLoopDetail);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  // Handle submitting the user's message to create a new loop or continue an existing one
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Add user message to the local chat history
      const newUserMessage: Message = {
        role: 'user',
        content: inputText.trim(),
        phase: 'reflection', // Initial user input is a reflection
        created_at: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);
      setInputText('');

      // Prepare the API call payload
      // Note: userId should be passed from the client but will be verified server-side against the session
      const payload = {
        messages: updatedMessages,
        userId: user.id, // Server will use the authenticated session user ID for database operations
        loopzId, // This will be undefined for a new loop, or the ID for continuing a conversation
      };

      // Call our API route
      console.log('Sending payload to API:', {
        messageCount: payload.messages.length,
        userId: payload.userId.slice(0, 8) + '...',
      });

      const response = await fetch('/api/create-loopz-from-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response received:', {
        hasLoop: !!data.loop,
        hasTasks: !!data.tasks,
        taskCount: data.tasks?.length || 0,
        debug: data.debug || 'No debug info',
      });

      // Update our local chat with the AI's response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.aiResponse,
        phase: 'clarification', // AI's first response clarifies the goal
        created_at: new Date().toISOString(),
      };

      setMessages([...updatedMessages, assistantMessage]);

      // If this is a new loop, we'll get back a new loop and tasks to add to our state
      if (data.loop && data.tasks) {
        console.log('Updating global state with loop and tasks', {
          loopId: data.loop.id,
          taskCount: data.tasks.length,
        });

        // Add the new loop to our global state
        addLoopz(data.loop);
        console.log('Called addLoopz with:', data.loop);

        // Set this as the current loop
        setCurrentLoopzId(data.loop.id);
        console.log('Called setCurrentLoopzId with:', data.loop.id);

        // Add the tasks to our global state
        setTasks(data.tasks);
        console.log('Called setTasks with:', data.tasks.length, 'tasks');

        // Open the loop detail view (disabled for test-coach page)
        // Commenting this out for the test-coach page to keep focus on debugging
        /*
        setTimeout(() => {
          setSelectedLoopzId(data.loop.id);
          setShowLoopDetail(true);
          setTimeout(() => setDashboardVisible(false), 100);
        }, 1000);
        */
        console.log('Detail view animation skipped for testing');
      } else {
        console.warn('API response missing loop or tasks:', data);
      }
    } catch (err) {
      console.error('Error creating loop:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message display area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium mb-2">Welcome to Loopz</h3>
            <p className="text-gray-600 mb-4">
              Share what's on your mind, and we'll help organize your thoughts into action.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 max-w-[80%] ${
                message.role === 'user' ? 'bg-black text-white' : 'bg-gray-200 text-black'
              } rounded-2xl text-sm`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-200 rounded-2xl text-sm flex items-center">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-2" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-red-100 text-red-700 rounded-2xl text-sm">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !loopzId ? "Describe what's on your mind..." : 'Ask a follow-up question...'
            }
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none text-sm"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full disabled:bg-gray-300"
          >
            {isSubmitting ? (
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
  );
}
