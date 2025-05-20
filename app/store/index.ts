'use client';

import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loopz, Task, Microstep, Message, ChatMessage } from '../types';

// Initialize Supabase client
const supabase = createClientComponentClient();

// Define slice types
interface AuthSlice {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

interface LoopzSlice {
  loopzList: Loopz[];
  currentLoopzId: string | null;
  loopzLoading: boolean;
  loopzError: string | null;
  setLoopzList: (loopz: Loopz[]) => void;
  addLoopz: (loopz: Loopz) => void;
  updateLoopz: (loopz: Loopz) => void;
  setCurrentLoopzId: (id: string | null) => void;
  setLoopzLoading: (loading: boolean) => void;
  setLoopzError: (error: string | null) => void;
}

interface TaskSlice {
  tasks: Task[];
  microsteps: Microstep[];
  taskLoading: boolean;
  taskError: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  toggleTaskCompletion: (taskId: string) => void;
  expandTask: (taskId: string) => void;
  setMicrosteps: (microsteps: Microstep[]) => void;
  addMicrosteps: (taskId: string, microsteps: Microstep[] | string[]) => void;
  toggleMicrostepCompletion: (microstepId: string) => void;
  setTaskLoading: (loading: boolean) => void;
  setTaskError: (error: string | null) => void;
}

interface ChatSlice {
  messages: ChatMessage[];
  loopzSuggestion: { title: string; tasks?: string[] } | null;
  chatLoading: boolean;
  chatError: string | null;
  addUserMessage: (content: string) => void;
  addAIMessage: (content: string) => void;
  setLoopzSuggestion: (suggestion: { title: string; tasks?: string[] } | null) => void;
  setChatLoading: (loading: boolean) => void;
  setChatError: (error: string | null) => void;
}

interface UISlice {
  isDashboardVisible: boolean;
  showLoopDetail: boolean;
  selectedLoopzId: string | null;
  isChatExpanded: boolean;
  theme: 'light' | 'dark' | 'system';
  setDashboardVisible: (visible: boolean) => void;
  setShowLoopDetail: (visible: boolean) => void;
  setSelectedLoopzId: (id: string | null) => void;
  setChatExpanded: (expanded: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Helper functions slice
interface HelperSlice {
  loadUserData: () => Promise<void>;
  loadLoopzTasks: (loopzId: string) => Promise<void>;
}

// Combine into a single store type
type StoreState = AuthSlice & LoopzSlice & TaskSlice & ChatSlice & UISlice & HelperSlice;

// Create the store
export const useStore = create<StoreState>((set, get) => ({
  // Auth slice
  user: null,
  authLoading: false,
  authError: null,
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setAuthError: (error) => set({ authError: error }),

  // Loopz slice
  loopzList: [],
  currentLoopzId: null,
  loopzLoading: false,
  loopzError: null,
  setLoopzList: (loopzList) => set({ loopzList }),
  addLoopz: (loopz) => set((state) => ({ loopzList: [loopz, ...state.loopzList] })),
  updateLoopz: (updatedLoopz) =>
    set((state) => ({
      loopzList: state.loopzList.map((loopz) =>
        loopz.id === updatedLoopz.id ? { ...loopz, ...updatedLoopz } : loopz,
      ),
    })),
  setCurrentLoopzId: (id) => set({ currentLoopzId: id }),
  setLoopzLoading: (loading) => set({ loopzLoading: loading }),
  setLoopzError: (error) => set({ loopzError: error }),

  // Task slice
  tasks: [],
  microsteps: [],
  taskLoading: false,
  taskError: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  toggleTaskCompletion: async (taskId) => {
    // Update local state immediately for responsive UI
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task,
      ),
    }));

    // Get the task and its current completion status
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Update in database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task completion:', error);
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, is_completed: !task.is_completed } : task,
        ),
        taskError: error instanceof Error ? error.message : 'Failed to update task',
      }));
    }
  },
  expandTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, is_expanded: !task.is_expanded } : task,
      ),
    })),
  setMicrosteps: (microsteps) => set({ microsteps }),
  addMicrosteps: (taskId, microstepsInput) => {
    // If microsteps are passed as strings, convert them to Microstep objects
    let newMicrosteps: Microstep[];

    if (typeof microstepsInput[0] === 'string') {
      // This case happens if we're called from the code rather than with DB objects
      // We'll convert them to proper Microstep objects - they'll get actual IDs when saved to DB
      newMicrosteps = (microstepsInput as string[]).map((title, index) => ({
        id: `temp-${Date.now()}-${index}`, // Temporary ID until DB insert
        task_id: taskId,
        title,
        is_completed: false,
        position: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else {
      // We already have Microstep objects (likely from the API response)
      newMicrosteps = microstepsInput as Microstep[];
    }

    set((state) => ({
      microsteps: [...state.microsteps, ...newMicrosteps],
    }));

    // Ensure the task is expanded to show the new microsteps
    const task = get().tasks.find((t) => t.id === taskId);
    if (task && !task.is_expanded) {
      get().expandTask(taskId);
    }
  },
  toggleMicrostepCompletion: async (microstepId) => {
    // Update local state immediately
    set((state) => ({
      microsteps: state.microsteps.map((ms) =>
        ms.id === microstepId ? { ...ms, is_completed: !ms.is_completed } : ms,
      ),
    }));

    // Get the microstep and its current completion status
    const microstep = get().microsteps.find((ms) => ms.id === microstepId);
    if (!microstep) return;

    // Update in database
    try {
      const { error } = await supabase
        .from('microsteps')
        .update({ is_completed: !microstep.is_completed })
        .eq('id', microstepId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating microstep completion:', error);
      // Revert on error
      set((state) => ({
        microsteps: state.microsteps.map((ms) =>
          ms.id === microstepId ? { ...ms, is_completed: !ms.is_completed } : ms,
        ),
        taskError: error instanceof Error ? error.message : 'Failed to update microstep',
      }));
    }
  },
  setTaskLoading: (loading) => set({ taskLoading: loading }),
  setTaskError: (error) => set({ taskError: error }),

  // Chat slice
  messages: [],
  loopzSuggestion: null,
  chatLoading: false,
  chatError: null,
  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          content,
          isAI: false,
          timestamp: new Date(),
        },
      ],
    })),
  addAIMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          content,
          isAI: true,
          timestamp: new Date(),
        },
      ],
    })),
  setLoopzSuggestion: (suggestion) => set({ loopzSuggestion: suggestion }),
  setChatLoading: (loading) => set({ chatLoading: loading }),
  setChatError: (error) => set({ chatError: error }),

  // UI slice
  isDashboardVisible: false,
  showLoopDetail: false,
  selectedLoopzId: null,
  isChatExpanded: false,
  theme: 'light',
  setDashboardVisible: (visible) => set({ isDashboardVisible: visible }),
  setShowLoopDetail: (visible) => set({ showLoopDetail: visible }),
  setSelectedLoopzId: (id) => set({ selectedLoopzId: id }),
  setChatExpanded: (expanded) => set({ isChatExpanded: expanded }),
  setTheme: (theme) => set({ theme }),
}));

