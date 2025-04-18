import SupabaseProvider from './components/SupabaseProvider';
import { DashboardProvider } from './components/DashboardContext';
import Dashboard from './components/Dashboard';
import DashboardOverlay from './components/DashboardOverlay';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Loopz - Untangle Your Mind',
  description: 'A mindfulness app to help you untangle your thoughts and find clarity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative overflow-hidden`}>
        <SupabaseProvider>
          <DashboardProvider>
            {children}
            <Dashboard />
            <DashboardOverlay />
          </DashboardProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
