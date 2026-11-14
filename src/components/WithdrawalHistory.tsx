import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  CheckCircle2,
  Clock,
  Filter,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import { AdBanner } from './AdBanner';

export const WithdrawalHistory: React.FC = () => {
  const { user, userWithdrawals, setCurrentView } = useApp();
  const [filter, setFilter] = useState<string>('all');

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">Please sign in to view your private payout history.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Filter ONLY this logged-in user's records
  const filtered = userWithdrawals.filter((w) => {
    if (filter === 'all') return true;
    return w.status.toLowerCase() === filter.toLowerCase();
  });

  // Calculate stats separately as required:
  // 1. Total withdrawal requests amount
  const totalRequestedAmount = userWithdrawals.reduce((sum, item) => sum + item.amount, 0);

  // 2. Total successful (Paid) payouts amount
  const totalSuccessfulAmount = userWithdrawals
    .filter((w) => w.status === 'Paid')
    .reduce((sum, item) => sum + item.amount, 0);

  // 3. Pending requests amount
  const totalPendingAmount = userWithdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      <AdBanner slot="leaderboard_728x90" label="Payment Verification Sponsor" showBonusAction />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <History className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Personal Payout History</h1>
              <p className="text-xs text-slate-400">
                Private ledger for <strong className="text-slate-200">{user.name}</strong> (User ID: <span className="text-amber-400 font-mono">{user.id}</span>). Only you can view these records.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('withdraw')}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md cursor-pointer whitespace-nowrap"
        >
          Request Withdrawal
        </button>
      </div>

      {/* KPI Cards: Total Withdrawal Amount & Total Successful Payouts Separately */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Successful Payouts */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total Successful Payouts (Paid)
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            ${totalSuccessfulAmount.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {userWithdrawals.filter((w) => w.status === 'Paid').length} Completed Transactions
          </span>
        </div>

        {/* Card 2: Total Withdrawal Requests */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total Requested Withdrawals
          </span>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            ${totalRequestedAmount.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {userWithdrawals.length} Total Requests Submitted
          </span>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Pending / In Review
          </span>
          <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
            ${totalPendingAmount.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Awaiting Admin Verification
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {['all', 'Pending', 'Processing', 'Paid', 'Rejected'].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter.toLowerCase() === opt.toLowerCase()
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt === 'all' ? 'All Payouts' : opt}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filtered.length} of {userWithdrawals.length} records for {user.id}
        </span>
      </div>

      {/* Table displaying required information */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-3.5 px-4 font-semibold">Request Date</th>
                <th className="py-3.5 px-4 font-semibold">Method &amp; Account</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                <th className="py-3.5 px-4 font-semibold">Payment Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Admin Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No withdrawal records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {filter !== 'all'
                        ? `You have no payout records with status "${filter}".`
                        : 'Your payout history is currently empty. Submit a cashout to view transactions here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Transaction ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {w.id}
                    </td>

                    {/* Request Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {w.requestDate}
                    </td>

                    {/* Payment Method & Masked Account */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            w.paymentMethod === 'bKash'
                              ? 'bg-[#E2136E]'
                              : w.paymentMethod === 'Nagad'
                              ? 'bg-[#F7941D]'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="font-semibold text-slate-200">{w.paymentMethod}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {w.accountNumberMasked}
                      </div>
                    </td>

                    {/* Withdrawal Amount */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-white text-sm tabular-nums">
                      ${w.amount.toFixed(2)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : w.status === 'Approved'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : w.status === 'Processing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : w.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {w.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{w.status}</span>
                      </span>
                      {w.rejectionReason && (
                        <span className="block text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate">
                          {w.rejectionReason}
                        </span>
                      )}
                    </td>

                    {/* Payment Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs whitespace-nowrap">
                      {w.paymentDate || '—'}
                    </td>

                    {/* Admin Transaction Reference */}
                    <td className="py-3.5 px-4 font-mono text-right text-xs">
                      {w.adminTransactionReference ? (
                        <span className="font-bold text-amber-400">
                          {w.adminTransactionReference}
                        </span>
                      ) : (
                        <span className="text-slate-600">Pending Review</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdBanner slot="rectangle_300x250" label="Ad Network Sponsor" showBonusAction />
        <AdBanner slot="banner_468x60" label="High Revenue Partner" showBonusAction />
      </div>
    </div>
  );
};
