'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAI } from '../hooks/useAI';

interface ChatInputProps {
  onSend: (message: string, aiResponse: any) => void;
  isDisabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isDisabled = false }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isProcessing, processInput } = useAI();
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim() || isDisabled || isProcessing) return;
    
    const message = input.trim();
    setInput('');
    
    const aiResponse = await processInput(message);
    onSend(message, aiResponse);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t border-gray-200"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <form onSubmit={handleSubmit} className="flex items-end max-w-3xl mx-auto">
        <motion.div 
          className={`flex-1 relative rounded-2xl border ${isFocused ? 'border-gray-400' : 'border-gray-300'} bg-white overflow-hidden`}
          whileTap={{ scale: 0.995 }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type a thought, task, or reflection..."
            className="w-full py-3 px-4 resize-none outline-none max-h-32"
            rows={1}
            disabled={isDisabled || isProcessing}
          />
        </motion.div>
        
        <motion.button
          type="submit"
          className={`ml-2 rounded-full p-3 ${input.trim() && !isDisabled && !isProcessing ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}
          whileHover={input.trim() && !isDisabled && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={input.trim() && !isDisabled && !isProcessing ? { scale: 0.95 } : {}}
          disabled={!input.trim() || isDisabled || isProcessing}
        >
          {isProcessing ? (
            <span className="block w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChatInput; 