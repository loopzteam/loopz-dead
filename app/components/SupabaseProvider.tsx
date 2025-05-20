'use client';

import { useState } from 'react';
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient as _useSupabaseClient,
} from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';

export default function SupabaseProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}

export function useSupabase() {
  const supabase = _useSupabaseClient();
  const session = useSession();
  const loading = session === undefined;
  return { supabase, session, loading };
}
