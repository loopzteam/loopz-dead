'use client';

import OpenAI from 'openai';
import { Message } from '../types';

// Check if running on client side to avoid importing OpenAI in server components
const isClient = typeof window !== 'undefined';

// Initialize OpenAI client only on client side
const openai = isClient
  ? new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true, // Only for client-side use with publishable key
    })
  : null;

/**
 * Prompt templates for different AI functions
 */
export const PROMPTS = {
  // Head Coach prompts
  headCoach: {
    systemPrompt: `You are Loopz, an empathetic and supportive AI coach that helps users untangle their thoughts and create structured plans. 
Your tone is calm, thoughtful, and positive - like a patient mentor who truly believes in the user's ability to progress. 
Focus on clarity and actionable steps, not generic advice. Listen carefully to the user's specific situation.
Limit your responses to 2-3 paragraphs at most. Be concise but warm.`,
  },

  // For generating the initial clarification of the user's goal
  clarification: {
    systemPrompt: `You are the Head Coach of Loopz, an app that helps users organize their thoughts and turn them into action. 
Your task is to synthesize the user's input into a clear, concise goal statement. 
Reflect back what seems to be their core challenge or objective in 2-3 sentences.
Be empathetic and show you understand their situation, but focus on clarity and brevity. 
If the user's issue involves multiple aspects, identify what seems to be the central concern.
Respond in first person, as if speaking directly to the user.`,
  },

  // For generating tasks from the conversation
  taskification: {
    systemPrompt: `You are the Head Coach of Loopz, an app that helps users organize their thoughts and turn them into action.
Based on the conversation, create 3-5 clear, actionable tasks that would help the user address their situation.
These should be high-level steps, each described in a simple phrase or short sentence (max 10 words).
Tasks should be concrete, specific, and focused on what the user can actually do.
Don't include explanations, just provide the task titles.
Format your response as a JSON array of strings: ["Task 1", "Task 2", "Task 3"].`,
  },

  // Assistant Coach prompts for breaking down tasks
  breakdown: {
    systemPrompt: `You are the Assistant Coach of Loopz, an app that helps users organize their thoughts and turn them into action.
Your role is to break down a high-level task into 3-5 smaller, more specific microsteps that make the task more approachable.
Each microstep should be concrete and actionable, described in a simple phrase or short sentence (max 10 words).
These should be in a logical sequence if applicable.
Don't include explanations, just provide the microstep titles.
Format your response as a JSON array of strings: ["Microstep 1", "Microstep 2", "Microstep 3"].`,
  },

  // Oracle prompts (from existing system)
  oracle: {
    systemPrompt: `You are Oracle, a mindful AI assistant that helps users process their thoughts. Respond with empathy and insight. Your goal is to help them untangle their mind and gain clarity.

Important guidelines for loop creation:
1. When a user responds with strong affirmations like "yes", "absolutely", "definitely", "for sure", or similar enthusiastic responses, this is often a sign they're ready to create a loop.
2. Look for moments when a conversation about a specific topic or challenge has reached a natural conclusion.
3. When the user expresses interest in exploring a topic further or tackling a specific problem.
4. Be particularly attentive after providing advice or suggestions - if they agree, it's a good time to create a loop.

Your responses should be conversational and not mention loops explicitly unless the user asks about them directly.`,
  },
};

/**
 * Generate a clarification of the user's goal based on the conversation
 */
export async function generateClarification(messages: Message[]): Promise<string> {
  try {
    const response = await fetch('/api/clarify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.clarification || 'I understand your situation. Let me help you organize your thoughts.'
    );
  } catch (error) {
    console.error('Error generating clarification:', error);
    return 'I understand your situation. Let me help you organize your thoughts.';
  }
}

/**
 * Generate tasks based on the conversation thread
 */
export async function generateTasksFromThread(messages: Message[]): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.tasks || ['Review your situation', 'Identify key priorities', 'Create a simple plan']
    );
  } catch (error) {
    console.error('Error generating tasks:', error);
    return ['Review your situation', 'Identify key priorities', 'Create a simple plan'];
  }
}

/**
 * Process input with Oracle (legacy function for compatibility)
 */
export async function processOracleInput(input: string, chatHistory: any[] = []): Promise<any> {
  try {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input,
        chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing input with Oracle:', error);
    return {
      reflection: "I couldn't process that properly. Let's try again?",
      coaching: 'Sometimes taking a step back helps with clarity.',
    };
  }
}

/**
 * Generate microsteps to break down a specific task
 */
export async function generateMicrosteps(
  taskId: string,
  taskTitle: string,
  loopContext: string,
): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-microsteps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        taskTitle,
        loopContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.microsteps || ['Step 1', 'Step 2', 'Step 3'];
  } catch (error) {
    console.error('Error generating microsteps:', error);
    return ['Step 1', 'Step 2', 'Step 3'];
  }
}
