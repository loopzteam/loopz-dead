'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI';

interface ChatInputProps {
  onSend: (message: string, aiResponse: any) => void;
  isDisabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isDisabled = false }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, processInput } = useAI();
  
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
    <div className="bg-white p-3 border-t border-gray-100">
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 border border-gray-100 rounded-l-lg focus:outline-none focus:border-gray-400"
          disabled={isDisabled || isProcessing}
        />
        <button
          type="submit"
          className="p-2 px-4 bg-black text-white rounded-r-lg disabled:bg-gray-300"
          disabled={!input.trim() || isDisabled || isProcessing}
        >
          {isProcessing ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInput; 