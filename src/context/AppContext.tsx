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
  getTransfers,
  getSettings,
  saveSettings,
  calculateStreak,
  getMilestones,
  getCurrencySymbol
} from '@/lib/db';

interface AppContextType {
  user: User | null;
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

  dbError: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isLoading, setIsLoading] = useState(true);


  const [dbError, setDbError] = useState<string>('');

  const CACHE_KEY_TX = (uid: string) => `ss_cache_tx_${uid}`;
  const CACHE_KEY_TR = (uid: string) => `ss_cache_tr_${uid}`;

  const loadFromCache = (userId: string) => {
    try {
      const rawTx = localStorage.getItem(CACHE_KEY_TX(userId));
      const rawTr = localStorage.getItem(CACHE_KEY_TR(userId));
      if (rawTx) setTransactions(JSON.parse(rawTx) as Transaction[]);
      if (rawTr) setTransfers(JSON.parse(rawTr) as Transfer[]);
    } catch { /* ignore parse errors */ }
  };

  const saveToCache = (userId: string, txs: Transaction[], trs: Transfer[]) => {
    try {
      if (txs.length > 0) localStorage.setItem(CACHE_KEY_TX(userId), JSON.stringify(txs));
      if (trs.length > 0) localStorage.setItem(CACHE_KEY_TR(userId), JSON.stringify(trs));
    } catch { /* ignore storage errors */ }
  };

  const clearCache = (userId: string) => {
    localStorage.removeItem(CACHE_KEY_TX(userId));
    localStorage.removeItem(CACHE_KEY_TR(userId));
  };

  const fetchUserData = async (userId: string) => {
    setDbError('');
    try {
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txError) throw txError;

      const { data: trs, error: trError } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (trError) throw trError;

      let finalTxs = (txs as Transaction[]) || [];
      let finalTrs = (trs as Transfer[]) || [];

      // Auto-migration: if Supabase is empty, try migrating from old localStorage demo data
      if (finalTxs.length === 0 && finalTrs.length === 0) {
        const localTxs = getTransactions();
        const localTrs = getTransfers();

        if (localTxs.length > 0) {
          const txRows = localTxs.map(t => ({
            id: t.id, user_id: userId, date: t.date,
            reported_amount: t.reported_amount, actual_spend: t.actual_spend,
            saved_amount: t.saved_amount, category: t.category,
            notes: t.notes || '', created_at: t.created_at
          }));
          const { error: upsertErr } = await supabase.from('transactions').upsert(txRows);
          if (!upsertErr) finalTxs = localTxs;
        }

        if (localTrs.length > 0) {
          const trRows = localTrs.map(t => ({
            id: t.id, user_id: userId, date: t.date, amount: t.amount,
            destination: t.destination, notes: t.notes || '', created_at: t.created_at
          }));
          const { error: upsertErr } = await supabase.from('transfers').upsert(trRows);
          if (!upsertErr) finalTrs = localTrs;
        }
      }

      // Only update state if Supabase returned actual data.
      // NEVER reset to zero here — zero state is only allowed on explicit sign-out.
      if (finalTxs.length > 0 || finalTrs.length > 0) {
        setTransactions(finalTxs);
        setTransfers(finalTrs);
        saveToCache(userId, finalTxs, finalTrs);
      }
      // If 0 rows returned, do nothing — keep whatever is currently shown.
    } catch (err) {
      console.error('Failed to load user data from Supabase:', err);
      setDbError(err instanceof Error ? err.message : 'Failed to synchronize with Supabase backend.');
    }
  };

  const refreshData = () => {
    setDbError('');
    if (user) {
      fetchUserData(user.id);
    }
    const sets = getSettings();
    setSettings(sets);
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — if no auth event fires in 10s, stop the spinner
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 10000);

    // onAuthStateChange in Supabase v2 fires:
    //   INITIAL_SESSION — immediately on subscription if a session exists (page reload)
    //   SIGNED_IN       — after OAuth / email login completes
    //   TOKEN_REFRESHED — after Supabase auto-refreshes an expired access token
    //   SIGNED_OUT      — after sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(currentUser);
        if (currentUser) {
          // Show cached data immediately so the UI is never blank
          loadFromCache(currentUser.id);
          // Fetch from Supabase — if JWT is still valid this returns data
          // If expired, TOKEN_REFRESHED will fire shortly and re-fetch
          fetchUserData(currentUser.id);
        }
        if (event !== 'TOKEN_REFRESHED') {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }

      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTransactions([]);
        setTransfers([]);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }) => {
    if (!user) return;

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
    if (!user) return;

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
    if (!user) return;

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
    if (!user) return;

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
    // Clear this user's display cache before signing out
    if (user) clearCache(user.id);
    setTransactions([]);
    setTransfers([]);
    setUser(null);
    setIsLoading(false);
    try {
      supabase.auth.signOut().catch(err => {
        console.error('Background logout error:', err);
      });
    } catch (err) {
      console.error('Logout call error:', err);
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

  if (!user) {
    return <Login />;
  }

  return (
    <AppContext.Provider
      value={{
        user,
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

        dbError,
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
