import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Coins,
  RefreshCw,
  Clock,
  CheckCircle2,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { user, minWithdrawal, userTransactions, convertPointsToCash, setCurrentView } = useApp();
  const [pointsInput, setPointsInput] = useState<number>(1000);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  const filteredTransactions = userTransactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const handleConvert = () => {
    if (pointsInput <= 0) return;
    convertPointsToCash(pointsInput);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>Auditable Ledger</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-time Accounting</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              My Wallet &amp; Balances 💼
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your comprehensive financial hub. Monitor your withdrawable balance, convert tournament reward points to cash, and audit your complete earning ledger.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setCurrentView('withdraw')}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-emerald-500/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>CASH OUT NOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Available Balance</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ${user ? user.availableBalance.toFixed(2) : '0.00'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            Min payout: ${minWithdrawal.toFixed(0)} (Standard Platform Rule)
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Pending Cashouts</span>
          <div className="text-3xl font-black text-amber-400 font-mono">
            ${user ? user.pendingBalance.toFixed(2) : '0.00'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">In gateway transmission</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Reward Points</span>
          <div className="text-3xl font-black text-amber-300 font-mono">
            {user?.points || 0} pts
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">Convertible 1,000 pts = $1.00</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Total Lifetime Payouts</span>
          <div className="text-3xl font-black text-sky-400 font-mono">
            ${user ? user.totalWithdrawals.toFixed(2) : '0.00'}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono block">All verified successful</span>
        </div>
      </div>

      {/* Points to Cash Converter Utility */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-base">Points to Cash Converter</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Rate: 1,000 pts = $1.00 USD</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min={500}
              step={100}
              value={pointsInput}
              onChange={(e) => setPointsInput(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Enter points (min 500)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
            />
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-center">
            <span className="text-slate-400 text-[10px] block">You will receive</span>
            <span className="font-black text-emerald-400 text-sm">
              +${(pointsInput / 1000).toFixed(2)} Cash
            </span>
          </div>

          <button
            onClick={handleConvert}
            disabled={!user || user.points < pointsInput || pointsInput < 500}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert to Cash
          </button>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Transaction Ledger &amp; History</h3>
            <p className="text-xs text-slate-400 font-mono">Immutable cryptographic records</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterType === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              All ({userTransactions.length})
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterType === 'credit' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Credits (+)
            </button>
            <button
              onClick={() => setFilterType('debit')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterType === 'debit' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Debits (-)
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-slate-500 text-xs py-8 text-center font-mono">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-300">{tx.id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] uppercase">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-200">{tx.description}</td>
                    <td className="p-3 text-slate-400">{tx.date}</td>
                    <td className="p-3 text-right font-bold">
                      <span className={tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                      {tx.points ? (
                        <span className="text-amber-400 text-[10px] block">+{tx.points} pts</span>
                      ) : null}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tx.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
