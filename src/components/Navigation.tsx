'use client';

import React, { useState } from 'react';
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
  TrendingUp,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { 
    streak, 
    transactions, 
    currencySymbol,
    isPrivacyMode,
    hasPrivacyPin,
    setPrivacyPin,
    togglePrivacyMode
  } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'set' | 'enter'>('enter');
  const [pinStep, setPinStep] = useState<'enter_new' | 'confirm_new'>('enter_new');
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLockClick = () => {
    if (isPrivacyMode) {
      setPinAction('enter');
      setPinValue('');
      setPinError('');
      setShowPinModal(true);
    } else {
      if (!hasPrivacyPin) {
        setPinAction('set');
        setPinStep('enter_new');
        setPinValue('');
        setConfirmPinValue('');
        setTempPin('');
        setPinError('');
        setShowPinModal(true);
      } else {
        togglePrivacyMode('');
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    const currentVal = pinAction === 'set' && pinStep === 'confirm_new' ? confirmPinValue : pinValue;
    if (currentVal.length < 4) {
      const newVal = currentVal + val;
      updatePinState(newVal);
    }
  };

  const handleKeypadClear = () => {
    updatePinState('');
  };

  const handleKeypadBackspace = () => {
    const currentVal = pinAction === 'set' && pinStep === 'confirm_new' ? confirmPinValue : pinValue;
    if (currentVal.length > 0) {
      updatePinState(currentVal.slice(0, -1));
    }
  };

  const handleHiddenInputChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric.length <= 4) {
      updatePinState(numeric);
    }
  };

  const updatePinState = (newVal: string) => {
    setPinError('');
    if (pinAction === 'set') {
      if (pinStep === 'enter_new') {
        setPinValue(newVal);
        if (newVal.length === 4) {
          setTimeout(() => {
            setTempPin(newVal);
            setPinStep('confirm_new');
            setPinValue('');
          }, 200);
        }
      } else {
        setConfirmPinValue(newVal);
        if (newVal.length === 4) {
          setTimeout(() => {
            if (newVal === tempPin) {
              setPrivacyPin(newVal);
              togglePrivacyMode('');
              setShowPinModal(false);
            } else {
              setPinError('PINs do not match. Try again.');
              setPinStep('enter_new');
              setPinValue('');
              setConfirmPinValue('');
            }
          }, 200);
        }
      }
    } else {
      setPinValue(newVal);
      if (newVal.length === 4) {
        setTimeout(() => {
          const success = togglePrivacyMode(newVal);
          if (success) {
            setShowPinModal(false);
          } else {
            setPinError('Incorrect PIN. Please try again.');
            setPinValue('');
          }
        }, 200);
      }
    }
  };



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
          <button 
            onClick={handleLockClick}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPrivacyMode 
                ? 'bg-danger/10 border-danger/20 text-danger hover:bg-danger/20' 
                : 'bg-surface-hover border-surface-border text-muted-text hover:text-cream'
            }`}
            title={isPrivacyMode ? "Exit Privacy Mode" : "Enter Privacy Mode"}
          >
            {isPrivacyMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
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
        {!isPrivacyMode && (
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
        )}
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
          <button 
            onClick={handleLockClick}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPrivacyMode 
                ? 'bg-danger/10 border-danger/20 text-danger' 
                : 'bg-surface-hover border-surface-border text-muted-text'
            }`}
          >
            {isPrivacyMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* Mobile Streak */}
          {!isPrivacyMode && streak > 0 && (
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

      {/* PIN Verification / Creation Modal Overlay */}
      {showPinModal && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-xl z-55 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl relative">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-surface-hover border border-surface-border text-muted-text hover:text-cream cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-cream-dark/10 rounded-full border border-cream/20 text-cream">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-cream">
              {pinAction === 'set' 
                ? (pinStep === 'enter_new' ? 'Create Privacy PIN' : 'Confirm Privacy PIN')
                : 'Enter Privacy PIN'
              }
            </h3>
            
            <p className="text-xs text-muted-text mt-1 mb-6">
              {pinAction === 'set'
                ? (pinStep === 'enter_new' ? 'Set a 4-digit PIN to exit Privacy Mode later.' : 'Re-enter your 4-digit PIN to confirm.')
                : 'Enter your 4-digit PIN to restore full savings visibility.'
              }
            </p>

            {/* Dots indicator */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => {
                const currentVal = pinAction === 'set' && pinStep === 'confirm_new' ? confirmPinValue : pinValue;
                const isFilled = index < currentVal.length;
                return (
                  <div
                    key={index}
                    className={`w-4.5 h-4.5 rounded-full border transition-all duration-150 ${
                      isFilled 
                        ? 'bg-cream border-cream scale-110 shadow-lg shadow-cream/25' 
                        : 'border-surface-border bg-surface-hover'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs text-danger font-medium mb-4">{pinError}</p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3 bg-surface-hover hover:bg-surface-border text-cream font-bold rounded-xl transition-colors cursor-pointer text-sm border border-surface-border/40"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleKeypadClear}
                className="py-3 text-muted-text hover:text-cream font-medium rounded-xl transition-colors cursor-pointer text-xs"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-surface-hover hover:bg-surface-border text-cream font-bold rounded-xl transition-colors cursor-pointer text-sm border border-surface-border/40"
              >
                0
              </button>
              <button
                onClick={handleKeypadBackspace}
                className="py-3 text-muted-text hover:text-cream font-medium rounded-xl transition-colors cursor-pointer text-xs"
              >
                Delete
              </button>
            </div>

            {/* Invisible Mobile Keyboard Input */}
            <input
              type="tel"
              pattern="[0-9]*"
              maxLength={4}
              value={pinAction === 'set' && pinStep === 'confirm_new' ? confirmPinValue : pinValue}
              onChange={(e) => handleHiddenInputChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-default"
              autoFocus
            />
          </div>
        </div>
      )}

    </div>
  );
};
