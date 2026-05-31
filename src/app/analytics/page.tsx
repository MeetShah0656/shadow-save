'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  CalendarRange
} from 'lucide-react';

export default function Analytics() {
  const { transactions, currencySymbol } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-text">
        <div className="animate-spin w-8 h-8 border-2 border-t-cream border-surface-border rounded-full mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Analyzing Financial Data...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="p-4 bg-surface border border-surface-border rounded-3xl text-muted-text mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-cream">Analytics Unavailable</h2>
        <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
          Please add some entries on the dashboard first. Once you have logged transaction history, we will build interactive charts for you.
        </p>
      </div>
    );
  }

  // --- 1. SAVINGS TREND DATA (Cumulative Savings over time) ---
  const getSavingsTrendData = () => {
    // Sort transactions ascending by date
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group savings by date
    const dateSavings: Record<string, number> = {};
    sorted.forEach((tx) => {
      dateSavings[tx.date] = (dateSavings[tx.date] || 0) + tx.saved_amount;
    });

    // Compute cumulative sum
    let cumulative = 0;
    const trendData = Object.keys(dateSavings).sort().map((date) => {
      cumulative += dateSavings[date];
      return {
        date,
        'Cumulative Savings': cumulative,
      };
    });

    return trendData;
  };

  // --- 2. SPENDING CATEGORIES DATA (Pie Chart actual spend) ---
  const getCategoriesData = () => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((tx) => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.actual_spend;
    });

    const colors: Record<string, string> = {
      Food: '#F5E6C8',         // Cream Accent
      Travel: '#E2D4B7',       // Lighter Muted Cream
      Shopping: '#F39C12',     // Gold Warning
      Fuel: '#2ECC71',         // Success Green
      Entertainment: '#E74C3C', // Danger Red
      College: '#9B59B6',      // Purple
      Bills: '#3498DB',        // Blue
      Other: '#8E8E8E',        // Muted Gray
    };

    return Object.keys(categoryTotals).map((cat) => ({
      name: cat,
      value: categoryTotals[cat],
      color: colors[cat] || '#8E8E8E',
    })).filter(item => item.value > 0);
  };

  // --- 3. WEEKLY SAVINGS DATA (Bar Chart, last 6 weeks) ---
  const getWeeklySavingsData = () => {
    // Get past 6 weeks bounds
    const weeklyData: Record<string, number> = {};
    const today = new Date();
    
    // Initialize 6 weeks
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i * 7);
      
      // Get start of that week (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      const label = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
      weeklyData[label] = 0;
    }

    // Assign transactions to weeks
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      // Find which week block it falls in
      Object.keys(weeklyData).forEach((label) => {
        const [m, d] = label.split('/').map(Number);
        const currentYear = today.getFullYear();
        // Construct Monday of that week
        const monday = new Date(currentYear, m - 1, d, 0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        if (txDate >= monday && txDate <= sunday) {
          weeklyData[label] += tx.saved_amount;
        }
      });
    });

    return Object.keys(weeklyData).map((key) => ({
      week: `Week of ${key}`,
      'Saved Amount': weeklyData[key],
    }));
  };

  // --- 4. MONTHLY COMPARISON DATA (Reported vs Actual) ---
  const getMonthlyComparisonData = () => {
    const monthlyTotals: Record<string, { reported: number; actual: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyTotals[monthLabel]) {
        monthlyTotals[monthLabel] = { reported: 0, actual: 0 };
      }
      monthlyTotals[monthLabel].reported += tx.reported_amount;
      monthlyTotals[monthLabel].actual += tx.actual_spend;
    });

    // Sort months chronologically
    return Object.keys(monthlyTotals)
      .sort((a, b) => {
        const [m1, y1] = a.split(' ');
        const [m2, y2] = b.split(' ');
        const date1 = new Date(parseInt(y1), monthNames.indexOf(m1));
        const date2 = new Date(parseInt(y2), monthNames.indexOf(m2));
        return date1.getTime() - date2.getTime();
      })
      .map((label) => ({
        month: label,
        Reported: monthlyTotals[label].reported,
        Actual: monthlyTotals[label].actual,
        Saved: Math.max(0, monthlyTotals[label].reported - monthlyTotals[label].actual),
      }));
  };

  const trendData = getSavingsTrendData();
  const categoriesData = getCategoriesData();
  const weeklyData = getWeeklySavingsData();
  const monthlyCompData = getMonthlyComparisonData();

  // Custom Glassmorphic Tooltip
  interface TooltipPayload {
    name: string;
    value: number;
    color?: string;
    fill?: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 border border-surface-border px-3 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-[11px] font-semibold">
          <p className="text-cream mb-1 border-b border-surface-border pb-1 font-bold">{label}</p>
          {payload.map((pld) => (
            <p key={pld.name} className="flex justify-between gap-4 py-0.5" style={{ color: pld.color || pld.fill }}>
              <span>{pld.name}:</span>
              <span>{currencySymbol}{pld.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">Analytics Dashboard</h2>
        <p className="text-xs md:text-sm text-muted-text">
          Deep-dive analysis of your reported expenses, spending distributions, and saving streaks.
        </p>
      </div>

      {/* Grid: Trend Line and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Savings Trend (Line Chart) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-surface-border">
          <h3 className="text-sm font-bold text-cream mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cream" /> Savings Trend (Cumulative Growth)
          </h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#8E8E8E" tickLine={false} axisLine={false} />
                <YAxis stroke="#8E8E8E" tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="Cumulative Savings" 
                  stroke="#F5E6C8" 
                  strokeWidth={2.5}
                  dot={{ fill: '#0A0A0A', stroke: '#F5E6C8', strokeWidth: 1.5, r: 4 }}
                  activeDot={{ fill: '#F5E6C8', stroke: '#0A0A0A', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Categories (Pie Chart) */}
        <div className="glass-card p-6 rounded-2xl border border-surface-border">
          <h3 className="text-sm font-bold text-cream mb-6 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cream" /> Spending Categories (Actual Spend)
          </h3>
          <div className="h-56 w-full text-xs relative flex items-center justify-center">
            {categoriesData.length === 0 ? (
              <div className="text-center text-muted-text">No spending recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom Legends */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-text border-t border-surface-border/50 pt-4">
            {categoriesData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name}</span>
                <span className="font-semibold text-cream ml-auto">{currencySymbol}{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Weekly Bar and Monthly Grouped Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Savings totals */}
        <div className="glass-card p-6 rounded-2xl border border-surface-border">
          <h3 className="text-sm font-bold text-cream mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cream" /> Weekly Savings Totals
          </h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="week" stroke="#8E8E8E" tickLine={false} axisLine={false} />
                <YAxis stroke="#8E8E8E" tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="Saved Amount" 
                  fill="#2ECC71" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison (Reported vs Actual) */}
        <div className="glass-card p-6 rounded-2xl border border-surface-border">
          <h3 className="text-sm font-bold text-cream mb-6 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-cream" /> Monthly Comparison (Reported vs Actual)
          </h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCompData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#8E8E8E" tickLine={false} axisLine={false} />
                <YAxis stroke="#8E8E8E" tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ color: '#8E8E8E' }} />
                <Bar 
                  dataKey="Reported" 
                  fill="#F5E6C8" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="Actual" 
                  fill="#E74C3C" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
