'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        router.push('/');
        return;
      }
      
      if (!session) {
        router.push('/');
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    }
    
    getUser();
  }, [router]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl px-4 py-12 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-8 bg-white rounded-lg shadow-md"
        >
          <h1 className="mb-6 text-3xl font-bold">Welcome to Loopz</h1>
          
          <p className="mb-4 text-gray-600">
            Hello, {user?.email}! You've successfully logged in.
          </p>
          
          <p className="mb-8 text-lg">
            This is your personal dashboard. Here you can manage your mindfulness journey and track your progress.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="px-6 py-2 text-white bg-black rounded-full hover:bg-gray-800"
          >
            Sign Out
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 