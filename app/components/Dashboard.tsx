'use client';

import { motion } from 'framer-motion';
import { useSupabase } from './SupabaseProvider'; // Assuming SupabaseProvider is in the same directory
import { useDashboard } from './DashboardContext'; // Import useDashboard

export default function Dashboard() {
  const { session, loading, supabase } = useSupabase(); // Get session, loading state, and supabase client
  const { isDashboardVisible } = useDashboard(); // Get visibility state from context

  const dashboardVariants = {
    hidden: { x: '-100%' }, // Start off-screen to the left
    visible: { x: '0%' },   // Slide in to occupy the screen from the left
    exit: { x: '-100%' }    // Slide out to the left
  };

  const transition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.5
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Optionally show an error message to the user
    }
    // No need to manually setDashboardVisible(false), 
    // the onAuthStateChange listener will handle it.
  };

  // Don't render anything until loading is complete OR if there's no session
  if (loading || !session) { 
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 w-[85%] h-full bg-white shadow-lg z-10" // Changed right-0 to left-0
      variants={dashboardVariants}
      initial="hidden"
      animate={isDashboardVisible ? "visible" : "hidden"} // Animate based on context state
      transition={{
        type: 'tween',
        ease: 'easeInOut',
        duration: 0.5,
        delay: 0.3 // Keep the delay
      }}
    >
      {/* Dashboard content container with relative positioning */}
      <div className="relative h-full p-8">
        {/* Sign Out Button */} 
        <button 
          onClick={handleSignOut}
          className="absolute top-4 right-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Sign Out
        </button>

        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome back!</p>
        {/* Add your dashboard components */}
      </div>
    </motion.div>
  );
} 