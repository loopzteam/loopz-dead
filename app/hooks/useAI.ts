'use client';

import { useState } from 'react';
import { AIResponse } from '../types';

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processInput = async (input: string): Promise<AIResponse> => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would call the OpenAI API
      // For now, we'll simulate a response with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple logic to detect if input might need a new loopz
      const shouldCreateLoopz = input.length > 30 || 
                              input.includes('need to') || 
                              input.includes('want to') ||
                              input.includes('should');
      
      const response: AIResponse = {
        reflection: `I notice you're thinking about "${input.substring(0, 20)}...". This seems important to you.`,
        coaching: "Take a moment to breathe and consider what the next small step might be.",
        shouldCreateLoopz,
      };
      
      if (shouldCreateLoopz) {
        response.suggestedTitle = `Loop: ${input.split(' ').slice(0, 3).join(' ')}...`;
        response.tasks = [
          "Define what success looks like",
          "Identify the first small step",
          "Schedule time to work on this"
        ];
      }
      
      return response;
    } catch (error) {
      console.error('Error processing input with AI:', error);
      return {
        reflection: "I couldn't process that properly. Let's try again?",
        coaching: "Sometimes taking a step back helps with clarity."
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    isProcessing,
    processInput
  };
} 