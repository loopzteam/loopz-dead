'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store';
import { Task, Microstep } from '../../types';
import { MotionDiv } from '../../lib/motion';
import { shallow } from 'zustand/shallow';

interface TaskListProps {
  loopzId: string;
}

export default function TaskList({ loopzId }: TaskListProps) {
  // Local state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Select basic state values individually to avoid unnecessary re-renders
  const allTasks = useStore((state) => state.tasks || []);
  const allMicrosteps = useStore((state) => state.microsteps || []);
  const taskLoading = useStore((state) => state.taskLoading);
  const taskError = useStore((state) => state.taskError);

  // Memoize filtered tasks list by loopzId
  const tasks = useMemo(() => {
    return Array.isArray(allTasks)
      ? allTasks.filter((task: Task) => task && task.loopz_id === loopzId)
      : [];
  }, [allTasks, loopzId]);

  // Memoize microsteps
  const microsteps = useMemo(() => {
    return allMicrosteps;
  }, [allMicrosteps]);

  // Select action functions with shallow comparison to maintain stable references
  const { toggleTaskCompletion, toggleMicrostepCompletion, expandTask } = useStore(
    (state) => ({
      toggleTaskCompletion: state.toggleTaskCompletion || (() => {}),
      toggleMicrostepCompletion: state.toggleMicrostepCompletion || (() => {}),
      expandTask: state.expandTask || (() => {}),
    }),
    shallow,
  );

  // Use the actual function from store directly
  const loadLoopzTasksFromStore = useStore((state) => state.loadLoopzTasks);

  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.is_completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get microsteps for a task - memoized
  const getTaskMicrosteps = useCallback(
    (taskId: string): Microstep[] => {
      return microsteps
        .filter((ms) => ms.task_id === taskId)
        .sort((a, b) => a.position - b.position);
    },
    [microsteps],
  );

  // Handle task click - selects the task - memoized
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  // Handle expand click - shows/hides microsteps - memoized
  const handleExpandClick = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent task selection
      expandTask(taskId);
    },
    [expandTask],
  );

  // Toggle task completion - memoized
  const handleToggleTask = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent task selection
      toggleTaskCompletion(taskId);
    },
    [toggleTaskCompletion],
  );

  // Toggle microstep completion - memoized
  const handleToggleMicrostep = useCallback(
    (microstepId: string) => {
      toggleMicrostepCompletion(microstepId);
    },
    [toggleMicrostepCompletion],
  );

  // Fetch tasks when the component mounts or loopzId changes
  useEffect(() => {
    if (loopzId && loadLoopzTasksFromStore) {
      loadLoopzTasksFromStore(loopzId);
    }
  }, [loopzId, loadLoopzTasksFromStore]);

  if (taskLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-8 h-8 border-2 border-t-transparent border-black rounded-full animate-spin" />
      </div>
    );
  }

  if (taskError) {
    return <div className="p-4 text-red-500">Error loading tasks: {taskError}</div>;
  }

  if (tasks.length === 0) {
    return <div className="p-6 text-center text-gray-500">No tasks found for this loop.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <MotionDiv
            className="bg-black h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Task list */}
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="border rounded-lg overflow-hidden">
            {/* Task header */}
            <div
              className={`flex items-center p-3 cursor-pointer ${
                selectedTaskId === task.id ? 'bg-gray-50' : 'bg-white'
              } ${task.is_completed ? 'text-gray-500' : ''}`}
              onClick={() => handleTaskClick(task.id)}
            >
              <div
                className={`mr-3 w-5 h-5 rounded-full border flex items-center justify-center ${
                  task.is_completed ? 'bg-black border-black text-white' : 'border-gray-300'
                }`}
                onClick={(e) => handleToggleTask(task.id, e)}
              >
                {task.is_completed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className={`flex-grow ${task.is_completed ? 'line-through' : ''}`}>
                {task.title}
              </span>
              <button
                onClick={(e) => handleExpandClick(task.id, e)}
                className="ml-2 p-1 text-gray-400 hover:text-black rounded"
              >
                {task.is_expanded ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Microsteps (if expanded) */}
            {task.is_expanded && (
              <div className="bg-gray-50 border-t px-3 py-2">
                <ul className="space-y-2 pl-6">
                  {getTaskMicrosteps(task.id).map((microstep) => (
                    <li key={microstep.id} className="flex items-center">
                      <div
                        className={`mr-3 w-4 h-4 rounded-full border flex items-center justify-center ${
                          microstep.is_completed
                            ? 'bg-black border-black text-white'
                            : 'border-gray-300'
                        }`}
                        onClick={() => handleToggleMicrostep(microstep.id)}
                      >
                        {microstep.is_completed && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-2 w-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={microstep.is_completed ? 'line-through text-gray-500' : ''}>
                        {microstep.title}
                      </span>
                    </li>
                  ))}
                  {getTaskMicrosteps(task.id).length === 0 && (
                    <li className="text-sm text-gray-500 italic">
                      No steps yet. Break down this task for easier progress.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
