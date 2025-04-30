/**
 * Standardized database schema types
 * 
 * This file defines the canonical types for database interaction,
 * ensuring consistency between the application and database.
 */

// User from Supabase Auth
export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

// Loopz - Standard type for loopz table
export interface Loopz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  sentiment_score?: number | null;
  created_at: string;
  updated_at: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
}

// Task - Standard type for tasks table
export interface Task {
  id: string;
  loopz_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // UI state not stored in DB
  is_expanded?: boolean;
}

// Microstep - Standard type for microsteps table
export interface Microstep {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// Message - Standard type for messages table
export interface Message {
  id?: string;
  loopz_id?: string;
  user_id?: string;
  role: 'user' | 'assistant' | 'system';
  phase?: 'reflection' | 'clarification' | 'taskifier' | 'implementor' | 'guide' | 'breakdown';
  content: string;
  created_at: string;
  updated_at?: string;
}

// Schema validation - Use these to check DB interactions
export const SCHEMA = {
  loopz: {
    table: 'loopz',
    fields: [
      'id', 'user_id', 'title', 'description', 'sentiment_score',
      'created_at', 'updated_at', 'progress', 'totalSteps', 'completedSteps'
    ],
    required: ['id', 'user_id', 'title', 'created_at', 'updated_at']
  },
  tasks: {
    table: 'tasks',
    fields: [
      'id', 'loopz_id', 'user_id', 'title', 'is_completed', 
      'position', 'created_at', 'updated_at'
    ],
    required: ['id', 'loopz_id', 'user_id', 'title', 'is_completed', 'position', 'created_at', 'updated_at']
  },
  microsteps: {
    table: 'microsteps',
    fields: [
      'id', 'task_id', 'user_id', 'title', 'is_completed', 
      'position', 'created_at', 'updated_at'
    ],
    required: ['id', 'task_id', 'user_id', 'title', 'is_completed', 'position', 'created_at', 'updated_at']
  },
  messages: {
    table: 'messages',
    fields: [
      'id', 'loopz_id', 'user_id', 'role', 'phase', 
      'content', 'created_at', 'updated_at'
    ],
    required: ['id', 'loopz_id', 'user_id', 'role', 'content', 'created_at', 'updated_at']
  }
};