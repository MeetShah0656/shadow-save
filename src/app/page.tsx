'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AddEntryModal } from '@/components/AddEntryModal';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Percent, 
  Plus, 
  Flame, 
  Award, 
  ChevronRight, 
  Edit3, 
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { 
    transactions, 
    streak, 
    milestones, 
    currencySymbol, 
    deleteTransaction,
    dbError
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Compute Core Metrics
  const totalReported = transactions.reduce((acc, t) => acc + t.reported_amount, 0);
  const totalSpend = transactions.reduce((acc, t) => acc + t.actual_spend, 0);
  const totalSaved = transactions.reduce((acc, t) => acc + t.saved_amount, 0);
  const savingsRate = totalReported > 0 ? (totalSaved / totalReported) * 100 : 0;

  // Helpers for date checking
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const start = new Date(today.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getStartOfMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();

  // Weekly Summary
  const weeklyTxs = transactions.filter(t => new Date(t.date) >= startOfWeek);
  const weeklyReported = weeklyTxs.reduce((acc, t) => acc + t.reported_amount, 0);
  const weeklySpend = weeklyTxs.reduce((acc, t) => acc + t.actual_spend, 0);
  const weeklySaved = weeklyTxs.reduce((acc, t) => acc + t.saved_amount, 0);

  // Monthly Summary
  const monthlyTxs = transactions.filter(t => new Date(t.date) >= startOfMonth);
  const monthlyReported = monthlyTxs.reduce((acc, t) => acc + t.reported_amount, 0);
  const monthlySpend = monthlyTxs.reduce((acc, t) => acc + t.actual_spend, 0);
  const monthlySaved = monthlyTxs.reduce((acc, t) => acc + t.saved_amount, 0);
  const monthlySavingsRate = monthlyReported > 0 ? (monthlySaved / monthlyReported) * 100 : 0;

  const nextMilestone = milestones.find(m => !m.unlocked);
  const milestoneProgress = nextMilestone 
    ? Math.min(100, (totalSaved / nextMilestone.target) * 100) 
    : 100;

  // Open modal for editing
  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingId(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-cream flex items-center gap-2">
            Finance Overview <Sparkles className="w-5 h-5 text-cream animate-pulse" />
          </h2>
          <p className="text-xs md:text-sm text-muted-text">
            Compare reported amounts versus actual spend to optimize your saving habits.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-cream hover:bg-cream-dim text-background px-5 py-3 rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-cream/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Add Entry</span>
        </button>
      </div>

      {dbError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start gap-3 text-xs text-danger font-medium shadow-lg"
        >
          <div className="p-1 bg-danger/10 rounded-lg mt-0.5">
            <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-cream block text-[12px]">Supabase Synchronization Warning</span>
            <p className="text-muted-text text-[11px] leading-relaxed">{dbError}</p>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'Total Reported', 
            value: totalReported, 
            icon: TrendingUp, 
            color: 'text-cream', 
            bg: 'bg-cream/5 border-cream/10' 
          },
          { 
            title: 'Actual Spend', 
            value: totalSpend, 
            icon: TrendingDown, 
            color: 'text-danger', 
            bg: 'bg-danger/5 border-danger/10' 
          },
          { 
            title: 'Total Saved', 
            value: totalSaved, 
            icon: PiggyBank, 
            color: 'text-success', 
            bg: 'bg-success/5 border-success/10' 
          },
          { 
            title: 'Savings Rate', 
            value: `${savingsRate.toFixed(1)}%`, 
            icon: Percent, 
            color: 'text-warning', 
            bg: 'bg-warning/5 border-warning/10' 
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={card.title}
              className={`glass-card p-6 rounded-2xl flex flex-col justify-between h-36 border ${card.bg} glow-hover`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-text uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl bg-surface-hover border border-surface-border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className={`text-2xl font-bold tracking-tight ${card.color}`}>
                  {typeof card.value === 'number' 
                    ? `${currencySymbol}${card.value.toLocaleString('en-IN')}` 
                    : card.value}
                </h3>
                <span className="text-[10px] text-muted-text">Cumulative tracking history</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summaries & Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly & Monthly summary module */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-surface-border">
            <h3 className="text-base font-bold text-cream mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Weekly & Monthly Reports
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Report */}
              <div className="p-4 bg-surface-hover/40 border border-surface-border/50 rounded-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream">Weekly Summary</span>
                  <span className="text-[10px] text-muted-text">This Calendar Week</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-text">Reported Budget</span>
                    <span className="font-semibold text-cream">{currencySymbol}{weeklyReported.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-text">Actual Spending</span>
                    <span className="font-semibold text-danger">{currencySymbol}{weeklySpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-surface-border/50">
                    <span className="text-xs font-bold text-success">Saved Amount</span>
                    <span className="text-sm font-bold text-success">{currencySymbol}{weeklySaved.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Report */}
              <div className="p-4 bg-surface-hover/40 border border-surface-border/50 rounded-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream">Monthly Summary</span>
                  <span className="text-[10px] text-muted-text">This Calendar Month</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-text">Reported Budget</span>
                    <span className="font-semibold text-cream">{currencySymbol}{monthlyReported.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-text">Actual Spending</span>
                    <span className="font-semibold text-danger">{currencySymbol}{monthlySpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-surface-border/50">
                    <div>
                      <span className="text-xs block font-bold text-success">Saved Amount</span>
                      <span className="text-[9px] text-muted-text">Rate: {monthlySavingsRate.toFixed(1)}%</span>
                    </div>
                    <span className="text-sm font-bold text-success">{currencySymbol}{monthlySaved.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Module */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-cream">Recent Activities</h3>
              <a href="/transactions" className="text-xs text-cream hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-surface-border rounded-xl">
                  <p className="text-sm text-muted-text">No transactions logged yet.</p>
                  <button 
                    onClick={handleAddClick}
                    className="mt-2 text-xs text-cream font-bold hover:underline"
                  >
                    Create your first entry
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-muted-text">
                      <th className="py-2.5 font-semibold">Date</th>
                      <th className="py-2.5 font-semibold">Category</th>
                      <th className="py-2.5 font-semibold text-right">Reported</th>
                      <th className="py-2.5 font-semibold text-right">Actual</th>
                      <th className="py-2.5 font-semibold text-right">Saved</th>
                      <th className="py-2.5 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/40">
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="group hover:bg-surface-hover/30">
                        <td className="py-3 font-medium text-cream">{tx.date}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-surface-border border border-surface-border text-[10px] font-medium">
                            {tx.category}
                          </span>
                        </td>
                            <td className="py-3 text-right text-muted-text">{currencySymbol}{tx.reported_amount.toLocaleString()}</td>
                            <td className="py-3 text-right text-muted-text">{currencySymbol}{tx.actual_spend.toLocaleString()}</td>
                            <td className="py-3 text-right font-bold text-success">+{currencySymbol}{tx.saved_amount.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleEdit(tx.id)}
                              className="p-1 text-muted-text hover:text-cream rounded transition-colors cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="p-1 text-muted-text hover:text-danger rounded transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Gamification & Streaks Sidebar widgets */}
        {/* Gamification & Streaks Sidebar widgets */}
        <div className="space-y-6">
          {/* Streak Widget */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border bg-gradient-to-br from-warning/10 to-danger/5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 text-warning/5 pointer-events-none">
              <Flame className="w-32 h-32 fill-current" />
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-cream">Savings Streak</h3>
                <p className="text-[11px] text-muted-text mt-0.5">Consecutive days saving money</p>
              </div>
              <div className="p-2 bg-warning/20 border border-warning/25 rounded-xl text-warning">
                <Flame className="w-5 h-5 fill-current animate-bounce" />
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-4xl font-extrabold text-warning tracking-tight">
                {streak} Day{streak !== 1 ? 's' : ''}
              </h2>
              {streak > 0 ? (
                <p className="text-xs text-cream mt-2 font-medium">
                  Amazing habit! You saved money {streak} day{streak > 1 ? 's' : ''} in a row.
                </p>
              ) : (
                <p className="text-xs text-muted-text mt-2">
                  No active streak. Log a transaction with positive savings to start today!
                </p>
              )}
            </div>
          </div>

          {/* Gamification Milestones Widget */}
          <div className="glass-card p-6 rounded-2xl border border-surface-border">
            <h3 className="text-base font-bold text-cream mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-cream" /> Savings Badges
            </h3>

            {/* Next Badge Progress */}
            {nextMilestone ? (
              <div className="mb-6 p-3 bg-surface-hover border border-surface-border rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-text font-medium">Next: {nextMilestone.title}</span>
                  <span className="text-cream font-bold">{milestoneProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-border rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${milestoneProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-cream h-full rounded-full"
                  />
                </div>
                <div className="text-[9.5px] text-muted-text">
                  Save {currencySymbol}{(nextMilestone.target - totalSaved).toLocaleString()} more to unlock.
                </div>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-success/10 border border-success/20 rounded-xl flex items-center gap-2">
                <Award className="w-5 h-5 text-success" />
                <span className="text-xs font-semibold text-success">All Milestones Unlocked! 🏆</span>
              </div>
            )}

            {/* Badges List */}
            <div className="grid grid-cols-2 gap-3">
              {milestones.map((m) => (
                <div 
                  key={m.id} 
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                    m.unlocked 
                      ? 'bg-cream-dark/20 border-cream/20 text-cream' 
                      : 'bg-surface border-surface-border/40 text-muted-text opacity-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${m.unlocked ? 'bg-cream-dark/40 text-cream' : 'bg-surface-hover text-muted-text'}`}>
                    {m.unlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight block truncate max-w-full">
                    {m.title}
                  </span>
                  <span className="text-[8.5px] opacity-75 mt-0.5">
                    Total {currencySymbol}{m.target.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editId={editingId}
      />

      {/* Floating Action Button (Mobile) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddClick}
        className="md:hidden fixed bottom-18 right-6 z-30 p-4 bg-cream hover:bg-cream-dim text-background rounded-full shadow-2xl hover:shadow-cream/20 cursor-pointer flex items-center justify-center border border-cream/25"
      >
        <Plus className="w-6 h-6 stroke-[3.5px]" />
      </motion.button>
    </div>
  );
}
