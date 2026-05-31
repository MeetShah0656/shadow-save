'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Calendar, Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string; // Optional: If passed, we edit instead of creating
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, editId }) => {
  const { addTransaction, transactions, currencySymbol } = useApp();
  
  const [date, setDate] = useState('');
  const [reported, setReported] = useState('');
  const [actual, setActual] = useState('');
  const [category, setCategory] = useState<'Food' | 'Travel' | 'Shopping' | 'Fuel' | 'Entertainment' | 'College' | 'Bills' | 'Other'>('Food');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Categories list
  const categories: Array<typeof category> = ['Food', 'Travel', 'Shopping', 'Fuel', 'Entertainment', 'College', 'Bills', 'Other'];

  // Initialize fields if editing
  useEffect(() => {
    if (isOpen) {
      if (editId) {
        const tx = transactions.find(t => t.id === editId);
        if (tx) {
          setDate(tx.date);
          setReported(tx.reported_amount.toString());
          setActual(tx.actual_spend.toString());
          setCategory(tx.category);
          setNotes(tx.notes || '');
          setErrorMsg('');
          return;
        }
      }
      
      // Default to local date in YYYY-MM-DD
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      setDate(localToday.toISOString().split('T')[0]);
      setReported('');
      setActual('');
      setCategory('Food');
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, editId, transactions]);

  // Real-time savings calculation
  const numReported = parseFloat(reported) || 0;
  const numActual = parseFloat(actual) || 0;
  const savings = Math.max(0, numReported - numActual);
  const isNegativeSavings = numReported > 0 && numActual > numReported;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      setErrorMsg('Date is required.');
      return;
    }

    if (numReported <= 0) {
      setErrorMsg('Reported amount must be greater than zero.');
      return;
    }

    if (numActual <= 0) {
      setErrorMsg('Actual spend must be greater than zero.');
      return;
    }

    if (notes.length > 500) {
      setErrorMsg('Notes cannot exceed 500 characters.');
      return;
    }

    addTransaction({
      id: editId,
      date,
      reported_amount: numReported,
      actual_spend: numActual,
      category,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="glass-card relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 z-10"
          >
            {/* Grain Overlay inside modal */}
            <div className="grain-overlay opacity-3 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-cream">
                  {editId ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                <p className="text-xs text-muted-text">
                  Compare reported vs actual expenses to track your savings.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-surface-hover border border-surface-border rounded-xl text-muted-text hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-muted-text mb-1.5 uppercase tracking-wider">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all"
                  />
                </div>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-text mb-1.5 uppercase tracking-wider">
                    Reported Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-semibold text-muted-text">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      placeholder="e.g. 1000"
                      value={reported}
                      onChange={(e) => setReported(e.target.value)}
                      className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-8 pr-4 text-sm text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-text mb-1.5 uppercase tracking-wider">
                    Actual Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-semibold text-muted-text">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      placeholder="e.g. 650"
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-8 pr-4 text-sm text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Savings Preview */}
              {(numReported > 0 || numActual > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    isNegativeSavings 
                      ? 'bg-danger/5 border-danger/20 text-danger' 
                      : savings > 0 
                        ? 'bg-success/5 border-success/20 text-success' 
                        : 'bg-surface-hover border-surface-border text-muted-text'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isNegativeSavings ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-75 font-semibold">
                        Real-time Savings Preview
                      </div>
                      <div className="text-xs">
                        {currencySymbol}{numReported.toLocaleString()} (Reported) - {currencySymbol}{numActual.toLocaleString()} (Actual)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block opacity-75 font-semibold">Difference</span>
                    <span className="text-base font-bold">
                      {isNegativeSavings ? '-' : ''}{currencySymbol}{Math.abs(numReported - numActual).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-muted-text mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as typeof category)}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all appearance-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-surface">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-muted-text uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <span className={`text-[10px] font-semibold ${notes.length > 500 ? 'text-danger' : 'text-muted-text'}`}>
                    {notes.length}/500
                  </span>
                </div>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                  <textarea
                    placeholder="Describe this spending difference..."
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-surface-hover border border-surface-border text-foreground py-3 rounded-xl hover:bg-surface-border transition-colors cursor-pointer text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cream hover:bg-cream-dim text-background py-3 rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-cream/10 text-sm"
                >
                  {editId ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
