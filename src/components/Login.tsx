'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PiggyBank, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
  onBypassDemo?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBypassDemo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if credentials are set
  const hasCredentials = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const handleGoogleLogin = async () => {
    if (!hasCredentials) {
      setError('Supabase environment variables are missing. Please configure them in .env.local or Vercel Settings.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during Google sign-in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cream/5 rounded-full blur-[120px] pointer-events-none" />

      {/* SVG Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card p-8 md:p-10 rounded-3xl border border-surface-border max-w-md w-full text-center space-y-6 shadow-2xl relative"
      >
        {/* App Logo */}
        <div className="mx-auto w-14 h-14 bg-cream/5 border border-cream/15 rounded-2xl flex items-center justify-center text-cream relative">
          <PiggyBank className="w-7 h-7" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-cream animate-pulse" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-cream font-sans">Welcome to ShadowSave</h2>
          <p className="text-xs text-muted-text leading-relaxed">
            A premium personal finance companion. Compare your reported budgets versus actual spend to optimize saving habits.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-start gap-2.5 text-left text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Sign In Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-foreground hover:bg-cream hover:text-background text-background font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-xs disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>Sign In with Google</span>
          </button>

          {/* Local storage bypass if config is missing */}
          {!hasCredentials && onBypassDemo && (
            <button
              onClick={onBypassDemo}
              className="w-full py-2.5 text-xs text-cream hover:underline font-semibold cursor-pointer"
            >
              Continue in Demo Mode (Local Storage Only)
            </button>
          )}
        </div>

        {/* Small warning about the required tables */}
        {hasCredentials && (
          <p className="text-[10px] text-muted-text/60">
            Secure authentication handled by Supabase. Your financial ledger is encrypted and isolated to your profile.
          </p>
        )}
      </motion.div>
    </div>
  );
};
