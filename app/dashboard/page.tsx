'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';
import DashboardRefactored from '../components/DashboardRefactored';
import { useStore } from '../store';
import { DashboardProvider } from '../components/DashboardContext';
import { shallow } from 'zustand/shallow';

// Set this to true to use the refactored dashboard
const USE_REFACTORED = false;

export default function DashboardPage() {
  const router = useRouter();

  // Use individual selectors for better performance
  const user = useStore((state) => state.user);
  const authLoading = useStore((state) => state.authLoading);

  // Get stable references to actions and helper functions
  const { setDashboardVisible, loadUserData } = useStore(
    (state) => ({
      setDashboardVisible: state.setDashboardVisible,
      loadUserData: state.loadUserData,
    }),
    shallow,
  );

  // Load user data on mount
  useEffect(() => {
    // Use the function from store directly, avoiding useStore.getState()
    loadUserData();

    // Show dashboard on load
    setDashboardVisible(true);
  }, [loadUserData, setDashboardVisible]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-2 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardProvider>
      {USE_REFACTORED ? <DashboardRefactored /> : <Dashboard />}
    </DashboardProvider>
  );
}
