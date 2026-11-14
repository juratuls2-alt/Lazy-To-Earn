import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getHighestVipTier } from '../db/mockDb';
import { Crown, Clock, AlertTriangle, ShieldCheck, ArrowUpRight, RefreshCw } from 'lucide-react';

interface VipExpiryCountdownProps {
  compact?: boolean;
}

export const VipExpiryCountdown: React.FC<VipExpiryCountdownProps> = ({ compact = false }) => {
  const { user, effectiveVipTier, vipMembershipStatus, vipSystemSettings, setCurrentView } = useApp();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const lastTier = vipMembershipStatus?.lastPurchasedTier !== 'Free'
    ? vipMembershipStatus?.lastPurchasedTier || user.vipTier
    : user.vipTier;
  const highestTier = vipMembershipStatus?.highestTier || getHighestVipTier(user);

  const expiresAtIso =
    vipMembershipStatus?.expiresAt ||
    user.vipExpiresAt ||
    (user.vipExpiryDate ? `${user.vipExpiryDate}T23:59:59Z` : undefined);
  const activatedAtIso = vipMembershipStatus?.activatedAt || user.vipStartedAt;

  const expMs = expiresAtIso ? new Date(expiresAtIso).getTime() : 0;
  const diffMs = expMs > 0 ? expMs - nowMs : 0;
  const isPaidMember = (lastTier && lastTier !== 'Free') || highestTier !== 'Free';
  const isExpired = isPaidMember && (vipMembershipStatus?.status === 'expired' || (expMs > 0 && diffMs <= 0));
  const isActive = isPaidMember && !isExpired && effectiveVipTier !== 'Free';

  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const hours = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));
  const minutes = Math.max(0, Math.floor((diffMs % 3600000) / 60000));
  const seconds = Math.max(0, Math.floor((diffMs % 60000) / 1000));

  if (!isPaidMember) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">VIP Membership Status: Starter (Free)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Activate any VIP plan for <strong className="text-amber-400">{vipSystemSettings.validityDays}-day validity</strong> after payment verification. No automatic renewal charges.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('vip_membership')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>View VIP Plans</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
        isExpired
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40'
          : days <= 3
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40'
          : 'bg-gradient-to-r from-purple-950/35 via-slate-900 to-amber-950/20 border-purple-500/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Crown className={`w-4 h-4 ${isExpired ? 'text-rose-400' : 'text-amber-400'}`} />
            <h3 className="text-base font-extrabold text-white">
              {isExpired ? `${lastTier} VIP Expired` : `${effectiveVipTier} VIP Expiration Countdown`}
            </h3>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                isExpired
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isExpired ? 'Expired · Benefits Paused' : `Active · ${vipSystemSettings.validityDays}-Day Term`}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {isExpired ? (
              <>
                Your 30-day VIP period ended. VIP-only perks and dual withdrawal dates are paused until you renew{' '}
                <strong className="text-amber-300">{highestTier} VIP</strong> or upgrade to a higher tier.
              </>
            ) : (
              <>
                Activated:{' '}
                <span className="font-mono text-slate-200">
                  {activatedAtIso ? new Date(activatedAtIso).toLocaleDateString() : 'Verified'}
                </span>{' '}
                · Expires:{' '}
                <span className="font-mono text-amber-300">
                  {expiresAtIso ? new Date(expiresAtIso).toLocaleString() : '30-Day Term'}
                </span>
              </>
            )}
          </p>
          <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Manual renewal only — you are never automatically charged. Highest Tier Floor: {highestTier} (No Downgrades).</span>
          </p>
        </div>

        {/* Countdown Digits */}
        <div className="flex items-center gap-3 shrink-0">
          {isActive && expiresAtIso ? (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Days', val: days },
                { label: 'Hours', val: hours },
                { label: 'Mins', val: minutes },
                { label: 'Secs', val: seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[54px]"
                >
                  <div className="text-lg font-mono font-black text-amber-400 tabular-nums leading-none">
                    {String(item.val).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] font-mono uppercase text-slate-400 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>00d : 00h : 00m : 00s</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-mono">
              <Clock className="w-4 h-4" />
              <span>Active</span>
            </div>
          )}

          {!compact && (
            <button
              onClick={() => setCurrentView('vip_membership')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isExpired ? 'Renew VIP' : 'Manage'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
