// app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SupabaseProvider from './components/SupabaseProvider';
import { DashboardProvider } from './components/DashboardContext';
import DashboardOverlay from './components/DashboardOverlay';
import Dashboard from './components/Dashboard';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Loopz – Untangle Your Mind',
  description: 'A mindfulness app to help you untangle your thoughts and find clarity.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = (await cookies()) as any;
  const supabaseServer = createServerComponentClient({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} relative overflow-hidden`}>
        <SupabaseProvider initialSession={session}>
          <DashboardProvider>
            {/* Base layer: LandingPage or other route content */}
            {children}
            {/* Overlay layers: always present, controlled by context/visibility */}
            <Dashboard />
            <DashboardOverlay />
          </DashboardProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
