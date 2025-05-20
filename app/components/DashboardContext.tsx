'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseProvider';

type DashboardContextType = {
  isDashboardVisible: boolean;
  setDashboardVisible: (visible: boolean) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useSupabase(); // Also get loading state
  const [isDashboardVisible, setDashboardVisible] = useState(false);

  // When session or loading state changes, update dashboard visibility
  useEffect(() => {
    // Only change visibility once loading is complete
    if (!loading) {
      if (session) {
        setDashboardVisible(true); // Show dashboard if logged in
      } else {
        setDashboardVisible(false); // Hide dashboard if logged out
      }
    }
  }, [session, loading]); // Depend on session and loading

  return (
    <DashboardContext.Provider value={{ isDashboardVisible, setDashboardVisible }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
