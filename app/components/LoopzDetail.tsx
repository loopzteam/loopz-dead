'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv, MotionButton } from '../lib/motion';
import ChatInput from './ChatInput';
import { Loopz, Message, Step } from '../types';

interface LoopzDetailProps {
  loopz: Loopz;
  onClose: () => void;
  isVisible: boolean;
}

const LoopzDetail: React.FC<LoopzDetailProps> = ({ loopz, onClose, isVisible }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);

  // Simulate loading messages and steps
  useEffect(() => {
    // In a real app, you'd fetch these from your database
    if (isVisible) {
      setMessages([
        {
          id: '1',
          loopz_id: loopz.id,
          content: 'I need to plan my vacation trip to Japan.',
          role: 'user',
          isAI: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          loopz_id: loopz.id,
          content:
            "I notice you're thinking about planning a trip to Japan. That sounds exciting! What aspects of the trip are you most focused on right now?",
          role: 'assistant',
          isAI: true,
          created_at: new Date().toISOString(),
        },
      ]);

      setSteps([
        {
          id: '1',
          loopz_id: loopz.id,
          content: 'Research best time to visit Japan',
          isCompleted: true,
          order: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          loopz_id: loopz.id,
          content: 'Create budget for the trip',
          isCompleted: false,
          order: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          loopz_id: loopz.id,
          content: 'Book flights and accommodations',
          isCompleted: false,
          order: 3,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [loopz.id, isVisible]);

  const handleNewMessage = (content: string, aiResponse: any) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      loopz_id: loopz.id,
      content,
      role: 'user',
      isAI: false,
      created_at: new Date().toISOString(),
    };

    // Add AI message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      loopz_id: loopz.id,
      content: aiResponse.reflection + (aiResponse.coaching ? `\n\n${aiResponse.coaching}` : ''),
      role: 'assistant',
      isAI: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);

    // Add any new tasks as steps
    if (aiResponse.tasks && aiResponse.tasks.length > 0) {
      const newSteps = aiResponse.tasks.map((task: string, index: number) => ({
        id: (Date.now() + index + 2).toString(),
        loopz_id: loopz.id,
        content: task,
        isCompleted: false,
        order: steps.length + index + 1,
        created_at: new Date().toISOString(),
      }));

      setSteps((prev) => [...prev, ...newSteps]);
    }
  };

  const toggleStepCompletion = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step)),
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          className="fixed inset-0 bg-white z-20 flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <MotionButton
              onClick={onClose}
              className="mr-3 p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </MotionButton>
            <h2 className="text-lg font-medium flex-1">{loopz.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-3">Steps</h3>
              {steps.map((step) => (
                <div key={step.id} className="flex items-center mb-2">
                  <MotionDiv
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center cursor-pointer ${step.isCompleted ? 'bg-black border-black' : 'border-gray-400'}`}
                    onClick={() => toggleStepCompletion(step.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {step.isCompleted && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </MotionDiv>
                  <span className={step.isCompleted ? 'line-through text-gray-500' : ''}>
                    {step.content}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-medium text-lg mb-3">Conversation</h3>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${message.isAI ? 'bg-gray-100' : 'bg-black text-white'} p-3 rounded-xl max-w-xs md:max-w-md ${message.isAI ? 'mr-auto' : 'ml-auto'}`}
                  >
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ChatInput onSend={handleNewMessage} />
          </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default LoopzDetail;
