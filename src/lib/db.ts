import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Transaction {
  id: string;
  date: string;
  reported_amount: number;
  actual_spend: number;
  saved_amount: number;
  category: 'Food' | 'Travel' | 'Shopping' | 'Fuel' | 'Entertainment' | 'College' | 'Bills' | 'Other';
  notes?: string;
  created_at: string;
}

export interface Transfer {
  id: string;
  date: string;
  amount: number;
  destination: 'Savings Account' | 'UPI Wallet' | 'Bank Account' | 'Cash';
  notes?: string;
  created_at: string;
}

export interface Settings {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseSyncEnabled: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  target: number; // in base units
  description: string;
  unlocked: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseSyncEnabled: false,
};

// Helper to check if window is available (client-side)
const isClient = () => typeof window !== 'undefined';

// Get active Supabase client if configured
let supabaseInstance: SupabaseClient | null = null;
const getSupabaseClient = (settings: Settings): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  
  // Use env variables as fallback
  const url = settings.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = settings.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (url && key && settings.supabaseSyncEnabled) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return null;
};

// Get settings
export const getSettings = (): Settings => {
  if (!isClient()) return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem('shadowsave_settings');
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error(e);
    return DEFAULT_SETTINGS;
  }
};

// Save settings
export const saveSettings = (newSettings: Partial<Settings>): Settings => {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  if (isClient()) {
    localStorage.setItem('shadowsave_settings', JSON.stringify(updated));
    // Reset supabase instance in case keys changed
    supabaseInstance = null;
  }
  return updated;
};

// Helper for currency formatting
export const getCurrencySymbol = (currency: Settings['currency']) => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'INR':
    default: return '₹';
  }
};

export const formatCurrency = (amount: number, currency: Settings['currency'] = 'INR') => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Transactions CRUD
export const getTransactions = (): Transaction[] => {
  if (!isClient()) return [];
  try {
    const data = localStorage.getItem('shadowsave_transactions');
    const list: Transaction[] = data ? JSON.parse(data) : [];
    // Sort transactions by date descending, then created_at descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveTransaction = (
  t: Omit<Transaction, 'id' | 'saved_amount' | 'created_at'> & { id?: string }
): Transaction => {
  const transactions = getTransactions();
  const saved_amount = Math.max(0, t.reported_amount - t.actual_spend);
  
  let newTransaction: Transaction;
  
  if (t.id) {
    // Update
    const idx = transactions.findIndex(x => x.id === t.id);
    const existing = transactions[idx] || {};
    newTransaction = {
      ...existing,
      ...t,
      id: t.id,
      saved_amount,
      created_at: existing.created_at || new Date().toISOString(),
    } as Transaction;
    if (idx !== -1) {
      transactions[idx] = newTransaction;
    } else {
      transactions.push(newTransaction);
    }
  } else {
    // Create
    newTransaction = {
      ...t,
      id: Math.random().toString(36).substring(2, 9),
      saved_amount,
      created_at: new Date().toISOString(),
    };
    transactions.push(newTransaction);
  }

  if (isClient()) {
    localStorage.setItem('shadowsave_transactions', JSON.stringify(transactions));
    
    // Sync with Supabase asynchronously if configured
    const settings = getSettings();
    const supabase = getSupabaseClient(settings);
    if (supabase) {
      supabase.from('transactions').upsert({
        id: newTransaction.id,
        date: newTransaction.date,
        reported_amount: newTransaction.reported_amount,
        actual_spend: newTransaction.actual_spend,
        saved_amount: newTransaction.saved_amount,
        category: newTransaction.category,
        notes: newTransaction.notes || '',
        created_at: newTransaction.created_at
      }).then(({ error }) => {
        if (error) console.error('Supabase sync error:', error);
      });
    }
  }
  
  return newTransaction;
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions();
  const filtered = transactions.filter(x => x.id !== id);
  
  if (isClient()) {
    localStorage.setItem('shadowsave_transactions', JSON.stringify(filtered));
    
    // Delete from Supabase
    const settings = getSettings();
    const supabase = getSupabaseClient(settings);
    if (supabase) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete error:', error);
      });
    }
  }
};

