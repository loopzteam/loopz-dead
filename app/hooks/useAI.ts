'use client';

import { useState } from 'react';
import { AIResponse } from '../types';

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processInput = async (input: string, chatHistory?: any[]): Promise<AIResponse> => {
    setIsProcessing(true);
    
    try {
      // Call our API route instead of OpenAI directly
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          chatHistory: chatHistory || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data as AIResponse;
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