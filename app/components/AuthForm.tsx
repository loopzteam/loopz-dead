'use client';

import { useState } from 'react';
import { MotionDiv, MotionForm, MotionButton } from '../lib/motion';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';

type AuthMode = 'signin' | 'signup';

const AuthForm = () => {
  const router = useRouter();
  const { session, supabase } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Switch between sign in and sign up forms
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(null);
  };

  // Handle sign in with Supabase
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSuccess('Sign in successful!');
      // Redirect or update UI after successful sign in
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up with Supabase
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccess('Sign up successful! Please check your email for verification.');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in with social providers
  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // The redirect happens automatically, no need to handle here
    } catch (err: any) {
      setError(err.message || `An error occurred during ${provider} sign in`);
      console.error(`${provider} sign in error:`, err);
      setLoading(false);
    }
  };

  // Don't render the auth form at all if signed in
  if (session) {
    return null;
  }

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white rounded-lg shadow-none"
    >
      {error && (
        <MotionDiv
          className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </MotionDiv>
      )}

      {success && (
        <MotionDiv
          className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {success}
        </MotionDiv>
      )}

      <MotionForm
        onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
        className="space-y-4"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <MotionDiv variants={itemVariants}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
            disabled={loading}
          />
        </MotionDiv>

        <MotionDiv variants={itemVariants}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
            disabled={loading}
          />
        </MotionDiv>

        <MotionButton
          type="submit"
          className={`w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
          }`}
          disabled={loading}
          variants={itemVariants}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Sign Up'
          )}
        </MotionButton>
      </MotionForm>

      <MotionDiv
        className="mt-6 text-center"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-gray-600">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={toggleMode}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </MotionDiv>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300"></div>
        <p className="px-3 text-sm text-gray-500">or</p>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <div className="space-y-3">
        <MotionButton
          className="w-full px-4 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,0,0,0.02)' }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSocialSignIn('apple')}
          disabled={loading}
        >
          Continue with Apple
        </MotionButton>

        <MotionButton
          className="w-full px-4 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,0,0,0.02)' }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSocialSignIn('google')}
          disabled={loading}
        >
          Continue with Google
        </MotionButton>
      </div>
    </MotionDiv>
  );
};

export default AuthForm;
