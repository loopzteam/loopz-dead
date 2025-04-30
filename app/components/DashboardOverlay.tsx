'use client';

import { useSupabase } from './SupabaseProvider';
import { useDashboard } from './DashboardContext';

export default function DashboardOverlay() {
  const { session, loading } = useSupabase(); // Get session and loading states
  const { isDashboardVisible, setDashboardVisible } = useDashboard();
  
  // Only render if loading is done, user is logged in, and dashboard is currently visible
  if (loading || !session || !isDashboardVisible) {
    return null;
  }
  
  return (
    <div 
      className="fixed top-0 right-0 w-[15%] h-full z-40 cursor-pointer bg-transparent"
      onClick={() => setDashboardVisible(false)}
      title="Click to hide dashboard"
      aria-label="Hide dashboard panel"
    />
  );
} 