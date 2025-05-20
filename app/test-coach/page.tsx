'use client';

import { useState, useEffect } from 'react';
import { HeadCoach } from '../components/coach';
import { useStore, loadUserData } from '../store';
import { useSupabase } from '../components/SupabaseProvider';
import { User } from '@supabase/supabase-js';
import { Loopz, Task } from '../types';
import StoreDebug from './store-debug';

export default function TestCoachPage() {
  const { session } = useSupabase();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const loopzList = useStore((state) => state.loopzList);
  const tasks = useStore((state) => state.tasks);
  const currentLoopzId = useStore((state) => state.currentLoopzId);

  const [debugInfo, setDebugInfo] = useState<{
    apiCallStarted?: boolean;
    apiResponse?: any;
    error?: string;
  }>({});

  // Monitor store changes for testing
  useEffect(() => {
    if (currentLoopzId) {
      const currentLoop = loopzList.find((loop) => loop.id === currentLoopzId);
      if (currentLoop) {
        setDebugInfo((prev) => ({
          ...prev,
          apiResponse: {
            loop: currentLoop,
            tasks: tasks.filter((task) => task.loopz_id === currentLoopzId),
          },
        }));

        // Log success for debugging
        console.log('STATE UPDATE: Loop created and loaded in state', {
          loop: currentLoop,
          tasksCount: tasks.filter((task) => task.loopz_id === currentLoopzId).length,
        });
      }
    }
  }, [currentLoopzId, loopzList, tasks]);

  // Initialize store with session data
  useEffect(() => {
    if (session?.user && !user) {
      setUser(session.user as User);
      loadUserData(); // Load user's loops and data
    }
  }, [session, user, setUser]);

  // Add global error handler to catch OpenAI or other API errors
  useEffect(() => {
    const originalConsoleError = console.error;

    console.error = (...args) => {
      setDebugInfo((prev) => ({
        ...prev,
        error: typeof args[0] === 'string' ? args[0] : 'Error occurred. Check browser console.',
      }));
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Hook into fetch for API monitoring
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.includes('/api/create-loopz-from-thread')) {
        setDebugInfo((prev) => ({
          ...prev,
          apiCallStarted: true,
          error: null, // Clear any previous errors
        }));
        console.log('Starting API call to create-loopz-from-thread');
      }

      try {
        const response = await originalFetch(input, init);

        // Intercept and log API responses for debugging
        if (url.includes('/api/create-loopz-from-thread')) {
          // Clone the response so we can read it and still return the original
          const responseClone = response.clone();

          try {
            const data = await responseClone.json();

            // Check for API error responses
            if (!response.ok) {
              console.error('API error:', data);
              setDebugInfo((prev) => ({
                ...prev,
                error: data.error || `API error: ${response.status} ${response.statusText}`,
                errorDetails: data.details || data.message || null,
              }));
            } else {
              console.log('API call successful:', data);
            }
          } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
          }
        }

        return response;
      } catch (error) {
        if (url.includes('/api/create-loopz-from-thread')) {
          console.error('API call failed with exception:', error);
          setDebugInfo((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : 'API call failed',
            errorDetails: error instanceof Error ? error.stack : null,
          }));
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div className="container mx-auto p-4 h-screen overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Test HeadCoach Component</h1>

      {!session ? (
        <div className="p-4 bg-yellow-100 rounded-lg text-yellow-800 mb-4">
          Please sign in to test the HeadCoach component. It requires authentication.
        </div>
      ) : !user ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4">
          {/* HeadCoach Component */}
          <div className="border rounded-lg shadow-sm flex-1 overflow-hidden">
            <HeadCoach />
          </div>

          {/* Debug Panel */}
          <div className="border rounded-lg shadow-sm p-4 w-full md:w-96 overflow-auto bg-gray-50">
            <h2 className="text-lg font-bold mb-2">Debug Panel</h2>

            <div className="mb-4">
              <h3 className="font-semibold">Auth Status:</h3>
              <div className="bg-white p-2 rounded text-sm">
                {user ? (
                  <div>
                    <div>✅ Authenticated</div>
                    <div>ID: {user.id.slice(0, 8)}...</div>
                    <div>Email: {user.email}</div>
                  </div>
                ) : (
                  <div>❌ Not authenticated</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">API Status:</h3>
              <div className="bg-white p-2 rounded text-sm">
                {debugInfo.apiCallStarted ? (
                  <div>✅ API call initiated</div>
                ) : (
                  <div>⏱️ Waiting for API call...</div>
                )}
              </div>
            </div>

            {debugInfo.error && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-600">Error:</h3>
                <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-800">
                  <div className="font-medium">{debugInfo.error}</div>
                  {debugInfo.errorDetails && (
                    <div className="mt-1 text-xs overflow-auto max-h-32">
                      <details>
                        <summary>Error Details</summary>
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {typeof debugInfo.errorDetails === 'string'
                            ? debugInfo.errorDetails
                            : JSON.stringify(debugInfo.errorDetails, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

            {debugInfo.apiResponse && (
              <div className="mb-4">
                <h3 className="font-semibold text-green-600">API Response:</h3>
                <div className="bg-green-50 border border-green-200 p-2 rounded text-sm">
                  <div className="mb-2">
                    <strong>Loop:</strong> {debugInfo.apiResponse.loop?.title || 'No loop title'}
                  </div>
                  <div className="mb-2">
                    <strong>Loop ID:</strong> {debugInfo.apiResponse.loop?.id || 'No loop ID'}
                  </div>
                  <div>
                    <strong>Tasks ({debugInfo.apiResponse.tasks?.length || 0}):</strong>
                    {debugInfo.apiResponse.tasks?.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1">
                        {debugInfo.apiResponse.tasks.map((task: Task) => (
                          <li key={task.id}>{task.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="pl-5 mt-1 text-orange-500">No tasks found</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Store State Debug */}
            <div className="mb-4">
              <h3 className="font-semibold text-blue-600">Store State:</h3>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-sm">
                <div>
                  <strong>User:</strong> {user ? `${user.id.slice(0, 8)}...` : 'Not set'}
                </div>
                <div>
                  <strong>Current Loop ID:</strong> {currentLoopzId || 'Not set'}
                </div>
                <div>
                  <strong>Loops in Store:</strong> {loopzList.length}
                </div>
                <div>
                  <strong>Tasks in Store:</strong> {tasks.length}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Testing Instructions:</h3>
              <ol className="list-decimal pl-5 text-sm space-y-1">
                <li>Enter a reflection or thought in the input field</li>
                <li>Submit your message to create a loop</li>
                <li>Check this debug panel for API results</li>
                <li>Verify tasks are created and shown</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
