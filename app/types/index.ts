// app/types/index.ts
export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface Loopz {
  id: string;
  title: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Step {
  id: string;
  loopz_id: string;
  content: string;
  isCompleted: boolean;
  order: number;
  created_at: string;
}

export interface Message {
  id: string;
  loopz_id: string;
  content: string;
  isAI: boolean;
  created_at: string;
}

export type AIResponse = {
  reflection: string;
  tasks?: string[];
  shouldCreateLoopz?: boolean;
  suggestedTitle?: string;
  coaching?: string;
};

export type LayerState = 'zen' | 'dashboard' | 'detail'; 