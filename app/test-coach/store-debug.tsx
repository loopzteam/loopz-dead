'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../store';

/**
 * Component to display store state for debugging
 */
export default function StoreDebug() {
  const { loopzList, tasks, currentLoopzId } = useStore(state => ({
    loopzList: state.loopzList,
    tasks: state.tasks,
    currentLoopzId: state.currentLoopzId
  }));
  
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Force refresh every 2 seconds to keep data updated
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Find current loop
  const currentLoop = loopzList.find(loop => loop.id === currentLoopzId);
  const currentLoopTasks = tasks.filter(task => currentLoopzId && task.loopz_id === currentLoopzId);
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Store State Monitor</h3>
        <div className="text-xs text-gray-500">Refresh: {refreshCounter}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Loops ({loopzList.length})</h4>
          {loopzList.length === 0 ? (
            <div className="text-orange-500">No loops in store</div>
          ) : (
            <ul className="list-disc pl-4">
              {loopzList.map(loop => (
                <li key={loop.id} className={currentLoopzId === loop.id ? 'font-bold' : ''}>
                  {loop.title} ({loop.id.slice(0, 6)}...)
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h4 className="font-semibold">
            {currentLoop ? `Tasks for "${currentLoop.title}" (${currentLoopTasks.length})` : 'No current loop'}
          </h4>
          {currentLoopTasks.length === 0 ? (
            <div className="text-orange-500">No tasks for current loop</div>
          ) : (
            <ul className="list-disc pl-4">
              {currentLoopTasks.map(task => (
                <li key={task.id}>
                  {task.title} {task.is_completed ? '✓' : '○'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        This component auto-refreshes every 2 seconds
      </div>
    </div>
  );
}