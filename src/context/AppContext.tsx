'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Login } from '@/components/Login';
import {
  Transaction,
  Transfer,
  Settings,
  Milestone,
  getTransactions,
  saveTransaction,
  deleteTransaction as dbDeleteTransaction,
  getTransfers,
  saveTransfer,
  deleteTransfer as dbDeleteTransfer,
  getSettings,
  saveSettings,
  calculateStreak,
  getMilestones,
  checkAndSeedDatabase,
  getCurrencySymbol
} from '@/lib/db';

interface AppContextType {
  user: User | null;
  demoMode: boolean;
  transactions: Transaction[];
  transfers: Transfer[];
  settings: Settings;
  streak: number;
  milestones: Milestone[];
  currencySymbol: string;
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransfer: (t: Omit<Transfer, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  updateSettings: (s: Partial<Settings>) => void;
  refreshData: () => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user's transactions from Supabase
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txError) throw txError;

      // Fetch user's transfers from Supabase
      const { data: trs, error: trError } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (trError) throw trError;

      setTransactions((txs as Transaction[]) || []);
      setTransfers((trs as Transfer[]) || []);
    } catch (err) {
      console.error('Failed to load user data from Supabase:', err);
    }
  };

  const refreshData = () => {
    if (demoMode) {
      const txs = getTransactions();
      const trs = getTransfers();
      setTransactions(txs);
      setTransfers(trs);
    } else if (user) {
      fetchUserData(user.id);
    }
    const sets = getSettings();
    setSettings(sets);
  };

  useEffect(() => {
    // Check if env credentials are configured
    const hasCredentials = 
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasCredentials) {
      // Fallback to local storage demo mode
      setDemoMode(true);
      checkAndSeedDatabase();
      const txs = getTransactions();
      const trs = getTransfers();
      setTransactions(txs);
      setTransfers(trs);
      setIsLoading(false);
      return;
    }

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        setTransactions([]);
        setTransfers([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [demoMode]);

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }) => {
    if (demoMode || !user) {
      saveTransaction(t);
      refreshData();
      return;
    }

    setIsLoading(true);
    const savedAmount = t.reported_amount - t.actual_spend;
    const txData = {
      id: t.id || Math.random().toString(36).substring(2, 11),
      user_id: user.id,
      date: t.date,
      reported_amount: t.reported_amount,
      actual_spend: t.actual_spend,
      saved_amount: savedAmount,
      category: t.category,
      notes: t.notes || '',
    };

    try {
      const { error } = await supabase.from('transactions').upsert(txData);
      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (demoMode || !user) {
      dbDeleteTransaction(id);
      refreshData();
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransfer = async (t: Omit<Transfer, 'id' | 'created_at'> & { id?: string }) => {
    if (demoMode || !user) {
      saveTransfer(t);
      refreshData();
      return;
    }

    setIsLoading(true);
    const trData = {
      id: t.id || Math.random().toString(36).substring(2, 11),
      user_id: user.id,
      date: t.date,
      amount: t.amount,
      destination: t.destination,
      notes: t.notes || '',
    };

    try {
      const { error } = await supabase.from('transfers').upsert(trData);
      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (demoMode || !user) {
      dbDeleteTransfer(id);
      refreshData();
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('transfers').delete().eq('id', id);
      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to delete transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (s: Partial<Settings>) => {
    saveSettings(s);
    refreshData();
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setDemoMode(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute values
  const totalSaved = transactions.reduce((acc, t) => acc + t.saved_amount, 0);
  const streak = calculateStreak(transactions);
  const milestones = getMilestones(totalSaved);
  const currencySymbol = getCurrencySymbol(settings.currency);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-muted-text">
        <div className="animate-spin w-8 h-8 border-2 border-t-cream border-surface-border rounded-full mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Checking Session...</span>
      </div>
    );
  }

  if (!user && !demoMode) {
    return <Login onBypassDemo={() => setDemoMode(true)} />;
  }

  return (
    <AppContext.Provider
      value={{
        user,
        demoMode,
        transactions,
        transfers,
        settings,
        streak,
        milestones,
        currencySymbol,
        isLoading,
        addTransaction: handleAddTransaction,
        deleteTransaction: handleDeleteTransaction,
        addTransfer: handleAddTransfer,
        deleteTransfer: handleDeleteTransfer,
        updateSettings: handleUpdateSettings,
        refreshData,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