// Helper functions for common operations integrated directly into the store
// to avoid re-render issues caused by useStore.getState() calls outside of components
export const useStore = create<StoreState>((set, get) => ({
  // Auth slice
  user: null,
  authLoading: false,
  authError: null,
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setAuthError: (error) => set({ authError: error }),

  // Loopz slice
  loopzList: [],
  currentLoopzId: null,
  loopzLoading: false,
  loopzError: null,
  setLoopzList: (loopzList) => set({ loopzList }),
  addLoopz: (loopz) => set((state) => ({ loopzList: [loopz, ...state.loopzList] })),
  updateLoopz: (updatedLoopz) =>
    set((state) => ({
      loopzList: state.loopzList.map((loopz) =>
        loopz.id === updatedLoopz.id ? { ...loopz, ...updatedLoopz } : loopz,
      ),
    })),
  setCurrentLoopzId: (id) => set({ currentLoopzId: id }),
  setLoopzLoading: (loading) => set({ loopzLoading: loading }),
  setLoopzError: (error) => set({ loopzError: error }),

  // Task slice
  tasks: [],
  microsteps: [],
  taskLoading: false,
  taskError: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  toggleTaskCompletion: async (taskId) => {
    // Update local state immediately for responsive UI
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task,
      ),
    }));

    // Get the task and its current completion status
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Update in database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task completion:', error);
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, is_completed: !task.is_completed } : task,
        ),
        taskError: error instanceof Error ? error.message : 'Failed to update task',
      }));
    }
  },
  expandTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, is_expanded: !task.is_expanded } : task,
      ),
    })),
  setMicrosteps: (microsteps) => set({ microsteps }),
  addMicrosteps: (taskId, microstepsInput) => {
    // If microsteps are passed as strings, convert them to Microstep objects
    let newMicrosteps: Microstep[];

    if (typeof microstepsInput[0] === 'string') {
      // This case happens if we're called from the code rather than with DB objects
      // We'll convert them to proper Microstep objects - they'll get actual IDs when saved to DB
      newMicrosteps = (microstepsInput as string[]).map((title, index) => ({
        id: `temp-${Date.now()}-${index}`, // Temporary ID until DB insert
        task_id: taskId,
        title,
        is_completed: false,
        position: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else {
      // We already have Microstep objects (likely from the API response)
      newMicrosteps = microstepsInput as Microstep[];
    }

    set((state) => ({
      microsteps: [...state.microsteps, ...newMicrosteps],
    }));

    // Ensure the task is expanded to show the new microsteps
    const task = get().tasks.find((t) => t.id === taskId);
    if (task && !task.is_expanded) {
      get().expandTask(taskId);
    }
  },
  toggleMicrostepCompletion: async (microstepId) => {
    // Update local state immediately
    set((state) => ({
      microsteps: state.microsteps.map((ms) =>
        ms.id === microstepId ? { ...ms, is_completed: !ms.is_completed } : ms,
      ),
    }));

    // Get the microstep and its current completion status
    const microstep = get().microsteps.find((ms) => ms.id === microstepId);
    if (!microstep) return;

    // Update in database
    try {
      const { error } = await supabase
        .from('microsteps')
        .update({ is_completed: !microstep.is_completed })
        .eq('id', microstepId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating microstep completion:', error);
      // Revert on error
      set((state) => ({
        microsteps: state.microsteps.map((ms) =>
          ms.id === microstepId ? { ...ms, is_completed: !ms.is_completed } : ms,
        ),
        taskError: error instanceof Error ? error.message : 'Failed to update microstep',
      }));
    }
  },
  setTaskLoading: (loading) => set({ taskLoading: loading }),
  setTaskError: (error) => set({ taskError: error }),

  // Chat slice
  messages: [],
  loopzSuggestion: null,
  chatLoading: false,
  chatError: null,
  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          content,
          isAI: false,
          timestamp: new Date(),
        },
      ],
    })),
  addAIMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          content,
          isAI: true,
          timestamp: new Date(),
        },
      ],
    })),
  setLoopzSuggestion: (suggestion) => set({ loopzSuggestion: suggestion }),
  setChatLoading: (loading) => set({ chatLoading: loading }),
  setChatError: (error) => set({ chatError: error }),

  // UI slice
  isDashboardVisible: false,
  showLoopDetail: false,
  selectedLoopzId: null,
  isChatExpanded: false,
  theme: 'light',
  setDashboardVisible: (visible) => set({ isDashboardVisible: visible }),
  setShowLoopDetail: (visible) => set({ showLoopDetail: visible }),
  setSelectedLoopzId: (id) => set({ selectedLoopzId: id }),
  setChatExpanded: (expanded) => set({ isChatExpanded: expanded }),
  setTheme: (theme) => set({ theme }),

  // Integrated helper functions
  loadUserData: async () => {
    set({ authLoading: true, loopzLoading: true });

    try {
      // Check if session exists and get user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ user: null, authLoading: false, loopzLoading: false });
        return;
      }

      set({ user: session.user });

      // Load user's loops
      const { data: loopzList, error: loopzError } = await supabase
        .from('loopz')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (loopzError) throw loopzError;
      set({ loopzList: loopzList || [] });
    } catch (error) {
      console.error('Error loading user data:', error);
      set({
        loopzError: error instanceof Error ? error.message : 'Failed to load data',
      });
    } finally {
      set({ authLoading: false, loopzLoading: false });
    }
  },

  loadLoopzTasks: async (loopzId: string) => {
    set({ taskLoading: true });

    try {
      // Load tasks for the loop
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('loopz_id', loopzId)
        .order('position', { ascending: true });

      if (tasksError) throw tasksError;

      // Add is_expanded UI property to each task (not stored in DB)
      const tasksWithUIState = (tasks || []).map((task) => ({
        ...task,
        is_expanded: false, // Default to collapsed
      }));

      set({ tasks: tasksWithUIState });

      // Load all microsteps for this loop's tasks
      if (tasksWithUIState.length > 0) {
        const { data: microsteps, error: microstepsError } = await supabase
          .from('microsteps')
          .select('*')
          .in(
            'task_id',
            tasksWithUIState.map((t) => t.id),
          )
          .order('position', { ascending: true });

        if (microstepsError) throw microstepsError;
        set({ microsteps: microsteps || [] });
      }
    } catch (error) {
      console.error('Error loading loop tasks:', error);
      set({
        taskError: error instanceof Error ? error.message : 'Failed to load tasks',
      });
    } finally {
      set({ taskLoading: false });
    }
  },
}));
