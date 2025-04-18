'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'; // Removed usePathname

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean; // Add loading state
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false); // Set loading to false after session is fetched
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false); // Also update loading state on change
      // Redirect logic might still be relevant here
      // Example:
      // if (!session && someCondition) { router.push('/'); }
      // if (session && someCondition) { router.push('/dashboard'); }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]); // Removed pathname from dependency array

  return (
    <Context.Provider value={{ supabase, session, loading }}>
      {/* Removed AnimatePresence and motion.div wrapper */} 
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 