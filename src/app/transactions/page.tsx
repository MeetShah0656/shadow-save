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
  Plus,
  Download,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

type SortField = 'date' | 'reported_amount' | 'actual_spend' | 'saved_amount';
type SortOrder = 'asc' | 'desc';

export default function Transactions() {
  const { transactions, currencySymbol, deleteTransaction, user } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minSavings, setMinSavings] = useState('');

  const generateReceiptPDF = async (type: 'reported' | 'actual' | 'both') => {
    try {
      // Dynamically import jsPDF and jspdf-autotable to prevent SSR compiler crashes
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Calculate totals of filtered transactions
      const totalReported = filteredTransactions.reduce((acc, t) => acc + t.reported_amount, 0);
      const totalActual = filteredTransactions.reduce((acc, t) => acc + t.actual_spend, 0);
      const totalSaved = filteredTransactions.reduce((acc, t) => acc + t.saved_amount, 0);
      const savingsRate = totalReported > 0 ? (totalSaved / totalReported) * 100 : 0;

      // Header Banner
      doc.setFillColor(18, 18, 18);
      doc.rect(0, 0, 210, 45, 'F');

      // Title Branding
      doc.setTextColor(234, 230, 220); // Cream color (#EAE6DC)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('S H A D O W S A V E', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('PREMIUM PERSONAL FINANCE & LEDGER', 14, 30);

      // Date, Format & Account (Right Aligned)
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(`Date: ${today}`, 196, 20, { align: 'right' });
      
      const modeLabel = type === 'both' ? 'Comparison (Both)' : type === 'actual' ? 'Actual Spend Only' : 'Reported Budget Only';
      doc.text(`Format: ${modeLabel}`, 196, 26, { align: 'right' });
      
      if (user?.email) {
        doc.text(`Account: ${user.email}`, 196, 32, { align: 'right' });
      }

      // Active Filters
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ACTIVE FILTERS', 14, 56);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      
      const activeFilters: string[] = [];
      if (search) activeFilters.push(`Search: "${search}"`);
      if (categoryFilter !== 'All') activeFilters.push(`Category: ${categoryFilter}`);
      if (startDate || endDate) activeFilters.push(`Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`);
      if (minSavings) activeFilters.push(`Min Savings: ${currencySymbol}${minSavings}`);
      
      if (activeFilters.length === 0) {
        doc.text('None (Showing all entries)', 14, 62);
      } else {
        doc.text(activeFilters.join('  |  '), 14, 62);
      }

      // Summary Card Grid
      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(230, 225, 215);
      doc.rect(14, 72, 182, 28, 'FD');

      if (type === 'both') {
        // Card Headers
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text('REPORTED BUDGET', 20, 80);
        doc.text('ACTUAL SPEND', 65, 80);
        doc.text('NET SAVINGS', 110, 80);
        doc.text('SAVINGS RATE', 155, 80);

        // Card Values
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(`${currencySymbol}${totalReported.toLocaleString()}`, 20, 92);
        doc.text(`${currencySymbol}${totalActual.toLocaleString()}`, 65, 92);
        
        if (totalSaved >= 0) {
          doc.setTextColor(34, 139, 34); // Green
          doc.text(`+${currencySymbol}${totalSaved.toLocaleString()}`, 110, 92);
        } else {
          doc.setTextColor(178, 34, 34); // Red
          doc.text(`-${currencySymbol}${Math.abs(totalSaved).toLocaleString()}`, 110, 92);
        }
        
        doc.setTextColor(30, 30, 30);
        doc.text(`${savingsRate.toFixed(1)}%`, 155, 92);
      } else if (type === 'actual') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text('TOTAL ACTUAL SPEND', 20, 80);
        doc.text('TOTAL TRANSACTIONS', 110, 80);

        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text(`${currencySymbol}${totalActual.toLocaleString()}`, 20, 92);
        doc.text(`${filteredTransactions.length} entries`, 110, 92);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text('TOTAL REPORTED BUDGET', 20, 80);
        doc.text('TOTAL TRANSACTIONS', 110, 80);

        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text(`${currencySymbol}${totalReported.toLocaleString()}`, 20, 92);
        doc.text(`${filteredTransactions.length} entries`, 110, 92);
      }

      // Build Table Data
      let headers: string[][] = [];
      let data: string[][] = [];

      if (type === 'both') {
        headers = [['Date', 'Category', 'Reported Budget', 'Actual Spend', 'Saved Amount', 'Notes']];
        data = filteredTransactions.map(tx => [
          tx.date,
          tx.category,
          `${currencySymbol}${tx.reported_amount.toLocaleString()}`,
          `${currencySymbol}${tx.actual_spend.toLocaleString()}`,
          `+${currencySymbol}${tx.saved_amount.toLocaleString()}`,
          tx.notes || '-'
        ]);
      } else if (type === 'actual') {
        headers = [['Date', 'Category', 'Actual Spend', 'Notes']];
        data = filteredTransactions.map(tx => [
          tx.date,
          tx.category,
          `${currencySymbol}${tx.actual_spend.toLocaleString()}`,
          tx.notes || '-'
        ]);
      } else {
        headers = [['Date', 'Category', 'Reported Budget', 'Notes']];
        data = filteredTransactions.map(tx => [
          tx.date,
          tx.category,
          `${currencySymbol}${tx.reported_amount.toLocaleString()}`,
          tx.notes || '-'
        ]);
      }

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 110,
        theme: 'striped',
        headStyles: {
          fillColor: [18, 18, 18],
          textColor: [234, 230, 220],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [60, 60, 60]
        },
        alternateRowStyles: {
          fillColor: [250, 249, 246]
        },
        margin: { left: 14, right: 14 }
      });

      // Add page footers
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(
          'Thank you for using ShadowSave to track your budgets consciously.',
          105,
          287,
          { align: 'center' }
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          196,
          287,
          { align: 'right' }
        );
      }

      // Download
      const filename = `ShadowSave_Receipt_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

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
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Export PDF Receipt Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center justify-center gap-2 bg-surface-hover hover:bg-surface-border text-cream border border-surface-border px-4 py-2.5 rounded-xl transition-all cursor-pointer font-semibold text-xs h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Receipt</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {isExportOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50 flex flex-col space-y-1">
                  <button
                    onClick={() => {
                      generateReceiptPDF('both');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-cream hover:bg-surface-hover rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Comparison Receipt (Both)
                  </button>
                  <button
                    onClick={() => {
                      generateReceiptPDF('actual');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-muted-text hover:bg-surface-hover hover:text-cream rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Actual Spend Only
                  </button>
                  <button
                    onClick={() => {
                      generateReceiptPDF('reported');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-muted-text hover:bg-surface-hover hover:text-cream rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Reported Budget Only
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 bg-cream hover:bg-cream-dim text-background px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-cream/10 text-xs h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
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