// Transfers CRUD
export const getTransfers = (): Transfer[] => {
  if (!isClient()) return [];
  try {
    const data = localStorage.getItem('shadowsave_transfers');
    const list: Transfer[] = data ? JSON.parse(data) : [];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveTransfer = (
  t: Omit<Transfer, 'id' | 'created_at'> & { id?: string }
): Transfer => {
  const transfers = getTransfers();
  let newTransfer: Transfer;
  
  if (t.id) {
    const idx = transfers.findIndex(x => x.id === t.id);
    const existing = transfers[idx] || {};
    newTransfer = {
      ...existing,
      ...t,
      id: t.id,
      created_at: existing.created_at || new Date().toISOString(),
    } as Transfer;
    if (idx !== -1) {
      transfers[idx] = newTransfer;
    } else {
      transfers.push(newTransfer);
    }
  } else {
    newTransfer = {
      ...t,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    transfers.push(newTransfer);
  }

  if (isClient()) {
    localStorage.setItem('shadowsave_transfers', JSON.stringify(transfers));
    
    // Sync with Supabase
    const settings = getSettings();
    const supabase = getSupabaseClient(settings);
    if (supabase) {
      supabase.from('transfers').upsert({
        id: newTransfer.id,
        date: newTransfer.date,
        amount: newTransfer.amount,
        destination: newTransfer.destination,
        notes: newTransfer.notes || '',
        created_at: newTransfer.created_at
      }).then(({ error }) => {
        if (error) console.error('Supabase transfer sync error:', error);
      });
    }
  }
  
  return newTransfer;
};

export const deleteTransfer = (id: string): void => {
  const transfers = getTransfers();
  const filtered = transfers.filter(x => x.id !== id);
  
  if (isClient()) {
    localStorage.setItem('shadowsave_transfers', JSON.stringify(filtered));
    
    // Delete from Supabase
    const settings = getSettings();
    const supabase = getSupabaseClient(settings);
    if (supabase) {
      supabase.from('transfers').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase transfer delete error:', error);
      });
    }
  }
};

// Streak Calculation
// Returns the number of consecutive days of saving (where saved_amount > 0) ending today or yesterday.
export const calculateStreak = (transactions: Transaction[]): number => {
  if (transactions.length === 0) return 0;
  
  // Find all unique dates where savings > 0
  const savingDates = new Set(
    transactions
      .filter(t => t.saved_amount > 0)
      .map(t => t.date) // YYYY-MM-DD
  );
  
  if (savingDates.size === 0) return 0;
  
  // Sort dates descending
  const sortedDates = Array.from(savingDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Normalize current date to local YYYY-MM-DD
  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const todayStr = formatDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);
  
  const mostRecentDate = sortedDates[0];
  
  // If the most recent saving date is older than yesterday, streak is broken
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  const checkDate = new Date(mostRecentDate);
  
  while (true) {
    const checkStr = formatDateString(checkDate);
    if (savingDates.has(checkStr)) {
      streak++;
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Milestones / Badges Calculation
export const getMilestones = (totalSaved: number): Milestone[] => {
  const targets = [
    { id: 'm1', title: 'Savings Starter', target: 1000, description: 'Save a total of ₹1,000' },
    { id: 'm2', title: 'Thrifty Saver', target: 5000, description: 'Save a total of ₹5,000' },
    { id: 'm3', title: 'Wealth Builder', target: 10000, description: 'Save a total of ₹10,000' },
    { id: 'm4', title: 'Financial Legend', target: 25000, description: 'Save a total of ₹25,000' },
  ];

  return targets.map(m => ({
    ...m,
    unlocked: totalSaved >= m.target,
  }));
};

// Initialize DB with some premium mockup data if empty, so the dashboard looks loaded and impressive at first run
export const checkAndSeedDatabase = (): void => {
  if (!isClient()) return;
  
  const hasTransactions = localStorage.getItem('shadowsave_transactions');
  const hasTransfers = localStorage.getItem('shadowsave_transfers');
  
  if (!hasTransactions || JSON.parse(hasTransactions).length === 0) {
    // Seed transactions going back a few days
    const mockTransactions: Transaction[] = [];
    const categories: Transaction['category'][] = ['Food', 'Travel', 'Shopping', 'Fuel', 'Entertainment', 'College', 'Bills', 'Other'];
    const notes = [
      'Groceries and snacks',
      'Uber ride to work',
      'Bought a new t-shirt',
      'Petrol refill',
      'Movie ticket & popcorn',
      'Textbook purchase',
      'Electricity bill payment',
      'Coffee with friends'
    ];
    
    const today = new Date();
    // Seed 12 days to create an active 12-day streak
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Seed 1-2 transactions per day
      const txCount = i % 3 === 0 ? 2 : 1;
      for (let j = 0; j < txCount; j++) {
        // reported amount should be larger than actual spend to generate savings
        const reported = Math.floor(Math.random() * 800) + 300;
        const actual = Math.floor(reported * 0.7); // Saved ~30%
        const category = categories[(i + j) % categories.length];
        
        mockTransactions.push({
          id: `seed-tx-${i}-${j}`,
          date: dateStr,
          reported_amount: reported,
          actual_spend: actual,
          saved_amount: reported - actual,
          category,
          notes: `${notes[(i + j) % notes.length]} (${j + 1})`,
          created_at: new Date(date).toISOString(),
        });
      }
    }
    
    localStorage.setItem('shadowsave_transactions', JSON.stringify(mockTransactions));
  }
  
  if (!hasTransfers || JSON.parse(hasTransfers).length === 0) {
    // Seed some transfers
    const totalTransactions = JSON.parse(localStorage.getItem('shadowsave_transactions') || '[]');
    const totalSaved = totalTransactions.reduce((acc: number, t: Transaction) => acc + t.saved_amount, 0);
    
    // Transfer about 80% of generated savings
    const transferAmount = Math.floor(totalSaved * 0.8);
    
    const today = new Date();
    const transferDate = new Date(today);
    transferDate.setDate(today.getDate() - 2);
    
    const mockTransfers: Transfer[] = [
      {
        id: 'seed-tr-1',
        date: transferDate.toISOString().split('T')[0],
        amount: Math.floor(transferAmount * 0.6),
        destination: 'Savings Account',
        notes: 'Transferred bulk of weekly savings',
        created_at: transferDate.toISOString(),
      },
      {
        id: 'seed-tr-2',
        date: today.toISOString().split('T')[0],
        amount: Math.floor(transferAmount * 0.4),
        destination: 'UPI Wallet',
        notes: 'Moved daily difference',
        created_at: today.toISOString(),
      }
    ];
    
    localStorage.setItem('shadowsave_transfers', JSON.stringify(mockTransfers));
  }
};

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10).toString();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = monthNames[monthIdx];
  if (!month) return dateStr;
  
  return `${day} ${month} ${year}`;
};
