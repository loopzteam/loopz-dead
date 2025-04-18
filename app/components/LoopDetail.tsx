'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from './SupabaseProvider';

interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  order: number;
}

interface Loop {
  id: string;
  title: string;
  created_at: string;
  tasks?: Task[];
}

interface LoopDetailProps {
  loopId: string;
  onClose: () => void;
}

export default function LoopDetail({ loopId, onClose }: LoopDetailProps) {
  const { supabase } = useSupabase();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  // Fetch loop and tasks
  useEffect(() => {
    const fetchLoopData = async () => {
      setLoading(true);
      
      try {
        // Fetch loop details
        const { data: loopData, error: loopError } = await supabase
          .from('loops')
          .select('*')
          .eq('id', loopId)
          .single();
        
        if (loopError) throw loopError;
        
        // Fetch loop tasks
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('loop_id', loopId)
          .order('order', { ascending: true });
        
        if (taskError) throw taskError;
        
        setLoop(loopData);
        setTasks(taskData || []);
      } catch (error) {
        console.error('Error fetching loop data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (loopId) {
      fetchLoopData();
    }
  }, [loopId, supabase]);
  
  // Add a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !loopId) return;
    
    const newTaskItem: Omit<Task, 'id'> = {
      content: newTask.trim(),
      is_completed: false,
      order: tasks.length,
    };
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTaskItem, loop_id: loopId }])
        .select()
        .single();
      
      if (error) throw error;
      
      setTasks([...tasks, data]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  
  // Toggle task completion
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, is_completed: !currentStatus } 
          : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-black border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loop...</p>
        </div>
      </div>
    );
  }
  
  if (!loop) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">Error: Could not find loop</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="fixed inset-0 bg-white z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{loop.title}</h1>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Tasks</h2>
          
          {tasks.length === 0 ? (
            <p className="text-gray-500 italic">No tasks yet. Add one below.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map(task => (
                <li 
                  key={task.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                >
                  <input 
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => handleToggleTask(task.id, task.is_completed)}
                    className="h-5 w-5 mr-3 border-gray-300 rounded"
                  />
                  <span className={`flex-1 ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                    {task.content}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Add task form */}
        <form onSubmit={handleAddTask} className="mt-4">
          <div className="flex">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="px-4 py-2 bg-black text-white rounded-r-lg disabled:bg-gray-300"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 