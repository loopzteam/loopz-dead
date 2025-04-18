'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useDashboard } from './DashboardContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  order_num: number;
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
  const { setDashboardVisible } = useDashboard();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskContent, setEditedTaskContent] = useState('');
  
  // Long press handling
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  // Fetch loop and tasks
  useEffect(() => {
    const fetchLoopData = async () => {
      setLoading(true);
      console.log('LoopDetail: Fetching data for loop ID:', loopId);
      
      try {
        // Fetch loop details
        const { data: loopData, error: loopError } = await supabase
          .from('loopz')
          .select('*')
          .eq('id', loopId)
          .single();
        
        if (loopError) {
          console.error('LoopDetail: Error fetching loop:', loopError);
          throw loopError;
        }
        
        console.log('LoopDetail: Loop data fetched:', loopData);
        setEditedTitle(loopData.title);
        
        // Fetch loop tasks
        const { data: taskData, error: taskError } = await supabase
          .from('steps')
          .select('*')
          .eq('loopz_id', loopId)
          .order('order_num', { ascending: true });
        
        if (taskError) {
          console.error('LoopDetail: Error fetching tasks:', taskError);
          throw taskError;
        }
        
        console.log('LoopDetail: Tasks fetched:', taskData);
        
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

  // Set up real-time subscription for tasks
  useEffect(() => {
    if (!loopId) return;
    
    console.log('Setting up real-time subscription for loopId:', loopId);
    
    const channelName = `steps-channel-${loopId}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'steps',
          filter: `loopz_id=eq.${loopId}`
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            console.log('INSERT event received:', payload.new);
            setTasks(current => [...current, payload.new as Task]);
          } 
          else if (payload.eventType === 'UPDATE') {
            console.log('UPDATE event received:', payload.new);
            setTasks(current => 
              current.map(task => 
                task.id === payload.new.id ? {...task, ...payload.new} : task
              )
            );
          } 
          else if (payload.eventType === 'DELETE') {
            console.log('DELETE event received:', payload.old);
            setTasks(current => 
              current.filter(task => task.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });
    
    console.log(`Real-time subscription ${channelName} set up for steps table`);
    
    // Clean up subscription when component unmounts
    return () => {
      console.log(`Cleaning up real-time subscription ${channelName}`);
      supabase.removeChannel(subscription);
    };
  }, [loopId, supabase]);
  
  // Focus input when adding a new task
  useEffect(() => {
    if (isAddingTask && newTaskInputRef.current) {
      newTaskInputRef.current.focus();
    }
  }, [isAddingTask]);
  
  // Long press handlers for editing
  const handleTitleLongPress = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setEditingTitle(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }, 500); // 500ms for long press
  };
  
  const handleTaskLongPress = (taskId: string, content: string) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setEditingTaskId(taskId);
      setEditedTaskContent(content);
      setTimeout(() => {
        taskInputRef.current?.focus();
      }, 50);
    }, 500); // 500ms for long press
  };
  
  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };
  
  // Update loop title
  const handleUpdateTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editedTitle.trim() || !loop) return;
    
    try {
      const { error } = await supabase
        .from('loopz')
        .update({ title: editedTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', loop.id);
      
      if (error) throw error;
      
      setLoop({ ...loop, title: editedTitle.trim() });
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating loop title:', error);
    }
  };
  
  // Update task content
  const handleUpdateTaskContent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editedTaskContent.trim() || !editingTaskId) return;
    
    try {
      const { error } = await supabase
        .from('steps')
        .update({ content: editedTaskContent.trim() })
        .eq('id', editingTaskId);
      
      if (error) throw error;
      
      // Local state update will be handled by real-time subscription
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task content:', error);
    }
  };
  
  // Add a new task - with optimistic UI update
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !loopId) return;
    
    setIsAddingTask(true);
    
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTaskItem: Task = {
      id: tempId,
      content: newTask.trim(),
      is_completed: false,
      order_num: tasks.length,
    };
    
    try {
      // Optimistic UI update - add to UI immediately
      setTasks(current => [...current, newTaskItem]);
      setNewTask('');
      
      // Then add to the database
      const { data, error } = await supabase
        .from('steps')
        .insert([{ 
          content: newTaskItem.content, 
          is_completed: newTaskItem.is_completed, 
          order_num: newTaskItem.order_num,
          loopz_id: loopId 
        }])
        .select();
      
      if (error) throw error;
      
      console.log('Task added successfully:', data);
      
      // Real-time subscription should handle the permanent update
    } catch (error) {
      console.error('Error adding task:', error);
      // If there was an error, remove the temporary task
      setTasks(current => current.filter(task => task.id !== tempId));
    } finally {
      setIsAddingTask(false);
    }
  };
  
  // Toggle task completion
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('steps')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Real-time subscription will handle the state update
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };
  
  // Delete task - with optimistic UI update
  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task ID:', taskId);
      
      // Store the task before deleting it in case we need to restore
      const taskToDelete = tasks.find(task => task.id === taskId);
      
      // Optimistic UI update - remove from UI immediately
      setTasks(current => current.filter(task => task.id !== taskId));
      
      // Then delete from the database
      const { error } = await supabase
        .from('steps')
        .delete()
        .eq('id', taskId);
      
      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
      
      console.log('Task deleted successfully');
      // Real-time subscription will serve as backup
    } catch (error) {
      console.error('Error deleting task:', error);
      // If there was an error, refetch the tasks to restore correct state
      if (loopId) {
        const { data } = await supabase
          .from('steps')
          .select('*')
          .eq('loopz_id', loopId)
          .order('order_num', { ascending: true });
        
        setTasks(data || []);
      }
    }
  };
  
  // Show dashboard by sliding it in from the left
  const handleShowDashboard = () => {
    // Toggle dashboard visibility
    setDashboardVisible(true);
    
    // Log for debugging
    console.log('Dashboard visibility set to true. The dashboard should slide in from the left.');
  };
  
  // Helper function to get z-index styling
  const getZIndex = () => {
    return { zIndex: 25 }; // Ensure all loop elements are below the overlay (z-35)
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-black border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loop...</p>
        </div>
      </div>
    );
  }
  
  if (!loop) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <div className="flex items-center flex-1">
          <button
            onClick={handleShowDashboard}
            className="p-2 mr-3 hover:bg-gray-100 rounded-full"
            aria-label="Show Dashboard"
            style={getZIndex()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {editingTitle ? (
            <form onSubmit={handleUpdateTitle} className="flex-1" style={getZIndex()}>
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                className="px-2 py-1 w-full text-xl font-semibold border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                autoFocus
              />
            </form>
          ) : (
            <h1 
              className="text-xl font-semibold cursor-pointer"
              onTouchStart={handleTitleLongPress}
              onTouchEnd={clearLongPressTimeout}
              onMouseDown={handleTitleLongPress}
              onMouseUp={clearLongPressTimeout}
              onMouseLeave={clearLongPressTimeout}
              style={getZIndex()}
            >
              {loop.title}
            </h1>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4" style={getZIndex()}>
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
                  style={getZIndex()}
                >
                  <input 
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => handleToggleTask(task.id, task.is_completed)}
                    className="h-5 w-5 mr-3 border-gray-300 rounded"
                  />
                  
                  {editingTaskId === task.id ? (
                    <form onSubmit={handleUpdateTaskContent} className="flex-1 flex">
                      <input
                        ref={taskInputRef}
                        type="text"
                        value={editedTaskContent}
                        onChange={(e) => setEditedTaskContent(e.target.value)}
                        onBlur={handleUpdateTaskContent}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span 
                      className={`flex-1 ${task.is_completed ? 'line-through text-gray-400' : ''}`}
                      onTouchStart={() => handleTaskLongPress(task.id, task.content)}
                      onTouchEnd={clearLongPressTimeout}
                      onMouseDown={() => handleTaskLongPress(task.id, task.content)}
                      onMouseUp={clearLongPressTimeout}
                      onMouseLeave={clearLongPressTimeout}
                    >
                      {task.content}
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded"
                    aria-label="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Add task form */}
        <form onSubmit={handleAddTask} className="mt-4" style={getZIndex()}>
          <div className="flex relative">
            <input
              ref={newTaskInputRef}
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isAddingTask}
            />
            <button
              type="submit"
              disabled={!newTask.trim() || isAddingTask}
              className="px-4 py-2 bg-black text-white rounded-r-lg disabled:bg-gray-300 relative"
            >
              {isAddingTask ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              ) : (
                'Add'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 