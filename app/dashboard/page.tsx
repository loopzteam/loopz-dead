'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';
import DashboardRefactored from '../components/DashboardRefactored';
import { useStore, loadUserData } from '../store';
import { DashboardProvider } from '../components/DashboardContext';

// Set this to true to use the refactored dashboard
const USE_REFACTORED = false;

export default function DashboardPage() {
  const router = useRouter();
  const { user, authLoading, setDashboardVisible } = useStore(state => ({
    user: state.user,
    authLoading: state.authLoading,
    setDashboardVisible: state.setDashboardVisible
  }));
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
    
    // Show dashboard on load
    setDashboardVisible(true);
  }, []);
  
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