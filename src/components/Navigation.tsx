'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  LineChart, 
  ArrowLeftRight, 
  Settings as SettingsIcon,
  Flame,
  PiggyBank,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { 
    streak, 
    transactions, 
    currencySymbol 
  } = useApp();



  const totalSaved = transactions.reduce((acc, t) => acc + t.saved_amount, 0);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-surface border-r border-surface-border p-6 fixed h-full z-20">
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cream-dark border border-cream/20 rounded-xl">
              <PiggyBank className="w-6 h-6 text-cream animate-pulse" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight text-cream">ShadowSave</h1>
              <span className="text-[10px] text-muted-text uppercase tracking-wider font-semibold">Finance Companion</span>
            </div>
          </div>

        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive 
                    ? 'text-cream bg-cream-dark/30 border border-cream/10' 
                    : 'text-muted-text hover:text-foreground hover:bg-surface-hover border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-5 bg-cream rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-cream' : 'text-muted-text'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - Streak & Total Savings */}
        <div className="mt-auto space-y-4 pt-6 border-t border-surface-border">
          {/* Streak Widget */}
          {streak > 0 ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-warning/10 to-danger/5 border border-warning/15 rounded-xl glow-hover"
            >
              <div className="p-1.5 bg-warning/20 rounded-lg text-warning">
                <Flame className="w-5 h-5 fill-current animate-bounce" />
              </div>
              <div>
                <div className="text-xs text-muted-text">Saving Streak</div>
                <div className="text-sm font-bold text-warning">{streak} Day{streak > 1 ? 's' : ''}</div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-surface-hover/50 border border-surface-border rounded-xl">
              <div className="p-1.5 bg-surface-border rounded-lg text-muted-text">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-text">Start Saving</div>
                <div className="text-xs font-semibold text-foreground">Log savings to streak!</div>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="p-3 bg-cream-dark/15 border border-cream/5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-text uppercase tracking-wider">Total Saved</div>
              <div className="text-base font-bold text-cream">{currencySymbol}{totalSaved.toLocaleString('en-IN')}</div>
            </div>
            <TrendingUp className="w-5 h-5 text-success opacity-85" />
          </div>
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden flex items-center justify-between bg-surface border-b border-surface-border p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cream-dark border border-cream/20 rounded-lg">
            <PiggyBank className="w-5 h-5 text-cream" />
          </div>
          <span className="font-semibold tracking-tight text-cream">ShadowSave</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 border border-warning/20 rounded-full text-warning text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>{streak} Days</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-surface-border py-2 px-4 flex justify-around items-center z-20">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-xs ${
                isActive ? 'text-cream' : 'text-muted-text hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>


    </div>
  );
};
