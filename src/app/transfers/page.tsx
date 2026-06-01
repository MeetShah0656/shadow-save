'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  ArrowLeftRight, 
  Trash2, 
  Calendar, 
  Wallet, 
  AlertCircle,
  CheckCircle2,
  PiggyBank,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Transfers() {
  const { 
    transactions, 
    transfers, 
    currencySymbol, 
    addTransfer, 
    deleteTransfer,
    isPrivacyMode
  } = useApp();

  const [mounted, setMounted] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState<'Savings Account' | 'UPI Wallet' | 'Bank Account' | 'Cash'>('Savings Account');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Set default date to today
  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    setDate(localToday.toISOString().split('T')[0]);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-text">
        <div className="animate-spin w-8 h-8 border-2 border-t-cream border-surface-border rounded-full mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Loading Transfers...</span>
      </div>
    );
  }



  // Compute Metrics
  const totalGenerated = transactions.reduce((acc, t) => acc + t.saved_amount, 0);
  const totalTransferred = transfers.reduce((acc, t) => acc + t.amount, 0);
  const remainingToTransfer = Math.max(0, totalGenerated - totalTransferred);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount) || 0;

    if (!date) {
      setErrorMsg('Date is required.');
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg('Transfer amount must be greater than zero.');
      return;
    }

    if (numAmount > remainingToTransfer) {
      setErrorMsg(`Transfer exceeds remaining generated savings (${currencySymbol}${remainingToTransfer.toLocaleString()}).`);
      return;
    }

    addTransfer({
      date,
      amount: numAmount,
      destination,
      notes: notes.trim(),
    });

    // Reset Form
    setAmount('');
    setNotes('');
    setSuccessMsg('Transfer logged successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="space-y-8 relative">
      {/* Privacy Mode Overlay */}
      {isPrivacyMode && (
        <div className="absolute inset-0 bg-background/10 z-10 flex flex-col items-center justify-center text-center p-6 rounded-2xl min-h-[450px]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-sm p-6 bg-surface/90 border border-surface-border rounded-2xl shadow-2xl flex flex-col items-center backdrop-blur-xl"
          >
            <div className="p-4 bg-cream-dark/10 rounded-full border border-cream/20 text-cream mb-4">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-cream">Transfers Shielded</h3>
            <p className="text-xs text-muted-text mt-2 leading-relaxed">
              Physical accounts transfers tracking is locked in Privacy Mode. Exit Privacy Mode using your PIN in the sidebar to access.
            </p>
          </motion.div>
        </div>
      )}

      <div className={`space-y-8 transition-all duration-300 ${isPrivacyMode ? 'filter blur-md select-none pointer-events-none' : ''}`}>
        {/* Header */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">Savings Transfers</h2>
          <p className="text-xs md:text-sm text-muted-text">
            Track whether the savings generated from your spending differences have been moved to real savings accounts.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Generated */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border flex flex-col justify-between h-32 glow-hover">
            <span className="text-[10px] font-semibold text-muted-text uppercase tracking-wider">Total Savings Generated</span>
            <div>
              <h3 className="text-2xl font-bold text-cream">{currencySymbol}{totalGenerated.toLocaleString()}</h3>
              <span className="text-[9px] text-muted-text">Calculated from transaction logs</span>
            </div>
          </div>

          {/* Transferred */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border flex flex-col justify-between h-32 glow-hover">
            <span className="text-[10px] font-semibold text-muted-text uppercase tracking-wider text-success">Total Savings Transferred</span>
            <div>
              <h3 className="text-2xl font-bold text-success">{currencySymbol}{totalTransferred.toLocaleString()}</h3>
              <span className="text-[9px] text-muted-text">Moved to real-world accounts</span>
            </div>
          </div>

          {/* Remaining */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border flex flex-col justify-between h-32 glow-hover bg-gradient-to-br from-cream-dark/15 to-transparent">
            <span className="text-[10px] font-semibold text-muted-text uppercase tracking-wider text-warning">Remaining To Transfer</span>
            <div>
              <h3 className="text-2xl font-bold text-warning">
                {currencySymbol}{remainingToTransfer.toLocaleString()}
              </h3>
              {remainingToTransfer === 0 && totalGenerated > 0 ? (
                <span className="text-[10px] text-success font-semibold flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> Fully Transferred!
                </span>
              ) : (
                <span className="text-[9px] text-muted-text">Pending transfer to physical accounts</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Log Transfer Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-cream flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-cream" /> Log a Transfer
                </h3>
                <p className="text-[11px] text-muted-text mt-0.5">
                  Record a physical transfer to update your remaining balance.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-success/10 border border-success/25 text-success rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-3.5 h-3.5 text-muted-text" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-text">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 2000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 pl-7 pr-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all font-semibold"
                    />
                  </div>
                  {remainingToTransfer > 0 && (
                    <span 
                      onClick={() => setAmount(remainingToTransfer.toString())}
                      className="text-[9.5px] text-cream hover:underline cursor-pointer font-semibold mt-1 block w-fit"
                    >
                      Use max remaining: {currencySymbol}{remainingToTransfer.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                    Destination Account
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-text" />
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value as typeof destination)}
                      className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all appearance-none cursor-pointer"
                    >
                      <option value="Savings Account" className="bg-surface">Savings Account</option>
                      <option value="UPI Wallet" className="bg-surface">UPI Wallet</option>
                      <option value="Bank Account" className="bg-surface">Bank Account</option>
                      <option value="Cash" className="bg-surface">Cash</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Moved to SBI Savings"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-cream transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={remainingToTransfer <= 0}
                  className="w-full bg-cream hover:bg-cream-dim text-background py-3 rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-cream/10 text-xs mt-2 disabled:opacity-40 disabled:hover:bg-cream disabled:cursor-not-allowed"
                >
                  Log Savings Transfer
                </button>
              </form>
            </div>
          </div>

          {/* Transfer History Log */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 rounded-2xl border border-surface-border space-y-4 h-full flex flex-col">
              <h3 className="text-sm font-bold text-cream">Transfer History</h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-1">
                {transfers.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-surface-border rounded-xl">
                    <p className="text-xs text-muted-text">No transfers logged yet.</p>
                    <p className="text-[10px] text-muted-text/80 mt-1 max-w-[200px] mx-auto">
                      Transfer money from your daily spending differences and log them here.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {transfers.map((tr) => (
                      <motion.div
                        layout
                        key={tr.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-surface-hover/30 border border-surface-border/50 rounded-xl flex items-center justify-between gap-4 group hover:border-surface-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-success/10 border border-success/15 rounded-xl text-success flex-shrink-0">
                            <PiggyBank className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-cream flex items-center gap-2 flex-wrap">
                              <span>{tr.destination}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-border border border-surface-border text-muted-text font-normal">
                                {tr.date}
                              </span>
                            </div>
                            {tr.notes ? (
                              <p className="text-[10px] text-muted-text mt-1 font-medium">{tr.notes}</p>
                            ) : (
                              <p className="text-[10px] text-muted-text/40 mt-1 italic">No notes attached</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-success">
                              -{currencySymbol}{tr.amount.toLocaleString()}
                            </span>
                            <span className="text-[8px] block text-muted-text">Transferred</span>
                          </div>
                          
                          <button
                            disabled={isPrivacyMode}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this transfer?")) {
                                deleteTransfer(tr.id);
                              }
                            }}
                            className={`p-1.5 bg-surface-hover border border-surface-border text-muted-text rounded-lg transition-colors opacity-80 md:opacity-0 md:group-hover:opacity-100 ${
                              isPrivacyMode 
                                ? 'opacity-30 cursor-not-allowed' 
                                : 'hover:text-danger cursor-pointer'
                            }`}
                            title={isPrivacyMode ? "Unlock to Delete" : "Delete Log"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
