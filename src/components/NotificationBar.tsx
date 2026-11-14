import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, ChevronRight, Sparkles, X, AlertCircle } from 'lucide-react';

export const NotificationBar: React.FC = () => {
  const { user, minWithdrawal, setCurrentView, toasts, dismissToast } = useApp();

  const balance = user?.availableBalance ?? 0;
  const progressPercent = Math.min(100, Math.round((balance / minWithdrawal) * 100));
  const deficit = Math.max(0, +(minWithdrawal - balance).toFixed(2));

  const updates = [
    '🔥 Shakil (Dhaka) just withdrew $120.00 via bKash 2 mins ago',
    '⚡ System Alert: bKash & Nagad instant payout channels are 100% active',
    '🎉 Ayesha K. received $10.00 referral reward for inviting a classmate',
    '💎 Siyam unlocked 1.8x Streak Multiplier on Day 6',
    '💰 Kamal (Sylhet) cashed out $100.00 via Nagad',
    '🚀 High-CPM Boost: Earn +$2.50 by clicking "Earn More" links',
    '🌐 USDT TRC20 withdrawals processed with $0 network fee',
  ];

  return (
    <div className="w-full flex flex-col bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
      {/* Upper Live Ticker Bar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 border-b border-slate-800/50 text-xs overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-800">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Bell className="w-3 h-3 text-amber-400" />
            Live Updates
          </span>
        </div>

        {/* Marquee Text */}
        <div className="overflow-hidden whitespace-nowrap flex-1 ml-3 select-none">
          <div className="animate-marquee inline-flex items-center gap-8 text-slate-300 text-xs font-mono">
            {updates.concat(updates).map((text, idx) => (
              <span key={idx} className="flex items-center gap-2 shrink-0">
                <span>{text}</span>
                <span className="text-slate-600">/</span>
              </span>
            ))}
          </div>
        </div>

        {/* Quick Official Blog Link */}
        <a
          href="https://lasytoearn.blogspot.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded border border-amber-500/20 transition-colors shrink-0"
        >
          <span>Official Blog</span>
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* User's Real-time Progress Bar towards $100 Payout */}
      <div className="px-3 md:px-6 py-1.5 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-200">Withdrawal Goal:</span>
            <span className="font-mono tabular-nums font-bold text-amber-400">${balance.toFixed(2)}</span>
            <span className="text-slate-500">/ ${minWithdrawal.toFixed(2)}</span>
          </div>

          {/* Progress bar line */}
          <div className="flex-1 max-w-md h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
            {progressPercent}%
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {progressPercent >= 100 ? (
            <button
              onClick={() => setCurrentView('withdraw')}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-all shadow-md flex items-center gap-1 cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
              <span>Cash Out $100+ Now</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                Need <strong className="text-amber-400 font-mono">${deficit.toFixed(2)}</strong> more
              </span>
              <button
                onClick={() => setCurrentView('watch_ads')}
                className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-medium rounded transition-colors"
              >
                Watch Ads
              </button>
              <button
                onClick={() => setCurrentView('refer')}
                className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium rounded transition-colors"
              >
                Refer (+$10)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toasts container */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-xl backdrop-blur-md flex items-start justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'bonus'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'bonus' ? (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-xs">{toast.title}</p>
                <p className="text-xs opacity-90 leading-relaxed mt-0.5">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
