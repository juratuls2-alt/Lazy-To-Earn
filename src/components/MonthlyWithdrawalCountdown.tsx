import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { evaluateWithdrawalSchedule } from '../utils/withdrawalScheduler';
import { SingleWindowCountdown } from '../types';
import { Calendar, Clock, Crown, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface MonthlyWithdrawalCountdownProps {
  compact?: boolean;
}

const CountdownDigits: React.FC<{ win: SingleWindowCountdown }> = ({ win }) => {
  const { days, hours, minutes, seconds } = win.countdown;
  const cells = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Mins', value: minutes },
    { label: 'Secs', value: seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((c) => (
        <div
          key={c.label}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center"
        >
          <div className="text-lg sm:text-xl font-mono font-black text-white tabular-nums leading-none">
            {String(c.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] font-mono uppercase text-slate-400 mt-1">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export const MonthlyWithdrawalCountdown: React.FC<MonthlyWithdrawalCountdownProps> = ({
  compact = false,
}) => {
  const { user, withdrawalScheduleConfig, userWithdrawals, setCurrentView, effectiveVipTier, vipMembershipStatus } = useApp();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const status = evaluateWithdrawalSchedule(
    withdrawalScheduleConfig,
    effectiveVipTier,
    userWithdrawals,
    user?.availableBalance || 0,
    now
  );

  const recentMonthlyHistory = userWithdrawals.slice(0, 4);
  const isVipExpired = vipMembershipStatus?.status === 'expired';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      {isVipExpired && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your 30-day <strong>{vipMembershipStatus?.highestTier} VIP</strong> membership expired. Withdrawal eligibility follows Standard member rules (28th only) until you renew or upgrade.
            </span>
          </div>
          <button
            onClick={() => setCurrentView('vip_membership')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Renew VIP
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">
              Monthly Withdrawal Schedule
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {status.timezone} · {status.serverTimeFormatted} ·{' '}
            <span className={status.isVipMember ? 'text-purple-300 font-bold' : 'text-slate-300'}>
              {status.isVipMember ? `VIP (${effectiveVipTier}) — 2 Windows/Month` : 'Standard — 1 Window/Month'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span
            className={`font-bold ${
              status.isEligibleNow
                ? 'text-emerald-400'
                : status.isWindowOpen
                ? 'text-amber-400'
                : 'text-slate-300'
            }`}
          >
            {status.isEligibleNow
              ? 'Eligible · Window Open'
              : status.isWindowOpen
              ? 'Window Open (Check Criteria)'
              : 'Window Closed'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 tabular-nums">
            Remaining: <strong className="text-white">{status.remainingThisMonth}</strong> / {status.monthlyLimit}
          </span>
        </div>
      </div>

      {/* Countdown Timers: 2 separate timers for VIP members, 1 for Standard */}
      <div
        className={`grid gap-4 ${
          status.isVipMember && status.vipWindows.length >= 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {(status.isVipMember && status.vipWindows.length > 0
          ? status.vipWindows
          : [status.nextWindow]
        ).map((win) => (
          <div
            key={win.label}
            className={`p-4 rounded-xl border space-y-3 ${
              win.isOpen
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {status.isVipMember ? (
                  <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">{win.label}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Next Date: <strong className="text-amber-300">{win.dateFormatted}</strong>
                  </div>
                </div>
              </div>

              <span
                className={`text-[11px] font-mono font-bold ${
                  win.isOpen ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {win.isOpen ? 'Closes In' : 'Opens In'}
              </span>
            </div>

            <CountdownDigits win={win} />
          </div>
        ))}
      </div>

      {/* Eligibility & Quota Status */}
      {!status.isEligibleNow ? (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Withdrawal Submission Requirements</span>
          </div>
          <ul className="space-y-1 text-slate-300 pl-5 list-disc">
            {status.eligibilityReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
          {!status.isVipMember && (
            <div className="pt-1.5 flex items-center justify-between text-[11px] text-purple-300">
              <span>VIP members unlock 2 monthly withdrawal dates (15th &amp; 28th).</span>
              <button
                onClick={() => setCurrentView('vip_membership')}
                className="font-bold underline hover:text-purple-200 cursor-pointer whitespace-nowrap"
              >
                View VIP Tiers →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Your withdrawal window is open! You have <strong>{status.remainingThisMonth}</strong>{' '}
              withdrawal{status.remainingThisMonth === 1 ? '' : 's'} remaining this month (fee:{' '}
              <span className="font-mono">{status.feePercent}%</span>).
            </span>
          </div>
          {compact && (
            <button
              onClick={() => setCurrentView('withdraw')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Submit Now
            </button>
          )}
        </div>
      )}

      {/* Previous Withdrawal History Summary */}
      {!compact && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Recent Monthly Withdrawal History</span>
            <button
              onClick={() => setCurrentView('history')}
              className="text-amber-400 hover:underline font-mono text-[11px] cursor-pointer"
            >
              View Full Ledger ({userWithdrawals.length}) →
            </button>
          </div>
          {recentMonthlyHistory.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>No withdrawal requests submitted yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recentMonthlyHistory.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="text-white font-bold tabular-nums">
                      ${w.amount.toFixed(2)} · {w.paymentMethod}
                    </div>
                    <div className="text-[10px] text-slate-400">{w.requestDate}</div>
                  </div>
                  <span
                    className={`font-bold text-[11px] ${
                      w.status === 'Paid'
                        ? 'text-emerald-400'
                        : w.status === 'Rejected'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
