import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VIP_TIER_RANK, getHighestVipTier } from '../db/mockDb';
import { VIPTierLevel } from '../types';
import { VipExpiryCountdown } from './VipExpiryCountdown';
import {
  Crown,
  CheckCircle2,
  Lock,
  ShieldCheck,
  History,
  X,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const VipMembership: React.FC = () => {
  const {
    user,
    effectiveVipTier,
    vipSystemSettings,
    vipTiersConfig,
    vipMembershipStatus,
    purchaseVip,
  } = useApp();

  const [checkoutTier, setCheckoutTier] = useState<VIPTierLevel | null>(null);
  const paymentMethod = 'Wallet Balance' as const;
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');

  const highestTier: VIPTierLevel =
    vipMembershipStatus?.highestTier && VIP_TIER_RANK[vipMembershipStatus.highestTier] > 0
      ? vipMembershipStatus.highestTier
      : getHighestVipTier(user);

  const highestRank = VIP_TIER_RANK[highestTier] || 0;
  const activeRank = VIP_TIER_RANK[effectiveVipTier] || 0;
  const isExpired = vipMembershipStatus?.status === 'expired' || (highestRank > 0 && activeRank === 0);

  const tiers: VIPTierLevel[] = ['Free', 'Bronze', 'Silver', 'Gold', 'Platinum'];
  const history = vipMembershipStatus?.history || [];

  const openPaymentModal = (tier: VIPTierLevel) => {
    setCheckoutTier(tier);
    setPaymentReference(`WAL-${Date.now().toString(36).toUpperCase()}`);
    setPaymentConfirmed(false);
    setCheckoutError('');
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTier) return;
    if (!paymentConfirmed) {
      setCheckoutError('Please confirm payment verification to activate your 30-day VIP period.');
      return;
    }
    setSubmitting(true);
    setCheckoutError('');
    const res = await purchaseVip(checkoutTier, paymentMethod, paymentReference.trim() || `WAL-${Date.now()}`);
    setSubmitting(false);
    if (res.success) {
      setCheckoutTier(null);
    } else {
      setCheckoutError(res.error || 'Unable to verify and activate membership.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-amber-950/40 border border-purple-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>{vipSystemSettings.validityDays}-Day Fixed Validity</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Up to 2.5X Earnings Multiplier · No Auto-Charge</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              VIP Membership Tiers 👑
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Activate any VIP tier for <strong className="text-amber-300">{vipSystemSettings.validityDays} days</strong> upon verified payment. Unlock boosted multipliers on arcade games and ad tasks, daily free spins, and VIP Clubhouse privileges. Downgrades are disabled during and after membership.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[175px]">
            <span className="block text-[10px] text-slate-400 font-mono uppercase">Active VIP Access</span>
            <span className={`text-2xl font-black font-mono block ${isExpired ? 'text-rose-400' : 'text-amber-400'}`}>
              {isExpired ? 'Expired' : `${effectiveVipTier} VIP`}
            </span>
            {highestRank > 0 && (
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                Tier Floor: <strong className="text-purple-300">{highestTier}</strong> (No Downgrades)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live 30-Day Expiration Countdown */}
      <VipExpiryCountdown compact />

      {/* Policy Rules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Every VIP activation runs for <strong className="text-white">{vipSystemSettings.validityDays} days</strong> after payment verification.</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-slate-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong className="text-white">No Downgrades:</strong> Users cannot switch below their highest tier ({highestTier}) during or after expiry.</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-slate-300">
          <RefreshCw className="w-4 h-4 text-sky-400 shrink-0" />
          <span><strong className="text-white">Manual Renewal Only:</strong> Never auto-charged. Expired VIP perks pause until renewed.</span>
        </div>
      </div>

      {/* Tiers Pricing Grid (NO Minimum Withdrawal Amount displayed anywhere) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiers.map((tName) => {
          const config = vipTiersConfig[tName];
          const tRank = VIP_TIER_RANK[tName] || 0;
          const isActiveCurrent = effectiveVipTier === tName && !isExpired;
          const isLowerThanFloor = highestRank > 0 && tRank < highestRank;
          const isSameAsFloor = highestRank > 0 && tRank === highestRank;
          const isHigherThanFloor = tRank > highestRank;

          return (
            <div
              key={tName}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                isActiveCurrent
                  ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-400 shadow-xl scale-102'
                  : isLowerThanFloor
                  ? 'bg-slate-900/50 border-slate-800/70 opacity-75'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${config.badgeColor}`}>
                    {config.tier}
                  </span>
                  {isActiveCurrent && (
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">Active Tier</span>
                  )}
                  {isExpired && isSameAsFloor && (
                    <span className="text-[10px] font-bold text-rose-400 font-mono">Expired</span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-lg">{config.name}</h3>
                  <div className="mt-2 font-mono">
                    <span className="text-2xl font-black text-white">
                      ${config.priceMonthly === 0 ? '0' : config.priceMonthly.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {config.priceMonthly === 0 ? '/forever' : ` / ${vipSystemSettings.validityDays} days`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Task Multiplier:</span>
                    <span className="font-bold text-amber-400">{config.multiplier}x</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Free Spins:</span>
                    <span className="font-bold text-white">{config.dailyFreeSpins} / day</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Free Scratches:</span>
                    <span className="font-bold text-white">{config.dailyFreeScratches} / day</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Referral Reward:</span>
                    <span className="font-bold text-emerald-400">${config.referralBonus.toFixed(0)} / friend</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Payout Speed:</span>
                    <span className="text-slate-300 font-medium">{config.payoutSpeed}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  {config.perks
                    .filter((p) => !/min.*withdraw|min.*payout/i.test(p))
                    .map((perk, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800">
                {tName === 'Free' && highestRank === 0 ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs cursor-default"
                  >
                    Starter Plan
                  </button>
                ) : isLowerThanFloor ? (
                  <button
                    disabled
                    title={`Cannot downgrade below ${highestTier} VIP`}
                    className="w-full py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>No Downgrades</span>
                  </button>
                ) : isSameAsFloor ? (
                  vipSystemSettings.allowRenewal ? (
                    <button
                      onClick={() => openPaymentModal(tName)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {isExpired ? 'Renew' : 'Extend'} {vipSystemSettings.validityDays}d (${config.priceMonthly.toFixed(2)})
                      </span>
                    </button>
                  ) : (
                    <button disabled className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs">
                      Renewals Paused
                    </button>
                  )
                ) : isHigherThanFloor ? (
                  highestRank > 0 && !vipSystemSettings.allowUpgrades ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Upgrades Paused</span>
                    </button>
                  ) : highestRank > 0 && isExpired && !vipSystemSettings.allowUpgradeWhileExpired ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed"
                    >
                      Renew Current Tier First
                    </button>
                  ) : (
                    <button
                      onClick={() => openPaymentModal(tName)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 transition-all hover:scale-102"
                    >
                      {highestRank > 0 ? 'Upgrade' : 'Activate'} {vipSystemSettings.validityDays}d (${config.priceMonthly.toFixed(2)})
                    </button>
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permanent VIP Purchase & Upgrade History Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Permanent Membership Purchase &amp; Upgrade History</span>
            </h2>
            <p className="text-xs text-slate-400">
              All verified 30-day activations, renewals, and upgrades are preserved permanently.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{history.length} Total Records</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-6 text-center">
            No VIP membership purchases recorded yet for this account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Tier Change</th>
                  <th className="p-3">Payment Verified</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-300 font-bold">{h.id}</td>
                    <td className="p-3 uppercase text-amber-300 font-bold">{h.actionType}</td>
                    <td className="p-3 text-white">
                      {h.fromTier} → <strong className="text-purple-300">{h.toTier}</strong>
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="text-emerald-400">✓ Verified</span> ({h.paymentMethod} · {h.paymentReference})
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(h.activatedAt).toLocaleDateString()} → {new Date(h.expiresAt).toLocaleDateString()} ({h.validityDays}d)
                    </td>
                    <td className="p-3 text-right font-bold text-white">${Number(h.amountPaid).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          h.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : h.status === 'expired'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Verification Modal (Required before starting 30-day period) */}
      {checkoutTier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmPurchase}
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Verify Payment · {vipTiersConfig[checkoutTier]?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutTier(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="text-white font-bold">{vipTiersConfig[checkoutTier]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validity Period:</span>
                <span className="text-emerald-400 font-bold">{vipSystemSettings.validityDays} Days (No Auto-Charge)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Due:</span>
                <span className="text-amber-400 font-black">
                  ${(vipTiersConfig[checkoutTier]?.priceMonthly || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-300">Payment Method</label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-white">Wallet Balance</span>
                <span className={`font-mono font-bold ${
                  (user?.availableBalance || 0) >= (vipTiersConfig[checkoutTier]?.priceMonthly || 0)
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  ${(user?.availableBalance || 0).toFixed(2)} available
                </span>
              </div>
              {(user?.availableBalance || 0) < (vipTiersConfig[checkoutTier]?.priceMonthly || 0) && (
                <p className="text-[11px] text-rose-400 font-mono">
                  Insufficient wallet balance. Earn more cash from games, ads, or missions to activate this plan.
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-300">Wallet Payment Reference ID</label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="WAL-REFERENCE"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
                className="mt-0.5 accent-amber-500"
              />
              <span>
                I confirm this payment for <strong>{vipSystemSettings.validityDays}-day</strong> access. I understand downgrades are not permitted during or after membership, and no automatic renewal charges apply.
              </span>
            </label>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutTier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Verifying Payment...' : 'Verify & Activate 30 Days'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
