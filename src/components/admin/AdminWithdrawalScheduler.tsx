import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VIPTierLevel } from '../../types';
import { evaluateWithdrawalSchedule } from '../../utils/withdrawalScheduler';
import { Calendar, Clock, Save, ShieldCheck, AlertTriangle, Crown } from 'lucide-react';

const ALL_VIP_TIERS: VIPTierLevel[] = ['Free', 'Bronze', 'Silver', 'Gold', 'Platinum'];
const COMMON_TIMEZONES = [
  'Asia/Dhaka',
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
];

export const AdminWithdrawalScheduler: React.FC = () => {
  const {
    withdrawalScheduleConfig,
    adminUpdateWithdrawalSchedule,
    allWithdrawals,
    addToast,
  } = useApp();

  const [timezone, setTimezone] = useState(withdrawalScheduleConfig.timezone || 'Asia/Dhaka');
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(
    withdrawalScheduleConfig.withdrawalsEnabled
  );
  const [overrideForceOpen, setOverrideForceOpen] = useState(
    Boolean(withdrawalScheduleConfig.overrideForceOpen)
  );
  const [standardDaysStr, setStandardDaysStr] = useState(
    (withdrawalScheduleConfig.standardDays || [28]).join(', ')
  );
  const [vipDaysStr, setVipDaysStr] = useState(
    (withdrawalScheduleConfig.vipDays || [15, 28]).join(', ')
  );
  const [vipEligibleTiers, setVipEligibleTiers] = useState<VIPTierLevel[]>(
    withdrawalScheduleConfig.vipEligibleTiers || ['Bronze', 'Silver', 'Gold', 'Platinum']
  );
  const [windowDurationHours, setWindowDurationHours] = useState(
    withdrawalScheduleConfig.windowDurationHours || 24
  );
  const [standardMonthlyLimit, setStandardMonthlyLimit] = useState(
    withdrawalScheduleConfig.standardMonthlyLimit || 1
  );
  const [vipMonthlyLimit, setVipMonthlyLimit] = useState(
    withdrawalScheduleConfig.vipMonthlyLimit || 2
  );
  const [minWithdrawal, setMinWithdrawal] = useState(withdrawalScheduleConfig.minWithdrawal || 100);
  const [maxWithdrawal, setMaxWithdrawal] = useState(withdrawalScheduleConfig.maxWithdrawal || 5000);
  const [feePercent, setFeePercent] = useState(withdrawalScheduleConfig.feePercent ?? 2);
  const [saving, setSaving] = useState(false);

  const parseDays = (raw: string): number[] => {
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
  };

  const toggleTier = (tier: VIPTierLevel) => {
    setVipEligibleTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const stdDays = parseDays(standardDaysStr);
    const vDays = parseDays(vipDaysStr);
    if (stdDays.length === 0 || vDays.length === 0) {
      addToast('Invalid Dates', 'Enter at least one valid day of month (1-31).', 'error');
      return;
    }

    setSaving(true);
    await adminUpdateWithdrawalSchedule({
      timezone: timezone.trim() || 'Asia/Dhaka',
      withdrawalsEnabled,
      overrideForceOpen,
      standardDays: stdDays,
      vipDays: vDays,
      vipEligibleTiers,
      windowDurationHours: Math.max(1, Number(windowDurationHours) || 24),
      standardMonthlyLimit: Math.max(1, Number(standardMonthlyLimit) || 1),
      vipMonthlyLimit: Math.max(1, Number(vipMonthlyLimit) || 2),
      minWithdrawal: Math.max(1, Number(minWithdrawal) || 100),
      maxWithdrawal: Math.max(10, Number(maxWithdrawal) || 5000),
      feePercent: Math.max(0, Math.min(25, Number(feePercent) || 0)),
    });
    setSaving(false);
  };

  const previewStandard = evaluateWithdrawalSchedule(
    {
      ...withdrawalScheduleConfig,
      timezone,
      withdrawalsEnabled,
      overrideForceOpen,
      standardDays: parseDays(standardDaysStr).length ? parseDays(standardDaysStr) : [28],
      vipDays: parseDays(vipDaysStr).length ? parseDays(vipDaysStr) : [15, 28],
      vipEligibleTiers,
      windowDurationHours,
      standardMonthlyLimit,
      vipMonthlyLimit,
      minWithdrawal,
      maxWithdrawal,
      feePercent,
    },
    'Free',
    [],
    1000
  );

  const previewVip = evaluateWithdrawalSchedule(
    {
      ...withdrawalScheduleConfig,
      timezone,
      withdrawalsEnabled,
      overrideForceOpen,
      standardDays: parseDays(standardDaysStr).length ? parseDays(standardDaysStr) : [28],
      vipDays: parseDays(vipDaysStr).length ? parseDays(vipDaysStr) : [15, 28],
      vipEligibleTiers,
      windowDurationHours,
      standardMonthlyLimit,
      vipMonthlyLimit,
      minWithdrawal,
      maxWithdrawal,
      feePercent,
    },
    'Gold',
    [],
    1000
  );

  const pendingCarryOverCount = allWithdrawals.filter(
    (w) => w.status === 'Pending' || w.status === 'Processing'
  ).length;

  return (
    <div className="space-y-6">
      {/* Live Schedule Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Configured Server Timezone
          </span>
          <div className="text-lg font-mono font-black text-white">{previewStandard.timezone}</div>
          <div className="text-[11px] font-mono text-amber-400">
            {previewStandard.serverTimeFormatted}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Next Standard Window
          </span>
          <div className="text-lg font-mono font-black text-emerald-400">
            {previewStandard.nextWindow.dateFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {previewStandard.isWindowOpen ? 'Currently OPEN' : 'Currently CLOSED'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Next VIP Window · Review Carryover
          </span>
          <div className="text-lg font-mono font-black text-purple-300">
            {previewVip.nextWindow.dateFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {pendingCarryOverCount} pending requests carried into admin review
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form
        onSubmit={handleSave}
        className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Monthly Withdrawal Scheduler &amp; VIP Controls</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Changes sync immediately to backend validation (`Asia/Dhaka` default, leap-year &amp; February safe).
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Syncing...' : 'Save Schedule Policy'}</span>
          </button>
        </div>

        {/* Global Enable & Emergency Override */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enable Withdrawal Submissions</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Master switch to allow or pause all user cashout submissions.
              </div>
            </div>
            <input
              type="checkbox"
              checked={withdrawalsEnabled}
              onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
          </label>

          <label className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Emergency Force-Open Window Override</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Temporarily opens withdrawal submission immediately outside scheduled dates for testing or maintenance.
              </div>
            </div>
            <input
              type="checkbox"
              checked={overrideForceOpen}
              onChange={(e) => setOverrideForceOpen(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </label>
        </div>

        {/* Timezone, Dates & Window Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Authoritative Timezone
            </label>
            <select
              value={COMMON_TIMEZONES.includes(timezone) ? timezone : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') setTimezone(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Standard Dates (Day of Month)
            </label>
            <input
              type="text"
              value={standardDaysStr}
              onChange={(e) => setStandardDaysStr(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              VIP Dates (Comma Separated)
            </label>
            <input
              type="text"
              value={vipDaysStr}
              onChange={(e) => setVipDaysStr(e.target.value)}
              placeholder="e.g. 15, 28"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Window Duration (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={windowDurationHours}
              onChange={(e) => setWindowDurationHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>

        {/* Monthly Quotas & Financial Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Standard Monthly Limit
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={standardMonthlyLimit}
              onChange={(e) => setStandardMonthlyLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              VIP Monthly Limit
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={vipMonthlyLimit}
              onChange={(e) => setVipMonthlyLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Minimum Payout ($)
            </label>
            <input
              type="number"
              min={1}
              step="1"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Maximum Payout ($)
            </label>
            <input
              type="number"
              min={10}
              step="50"
              value={maxWithdrawal}
              onChange={(e) => setMaxWithdrawal(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Withdrawal Fee (%)
            </label>
            <input
              type="number"
              min={0}
              max={25}
              step="0.5"
              value={feePercent}
              onChange={(e) => setFeePercent(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono"
            />
          </div>
        </div>

        {/* VIP Eligible Tiers */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Tiers Granted VIP Dual-Window Schedule</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {ALL_VIP_TIERS.map((tier) => {
              const active = vipEligibleTiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTier(tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
