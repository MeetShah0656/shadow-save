'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AddEntryModal } from '@/components/AddEntryModal';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Edit3, 
  Trash2, 
  X,
  Calendar,
  Tag,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

type SortField = 'date' | 'reported_amount' | 'actual_spend' | 'saved_amount';
type SortOrder = 'asc' | 'desc';

export default function Transactions() {
  const { transactions, currencySymbol, deleteTransaction } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minSavings, setMinSavings] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Categories list
  const categories = ['Food', 'Travel', 'Shopping', 'Fuel', 'Entertainment', 'College', 'Bills', 'Other'];

  // Handle header sort clicks
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Filter transactions
  const filteredTransactions = transactions
    .filter((tx) => {
      // Search match (notes or category)
      const matchesSearch = 
        tx.notes?.toLowerCase().includes(search.toLowerCase()) || 
        tx.category.toLowerCase().includes(search.toLowerCase());
      
      // Category match
      const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
      
      // Date range match
      const txDate = new Date(tx.date);
      const matchesStart = !startDate || txDate >= new Date(startDate);
      const matchesEnd = !endDate || txDate <= new Date(endDate);
      
      // Min savings match
      const minS = parseFloat(minSavings) || 0;
      const matchesSavings = tx.saved_amount >= minS;

      return matchesSearch && matchesCategory && matchesStart && matchesEnd && matchesSavings;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      
      const valA = a[sortField] as number;
      const valB = b[sortField] as number;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setStartDate('');
    setEndDate('');
    setMinSavings('');
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingId(undefined);
    setIsModalOpen(true);
  };

  // Sort indicator icon
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-text/50 ml-1" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-cream ml-1 stroke-[2.5px]" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-cream ml-1 stroke-[2.5px]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">Transaction History</h2>
          <p className="text-xs md:text-sm text-muted-text">
            Search, sort, and filter your logged savings transactions.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-cream hover:bg-cream-dim text-background px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-cream/10 text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search and Filters Drawer */}
      <div className="glass-card p-5 rounded-2xl border border-surface-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="Search by notes, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48 relative">
            <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-surface-hover border border-surface-border rounded-xl py-3 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all appearance-none cursor-pointer"
            >
              <option value="All" className="bg-surface">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-surface">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-surface-border/50">
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-text" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-hover border border-surface-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-text" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface-hover border border-surface-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all"
              />
            </div>
          </div>

          {/* Min Savings */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-text mb-1 uppercase tracking-wider">
              Min Savings ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-muted-text">
                {currencySymbol}
              </span>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minSavings}
                onChange={(e) => setMinSavings(e.target.value)}
                className="w-full bg-surface-hover border border-surface-border rounded-xl py-2 pl-7 pr-3 text-xs text-foreground focus:outline-none focus:border-cream focus:ring-1 focus:ring-cream/20 transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {(search || categoryFilter !== 'All' || startDate || endDate || minSavings) && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-muted-text">
              Filtered to <span className="font-semibold text-cream">{filteredTransactions.length}</span> of <span className="font-semibold">{transactions.length}</span> entries
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] text-danger hover:underline font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table Card */}
      <div className="glass-card rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="p-3 bg-surface-hover border border-surface-border rounded-2xl w-fit mx-auto mb-3 text-muted-text">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-cream">No results found</h3>
              <p className="text-xs text-muted-text max-w-xs mx-auto mt-1">
                We could not find any transaction matching your current filter criteria. Try adjusting your parameters or search term.
              </p>
              {(search || categoryFilter !== 'All' || startDate || endDate || minSavings) && (
                <button
                  onClick={clearFilters}
                  className="mt-3 bg-surface-hover border border-surface-border hover:bg-surface-border text-cream text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover/30 text-muted-text select-none">
                  {/* Date Column header */}
                  <th 
                    onClick={() => handleSort('date')}
                    className="py-3.5 px-6 font-semibold cursor-pointer hover:text-cream transition-colors items-center"
                  >
                    <span className="inline-flex items-center">
                      Date <SortIndicator field="date" />
                    </span>
                  </th>
                  {/* Category */}
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  {/* Reported Budget */}
                  <th 
                    onClick={() => handleSort('reported_amount')}
                    className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-cream transition-colors"
                  >
                    <span className="inline-flex items-center justify-end w-full">
                      Reported <SortIndicator field="reported_amount" />
                    </span>
                  </th>
                  {/* Actual Spend */}
                  <th 
                    onClick={() => handleSort('actual_spend')}
                    className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-cream transition-colors"
                  >
                    <span className="inline-flex items-center justify-end w-full">
                      Actual Spend <SortIndicator field="actual_spend" />
                    </span>
                  </th>
                  {/* Saved */}
                  <th 
                    onClick={() => handleSort('saved_amount')}
                    className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-cream transition-colors"
                  >
                    <span className="inline-flex items-center justify-end w-full">
                      Saved <SortIndicator field="saved_amount" />
                    </span>
                  </th>
                  {/* Notes */}
                  <th className="py-3.5 px-6 font-semibold">Notes</th>
                  {/* Actions */}
                  <th className="py-3.5 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40">
                {filteredTransactions.map((tx) => {
                  const rate = tx.reported_amount > 0 ? (tx.saved_amount / tx.reported_amount) * 100 : 0;
                  return (
                    <motion.tr 
                      layout
                      key={tx.id} 
                      className="group hover:bg-surface-hover/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-cream whitespace-nowrap">{tx.date}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-surface-hover border border-surface-border text-[10px] font-semibold text-foreground">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-muted-text font-medium">{currencySymbol}{tx.reported_amount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-muted-text font-medium">{currencySymbol}{tx.actual_spend.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-success">
                          +{currencySymbol}{tx.saved_amount.toLocaleString()}
                        </div>
                        <div className="text-[9.5px] text-muted-text">
                          {rate.toFixed(0)}% saved
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-text font-normal max-w-[200px] truncate" title={tx.notes}>
                        {tx.notes || <span className="opacity-40 italic">-</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(tx.id)}
                            className="p-1.5 bg-surface-hover border border-surface-border text-muted-text hover:text-cream rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 bg-surface-hover border border-surface-border text-muted-text hover:text-danger rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info bar */}
        {filteredTransactions.length > 0 && (
          <div className="bg-surface-hover/30 border-t border-surface-border/50 px-6 py-3 flex justify-between items-center text-[10px] text-muted-text">
            <span>
              Total: {filteredTransactions.length} logged transaction{filteredTransactions.length > 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-cream">
              Total Filtered Savings: {currencySymbol}{filteredTransactions.reduce((acc, t) => acc + t.saved_amount, 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editId={editingId}
      />
    </div>
  );
}
