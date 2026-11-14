import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Tv,
  Users,
  Coins,
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { AdBanner } from './AdBanner';
import { MonthlyWithdrawalCountdown } from './MonthlyWithdrawalCountdown';

export const WithdrawSection: React.FC = () => {
  const {
    user,
    minWithdrawal,
    withdrawalScheduleStatus,
    submitWithdrawal,
    setCurrentView,
    userWithdrawals,
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    user?.preferredPaymentMethod || 'bKash'
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    user?.bkashNumber || '01712894520'
  );
  const [amount, setAmount] = useState<string>(String(minWithdrawal.toFixed(2)));
  const [accountType, setAccountType] = useState<'Personal' | 'Agent'>('Personal');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">Please sign in to view your private withdrawal page.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setErrorMsg('');
    setSuccessMsg('');
    if (method === 'bKash') {
      setAccountNumber(user.bkashNumber || '');
    } else if (method === 'Nagad') {
      setAccountNumber(user.nagadNumber || '');
    } else if (method === 'Crypto') {
      setAccountNumber(user.usdtWallet || '');
    }
  };

  // Check if user already has a pending or processing request
  const hasPendingRequest = userWithdrawals.some(
    (w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved'
  );

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!withdrawalScheduleStatus.withdrawalsEnabled) {
      setErrorMsg('Withdrawals are currently paused by platform administration.');
      return;
    }

    if (!withdrawalScheduleStatus.isWindowOpen) {
      setErrorMsg(
        `Withdrawal window is currently closed (${withdrawalScheduleStatus.timezone}). Next window opens on ${withdrawalScheduleStatus.nextWindow.dateFormatted}.`
      );
      return;
    }

    if (withdrawalScheduleStatus.remainingThisMonth <= 0) {
      setErrorMsg(
        `Monthly withdrawal limit reached (${withdrawalScheduleStatus.usedThisMonth}/${withdrawalScheduleStatus.monthlyLimit} used this month).`
      );
      return;
    }

    // Prevent duplicate pending requests
    if (hasPendingRequest) {
      setErrorMsg('You already have a pending withdrawal request in queue. Duplicate requests are prevented.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minWithdrawal) {
      setErrorMsg(`Minimum withdrawal must be at least $${minWithdrawal.toFixed(2)}.`);
      return;
    }
    if (numAmount > withdrawalScheduleStatus.maxWithdrawal) {
      setErrorMsg(`Maximum single withdrawal is $${withdrawalScheduleStatus.maxWithdrawal.toFixed(2)}.`);
      return;
    }

    if (numAmount > user.availableBalance) {
      setErrorMsg(`Cannot withdraw more than available balance ($${user.availableBalance.toFixed(2)}).`);
      return;
    }

    // Validate bKash / Nagad number (BD format 11 digits)
    if (selectedMethod === 'bKash' || selectedMethod === 'Nagad') {
      const cleanPhone = accountNumber.replace(/\D/g, '');
      if (cleanPhone.length < 11 || (!cleanPhone.startsWith('01') && !cleanPhone.startsWith('8801'))) {
        setErrorMsg(`Please enter a valid 11-digit ${selectedMethod} phone number (e.g. 01712894520).`);
        return;
      }
    } else if (accountNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid wallet address or Binance Pay ID.');
      return;
    }

    setSubmitting(true);
    const result = await submitWithdrawal(selectedMethod, numAmount, accountNumber, accountType);
    setSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Withdrawal of $${numAmount.toFixed(2)} via ${selectedMethod} submitted successfully! Awaiting administrator approval.`);
      setAmount(minWithdrawal.toFixed(2));
    } else {
      setErrorMsg(result.error || 'Failed to submit withdrawal request.');
    }
  };

  const canAfford = user.availableBalance >= minWithdrawal;
  const parsedAmount = parseFloat(amount || '0') || 0;
  const feeRate = (withdrawalScheduleStatus.feePercent || 0) / 100;
  const calculatedFee = +(parsedAmount * feeRate).toFixed(2);
  const netUsd = Math.max(0, +(parsedAmount - calculatedFee).toFixed(2));
  const canSubmitNow = withdrawalScheduleStatus.isEligibleNow && canAfford && !hasPendingRequest && !submitting;
  const remaining = Math.max(0, +(minWithdrawal - user.availableBalance).toFixed(2));
  const progressPercent = Math.min(100, Math.round((user.availableBalance / minWithdrawal) * 100));

  return (
    <div className="space-y-6 pb-12">
      <AdBanner slot="leaderboard_728x90" label="Verified Financial Network Sponsor" showBonusAction />

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Withdrawal Portal</h1>
              <p className="text-xs text-slate-400">
                Official payout gateway for <strong className="text-slate-200">{user.name}</strong> ({user.id}). Minimum cashout is $100.00.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Available Balance</span>
            <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              ${user.availableBalance.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => setCurrentView('history')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            My Payout History
          </button>
        </div>
      </div>

      {/* Live Monthly Withdrawal Schedule & Dual VIP Countdown */}
      <MonthlyWithdrawalCountdown />

      {/* Duplicate Pending Warning */}
      {hasPendingRequest && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You already have a pending withdrawal request in review. Per system security rules, duplicate requests cannot be submitted until your previous payout is processed.
            </span>
          </div>
          <button
            onClick={() => setCurrentView('history')}
            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0"
          >
            Track Status
          </button>
        </div>
      )}

      {/* Threshold Warning if balance < $100 */}
      {!canAfford && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Minimum Payout Threshold: $100.00
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              You currently have <strong className="text-emerald-400 font-mono">${user.availableBalance.toFixed(2)}</strong>. You need <strong className="text-amber-400 font-mono">${remaining.toFixed(2)}</strong> more to withdraw.
            </p>
            <div className="w-full max-w-md h-2 bg-slate-950 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('watch_ads')}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Watch Ads</span>
            </button>
            <button
              onClick={() => setCurrentView('refer')}
              className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Refer Friends (+$10)</span>
            </button>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4">
            Dedicated Withdrawal Form
          </h2>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleMethodChange('bKash')}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMethod === 'bKash'
                  ? 'bg-[#E2136E]/15 border-[#E2136E] text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#E2136E] flex items-center justify-center text-white font-extrabold text-sm shadow">
                bK
              </div>
              <span className="text-xs font-bold">bKash</span>
              <span className="text-[10px] text-slate-400 font-mono">Personal / Agent</span>
            </button>

            <button
              type="button"
              onClick={() => handleMethodChange('Nagad')}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMethod === 'Nagad'
                  ? 'bg-[#F7941D]/15 border-[#F7941D] text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F7941D] flex items-center justify-center text-slate-950 font-extrabold text-sm shadow">
                NG
              </div>
              <span className="text-xs font-bold">Nagad</span>
              <span className="text-[10px] text-slate-400 font-mono">Personal / Agent</span>
            </button>

            <button
              type="button"
              onClick={() => handleMethodChange('Crypto')}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMethod === 'Crypto'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow">
                <Coins className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-xs font-bold">Crypto</span>
              <span className="text-[10px] text-slate-400 font-mono">USDT TRC20</span>
            </button>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Auto-populated User Name & User ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  User Name (Auto-populated)
                </label>
                <input
                  type="text"
                  readOnly
                  value={user.name}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs font-medium cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  User ID (Auto-populated)
                </label>
                <input
                  type="text"
                  readOnly
                  value={user.id}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-amber-400 font-mono text-xs cursor-not-allowed select-none font-bold"
                />
              </div>
            </div>

            {/* Available Balance Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Available Balance
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Current Balance:</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">
                  ${user.availableBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* bKash / Nagad Number Input & Account Type */}
            {(selectedMethod === 'bKash' || selectedMethod === 'Nagad') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedMethod} Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712894520"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType('Personal')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        accountType === 'Personal'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('Agent')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        accountType === 'Agent'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      Agent
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'Crypto' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  USDT (TRC20) Wallet Address / Binance Pay ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TQ8s... or Binance Pay ID"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none text-white text-xs font-mono"
                />
              </div>
            )}

            {/* Withdrawal Amount (Minimum $100) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Withdrawal Amount (USD)
                </label>
                <span className="text-[11px] font-mono text-amber-400">
                  Minimum: $100.00
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="100.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none text-white font-mono font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAmount(canAfford ? user.availableBalance.toFixed(2) : '100.00')}
                  className="absolute right-2.5 top-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-mono uppercase font-bold transition-colors cursor-pointer"
                >
                  Max
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Payout Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount:</span>
                <span className="text-white">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee ({withdrawalScheduleStatus.feePercent}%):</span>
                <span className={calculatedFee > 0 ? 'text-amber-300' : 'text-emerald-400'}>
                  ${calculatedFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1.5 border-t border-slate-800 font-bold">
                <span>Net Estimated Disbursement:</span>
                <span className="text-amber-400">
                  {selectedMethod === 'Crypto'
                    ? `${netUsd.toFixed(2)} USDT`
                    : `$${netUsd.toFixed(2)} (~${(netUsd * 120.0).toLocaleString()} BDT)`}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmitNow}
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                canSubmitNow
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Validating Schedule & Submitting...'
                  : hasPendingRequest
                  ? 'Request In Review'
                  : !withdrawalScheduleStatus.isWindowOpen
                  ? `Window Closed (Opens ${withdrawalScheduleStatus.nextWindow.dateFormatted})`
                  : withdrawalScheduleStatus.remainingThisMonth <= 0
                  ? 'Monthly Withdrawal Limit Reached'
                  : canAfford
                  ? `Submit Withdrawal Request ($${parsedAmount.toFixed(2)})`
                  : `Need $${remaining.toFixed(2)} more for $${minWithdrawal.toFixed(0)} min payout`}
              </span>
            </button>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Payment Policy &amp; Security
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  1. Administrator Approval
                </span>
                <span>
                  All payouts require manual administrator verification to prevent automated abuse before disbursement.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  2. Strict User Isolation
                </span>
                <span>
                  Your payment account number and transaction history are stored under your unique User ID ({user.id}) and can never be seen by other users.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  3. Payout Timeframe
                </span>
                <span>
                  bKash and Nagad transfers typically complete within 1–3 hours of approval.
                </span>
              </div>
            </div>
          </div>

          <AdBanner slot="rectangle_300x250" label="Sponsor Link" showBonusAction />
        </div>
      </div>
    </div>
  );
};
