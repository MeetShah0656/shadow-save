'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  transactions: Transaction[];
  transfers: Transfer[];
  settings: Settings;
  streak: number;
  milestones: Milestone[];
  currencySymbol: string;
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  addTransfer: (t: Omit<Transfer, 'id' | 'created_at'> & { id?: string }) => void;
  deleteTransfer: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    const txs = getTransactions();
    const trs = getTransfers();
    const sets = getSettings();
    setTransactions(txs);
    setTransfers(trs);
    setSettings(sets);
  };

  useEffect(() => {
    // Seed and refresh on initial client load
    checkAndSeedDatabase();
    refreshData();
    setIsLoading(false);
  }, []);

  const handleAddTransaction = (t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }) => {
    saveTransaction(t);
    refreshData();
  };

  const handleDeleteTransaction = (id: string) => {
    dbDeleteTransaction(id);
    refreshData();
  };

  const handleAddTransfer = (t: Omit<Transfer, 'id' | 'created_at'> & { id?: string }) => {
    saveTransfer(t);
    refreshData();
  };

  const handleDeleteTransfer = (id: string) => {
    dbDeleteTransfer(id);
    refreshData();
  };

  const handleUpdateSettings = (s: Partial<Settings>) => {
    saveSettings(s);
    refreshData();
  };

  // Compute values
  const totalSaved = transactions.reduce((acc, t) => acc + t.saved_amount, 0);
  const streak = calculateStreak(transactions);
  const milestones = getMilestones(totalSaved);
  const currencySymbol = getCurrencySymbol(settings.currency);

  return (
    <AppContext.Provider
      value={{
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
