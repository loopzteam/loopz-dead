// app/types/index.ts

// Database types (should match Supabase schema)
export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Loopz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  sentiment_score?: number | null;
  created_at: string;
  updated_at: string;
  progress?: number;
  totalSteps?: number;
  completedSteps?: number;
}

export interface Task {
  id: string;
  loopz_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // UI state not stored in DB
  is_expanded?: boolean;
}

export interface Microstep {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  loopz_id?: string;
  role: 'user' | 'assistant' | 'system';
  phase?: 'reflection' | 'clarification' | 'taskifier' | 'implementor' | 'guide' | 'breakdown';
  content: string;
  isAI?: boolean; // For backward compatibility
  timestamp?: Date; // For backward compatibility
  created_at: string;
}

// Legacy type for backward compatibility
export interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

export interface LoopzSuggestion {
  title: string;
  tasks?: string[];
}

// Response types for API calls
export interface CreateLoopResponse {
  loop: Loopz;
  tasks: Task[];
  aiResponse: string;
}

export interface GenerateMicrostepsResponse {
  microsteps: Microstep[];
  success: boolean;
}

export interface AssistantCoachResponse {
  response: string;
  success: boolean;
}

export type AIResponse = {
  reflection: string;
  tasks?: string[];
  shouldCreateLoopz?: boolean;
  suggestedTitle?: string;
  coaching?: string;
};

export type LayerState = 'zen' | 'dashboard' | 'detail';

// Helper types
export type ThemeMode = 'light' | 'dark' | 'system';