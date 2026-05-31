'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Coins, 
  Download, 
  Cloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Database,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { 
    user,
    demoMode,
    settings, 
    updateSettings, 
    transactions, 
    transfers,
    signOut
  } = useApp();

  const [url, setUrl] = useState(settings.supabaseUrl || '');
  const [key, setKey] = useState(settings.supabaseAnonKey || '');
  const [syncEnabled, setSyncEnabled] = useState(settings.supabaseSyncEnabled || false);
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ currency });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      supabaseSyncEnabled: syncEnabled,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // CSV Exporter Helper
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTransactions = () => {
    if (transactions.length === 0) return;
    
    // CSV Header
    let csvContent = 'ID,Date,Category,Reported Amount,Actual Spend,Saved Amount,Notes,Created At\n';
    
    // Add rows
    transactions.forEach((t) => {
      const notesEscaped = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '';
      csvContent += `${t.id},${t.date},${t.category},${t.reported_amount},${t.actual_spend},${t.saved_amount},${notesEscaped},${t.created_at}\n`;
    });

    downloadCSV(csvContent, 'shadowsave_transactions.csv');
  };

  const exportTransfers = () => {
    if (transfers.length === 0) return;

    let csvContent = 'ID,Date,Destination,Amount,Notes,Created At\n';
    transfers.forEach((t) => {
      const notesEscaped = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '';
      csvContent += `${t.id},${t.date},${t.destination},${t.amount},${notesEscaped},${t.created_at}\n`;
    });

    downloadCSV(csvContent, 'shadowsave_transfers.csv');
  };

  const exportBackupJSON = () => {
    const data = {
      settings,
      transactions,
      transfers,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shadowsave_backup.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Supabase Backup/Sync
  const triggerManualSync = async () => {
    if (!url || !key) {
      setSyncError('Please fill in Supabase Credentials first.');
      return;
    }
    
    setIsSyncing(true);
    setSyncError('');
    setSyncSuccess(false);

    try {
      // Initialize Supabase dynamically
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key);

      // Verify connection by reading/writing mock
      // Since tables may not exist yet, we guide them
      let syncFailed = false;

      // 1. Sync Transactions
      if (transactions.length > 0) {
        const txRows = transactions.map(t => ({
          id: t.id,
          user_id: user?.id || null,
          date: t.date,
          reported_amount: t.reported_amount,
          actual_spend: t.actual_spend,
          saved_amount: t.saved_amount,
          category: t.category,
          notes: t.notes || '',
          created_at: t.created_at
        }));

        const { error: txErr } = await supabase.from('transactions').upsert(txRows);
        if (txErr) {
          console.error(txErr);
          syncFailed = true;
          setSyncError(`Transaction sync failed: ${txErr.message}. Ensure RLS rules and tables match the schema.`);
        }
      }

      // 2. Sync Transfers
      if (transfers.length > 0 && !syncFailed) {
        const trRows = transfers.map(t => ({
          id: t.id,
          user_id: user?.id || null,
          date: t.date,
          amount: t.amount,
          destination: t.destination,
          notes: t.notes || '',
          created_at: t.created_at
        }));

        const { error: trErr } = await supabase.from('transfers').upsert(trRows);
        if (trErr) {
          console.error(trErr);
          syncFailed = true;
          setSyncError(`Transfer sync failed: ${trErr.message}. Ensure tables are configured.`);
        }
      }

      if (!syncFailed) {
        setSyncSuccess(true);
        // Automatically turn on sync settings
        updateSettings({
          supabaseUrl: url.trim(),
          supabaseAnonKey: key.trim(),
          supabaseSyncEnabled: true,
        });
        setSyncEnabled(true);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during manual sync.';
      setSyncError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset database
  const resetDatabase = () => {
    if (confirm('WARNING: This will permanently delete all your local transactions, saving streaks, and transfers. Are you sure you want to start fresh?')) {
      localStorage.removeItem('shadowsave_transactions');
      localStorage.removeItem('shadowsave_transfers');
      localStorage.removeItem('shadowsave_settings');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">System Settings</h2>
        <p className="text-xs md:text-sm text-muted-text">
          Configure currencies, export CSV database reports, or link a live Supabase backend.
        </p>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 text-xs font-semibold"
        >
          <CheckCircle2 className="w-4 h-4 text-success" /> Settings saved successfully!
        </motion.div>
      )}

      {/* Account Profile Card */}
      <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-cream flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-cream" /> User Account
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-hover/30 border border-surface-border/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-cream/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 bg-cream/10 border border-cream/20 rounded-full flex items-center justify-center text-cream">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-cream text-left">
                {user?.user_metadata?.full_name || (demoMode ? 'Local Developer' : 'Authenticated User')}
              </p>
              <p className="text-[10px] text-muted-text text-left">
                {user?.email || (demoMode ? 'demo_mode@local.storage' : 'No email associated')}
              </p>
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-1.5 bg-danger/10 hover:bg-danger/20 border border-danger/25 text-danger px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-bold self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-cream flex items-center gap-2">
          <Coins className="w-4 h-4 text-cream" /> Localization & Currencies
        </h3>
        
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-[10px] font-semibold text-muted-text mb-1.5 uppercase tracking-wider">
              Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all appearance-none cursor-pointer"
            >
              <option value="INR" className="bg-surface">INR (₹) - Indian Rupee</option>
              <option value="USD" className="bg-surface">USD ($) - US Dollar</option>
              <option value="EUR" className="bg-surface">EUR (€) - Euro</option>
              <option value="GBP" className="bg-surface">GBP (£) - British Pound</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="bg-cream hover:bg-cream-dim text-background px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs"
          >
            Save Preferences
          </button>
        </form>
      </div>

      {/* Cloud Sync & Backup (Supabase) */}
      <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-cream flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cream" /> Cloud Sync & Supabase Backend
            </h3>
            <p className="text-[11px] text-muted-text mt-0.5 max-w-lg">
              Link a Supabase database to secure your records. Data is synced in real-time when enabled, or back up manually below.
            </p>
          </div>
          
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            settings.supabaseSyncEnabled 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-surface-hover border-surface-border text-muted-text'
          }`}>
            {settings.supabaseSyncEnabled ? 'Cloud Sync Enabled' : 'Local Only'}
          </span>
        </div>

        {syncSuccess && (
          <div className="p-3 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Successfully connected & backed up all local records to Supabase tables!</span>
          </div>
        )}

        {syncError && (
          <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                Supabase URL
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all font-mono"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                Supabase Anon API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-1 select-none">
            <input
              type="checkbox"
              id="sync-checkbox"
              checked={syncEnabled}
              onChange={(e) => setSyncEnabled(e.target.checked)}
              className="rounded bg-surface-hover border-surface-border text-cream focus:ring-cream/20 cursor-pointer w-4 h-4"
            />
            <label htmlFor="sync-checkbox" className="text-xs text-muted-text cursor-pointer">
              Enable Auto-Sync (upsert changes dynamically to database)
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-cream hover:bg-cream-dim text-background px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs"
            >
              Save Credentials
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={triggerManualSync}
              className="flex items-center gap-1.5 bg-surface-hover border border-surface-border hover:bg-surface-border text-cream px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Force Backup/Sync Now
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-3 bg-surface-hover/30 border border-surface-border/50 rounded-xl space-y-1.5">
          <h4 className="text-[10px] font-bold text-cream uppercase tracking-wider flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Supabase Database Schema Guide
          </h4>
          <p className="text-[9.5px] text-muted-text">
            To synchronize, create these two tables in your Supabase SQL editor:
          </p>
          <pre className="bg-black/40 border border-surface-border/40 p-2.5 rounded-lg text-[8.5px] text-muted-text font-mono overflow-x-auto select-all max-h-32">
{`-- Create tables with user_id to match user sessions and enable RLS
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reported_amount NUMERIC NOT NULL,
  actual_spend NUMERIC NOT NULL,
  saved_amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE transfers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  destination TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and setup policies:
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own transfers" ON transfers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- IF ALTERING EXISTING TABLES:
-- ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE transfers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;`}
          </pre>
        </div>
      </div>

      {/* Export Reports */}
      <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-cream flex items-center gap-2">
          <Download className="w-4 h-4 text-cream" /> Export Database Reports
        </h3>
        <p className="text-[11px] text-muted-text mt-0.5">
          Download your logs to view them in Excel, Google Sheets, or backup your files to restore them.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportTransactions}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 bg-surface-hover border border-surface-border hover:bg-surface-border text-cream px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export Transactions (CSV)
          </button>
          
          <button
            onClick={exportTransfers}
            disabled={transfers.length === 0}
            className="flex items-center gap-1.5 bg-surface-hover border border-surface-border hover:bg-surface-border text-cream px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export Transfers (CSV)
          </button>

          <button
            onClick={exportBackupJSON}
            className="flex items-center gap-1.5 bg-surface-hover border border-surface-border hover:bg-surface-border text-cream px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Backup Database (JSON)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 rounded-2xl border border-danger/20 bg-danger/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-[11px] text-muted-text mt-0.5">
            Destructive options that permanently delete data.
          </p>
        </div>

        <button
          onClick={resetDatabase}
          className="bg-danger hover:bg-danger-dim text-foreground px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-2 border border-danger/10"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset All Local Storage</span>
        </button>
      </div>
    </div>
  );
}
