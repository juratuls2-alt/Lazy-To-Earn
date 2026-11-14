import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VipExpiryCountdown } from './VipExpiryCountdown';
import {
  Wallet,
  Tv,
  Users,
  Flame,
  ArrowUpRight,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Share2,
  ExternalLink,
  Clock,
  DollarSign,
  Gamepad2,
  Disc,
  CalendarCheck,
  Trophy,
  Award,
  Crown,
  Tag,
  LifeBuoy,
  CheckCircle2,
  Coins,
  CalendarDays,
  Activity,
  Gift,
  Newspaper,
  FileSpreadsheet,
  Languages,
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import { BLOG_OFFICIAL_LINK, EARN_MORE_SHORT_LINK, openAdMonetizationLink } from '../utils/adLinks';
import { MonthlyWithdrawalCountdown } from './MonthlyWithdrawalCountdown';
import { TopReferrersLeaderboard } from './TopReferrersLeaderboard';
import { RecommendedForYou } from './RecommendedForYou';
import { PWAInstallButton } from './PWAInstallButton';

export const Overview: React.FC = () => {
  const {
    user,
    minWithdrawal,
    streak,
    claimDailyBonus,
    claimEarnMoreBonus,
    referralLink,
    setCurrentView,
    addToast,
    userWithdrawals,
    userTransactions,
    missions,
    t,
    language,
    setLanguage,
    availableLanguages,
    openPublicProfile,
    effectiveVipTier,
    vipTiersConfig,
    vipMembershipStatus,
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">Please sign in to view your dashboard.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const vip = vipTiersConfig[effectiveVipTier] || vipTiersConfig.Free;
  const completedMissionsCount = missions.filter((m) => m.isCompleted).length;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addToast('Referral Link Copied!', `Share with friends to earn $${vip.referralBonus.toFixed(2)} for every signup!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const progressPercent = Math.min(100, Math.round((user.availableBalance / minWithdrawal) * 100));
  const remaining = Math.max(0, +(minWithdrawal - user.availableBalance).toFixed(2));

  const pendingAmount = user.pendingBalance || userWithdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Processing')
    .reduce((sum, w) => sum + w.amount, 0);

  const streakDays = [
    { day: 1, mult: '1.0x', label: 'Start' },
    { day: 2, mult: '1.1x', label: '+10%' },
    { day: 3, mult: '1.25x', label: '+25%' },
    { day: 4, mult: '1.4x', label: '+40%' },
    { day: 5, mult: '1.6x', label: '+60%' },
    { day: 6, mult: '1.8x', label: '+80%' },
    { day: 7, mult: '2.0x', label: '2X MAX 🔥' },
  ];

  return (
    <div className="space-y-7 pb-12 animate-fadeIn">
      {/* Top Banner Ad Placement */}
      <div className="w-full">
        <div className="hidden md:block">
          <AdBanner slot="leaderboard_728x90" label="Premium High-CPM Network Ad" showBonusAction />
        </div>
        <div className="block md:hidden">
          <AdBanner slot="mobile_320x50" label="Mobile High-CPM Ad" showBonusAction />
        </div>
      </div>

      {/* User Greeting & VIP Status Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Member ID: {user.id}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${vip.badgeColor}`}>
              {vip.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t('dashboard.welcome')}, {user.name} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Account Status: <span className="text-emerald-400 font-bold">{user.accountStatus}</span> · Real-time Payout Gateway Active
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('vip_membership')}
            className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Crown className="w-4 h-4 text-purple-400" />
            <span>VIP Upgrade</span>
          </button>
          <button
            onClick={() => setCurrentView('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cash Out</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Financial & Activity KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Available Balance</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
            ${user.availableBalance.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Min payout: ${minWithdrawal.toFixed(0)}
          </span>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Lifetime Earnings</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
            ${user.totalEarnings.toFixed(2)}
          </div>
          <span className="text-[10px] text-amber-400 font-mono block">
            {vip.multiplier}x multiplier applied
          </span>
        </div>

        {/* Today's Earnings */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Today's Earnings</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tabular-nums">
            +${user.todayEarnings.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Real-time update</span>
        </div>

        {/* Pending Withdrawals */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Pending Cashouts</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
            ${pendingAmount.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Under gateway review</span>
        </div>

        {/* Completed Missions */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Daily Missions</span>
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
            {completedMissionsCount} / {missions.length}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Daily reset at 00:00 UTC</span>
        </div>

        {/* Available Points */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Reward Points</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums">
            {user.points || 0} pts
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Convert 1,000 pts = $1.00</span>
        </div>

        {/* VIP Status */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>VIP Membership</span>
            <Crown className="w-3.5 h-3.5 text-purple-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
            {vipMembershipStatus?.status === 'expired' ? 'Expired' : vip.tier}
          </div>
          <span className="text-[10px] text-purple-400 font-mono block">
            {vipMembershipStatus?.status === 'expired'
              ? 'Renew VIP to restore perks'
              : `${vip.dailyFreeSpins} daily spins included`}
          </span>
        </div>

        {/* Referral Earnings */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Referral Income</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
            ${user.referralEarnings.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            +${vip.referralBonus.toFixed(0)} per invite
          </span>
        </div>
      </div>

      {/* Withdrawal Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Withdrawal Goal Progress</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cashout threshold: <strong className="text-amber-400 font-mono">${minWithdrawal.toFixed(2)}</strong> via bKash, Nagad, Bank, or USDT TRC20
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-400">
              ${user.availableBalance.toFixed(2)} / ${minWithdrawal.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-mono">({progressPercent}%)</span>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 to-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            {remaining > 0 ? (
              <>Need <strong className="text-amber-400">${remaining.toFixed(2)}</strong> more to cash out</>
            ) : (
              <span className="text-emerald-400 font-bold">✓ Goal Unlocked! Ready for withdrawal</span>
            )}
          </span>
          <button
            onClick={() => setCurrentView('withdraw')}
            className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            View Cashout Gateways →
          </button>
        </div>
      </div>

      {/* VIP 30-Day Expiration Countdown & Renewal Status */}
      <VipExpiryCountdown />

      {/* Section 23: Live Monthly Withdrawal Schedule, VIP Dual Countdown & History */}
      <MonthlyWithdrawalCountdown />

      {/* Smart Personalized Recommendations */}
      <RecommendedForYou />

      {/* Advanced Platform Hub (All New Interactive Modules & Quick Controls) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t('dashboard.modules_hub')}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Languages className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
                aria-label="Language Selector"
              >
                {availableLanguages.map((l) => (
                  <option key={l.language_code} value={l.language_code} className="bg-slate-900">
                    {l.language_name}
                  </option>
                ))}
              </select>
            </div>
            <PWAInstallButton compact />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {[
            { id: 'calendar', title: t('nav.calendar'), desc: 'Daily & milestone rewards', icon: CalendarDays, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', onClick: () => setCurrentView('calendar') },
            { id: 'vip_club', title: t('nav.vip_club'), desc: 'Clubhouse perks & events', icon: Crown, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', onClick: () => setCurrentView('vip_club') },
            { id: 'activity_feed', title: t('nav.activity_feed'), desc: 'Live verified milestones', icon: Activity, color: 'text-sky-400 bg-sky-500/15 border-sky-500/30', onClick: () => setCurrentView('activity_feed') },
            { id: 'public_profile', title: t('nav.public_profile'), desc: 'Badges & showcase URL', icon: Award, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', onClick: () => openPublicProfile(user.id) },
            { id: 'security', title: t('nav.security'), desc: '2FA & trusted devices', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', onClick: () => setCurrentView('security') },
            { id: 'reports', title: t('nav.reports'), desc: 'PDF & CSV statements', icon: FileSpreadsheet, color: 'text-sky-400 bg-sky-500/15 border-sky-500/30', onClick: () => setCurrentView('reports') },
            { id: 'gifts', title: t('nav.gifts'), desc: 'Non-cash collectibles', icon: Gift, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30', onClick: () => setCurrentView('gifts') },
            { id: 'news', title: t('nav.news'), desc: 'Bilingual platform news', icon: Newspaper, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', onClick: () => setCurrentView('news') },
          ].map((w) => {
            const WIcon = w.icon;
            return (
              <button
                key={w.id}
                onClick={w.onClick}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left space-y-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${w.color}`}>
                  <WIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-white">{w.title}</div>
                  <div className="text-[11px] text-slate-400">{w.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick-Access Platform Feature Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white tracking-wide">
            Platform Earning Zones 🚀
          </h2>
          <span className="text-xs text-slate-400 font-mono">Instant Real-Time Payouts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Lucky Spin Wheel */}
          <div
            onClick={() => setCurrentView('lucky_spin')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎡
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Daily Free Spin
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
                Lucky Spin Wheel
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Spin the wheel daily for random verified cash rewards, multipliers, and points up to $10.00.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-amber-400">
              <span>Spin &amp; Win</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Daily Missions */}
          <div
            onClick={() => setCurrentView('daily_missions')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {completedMissionsCount}/{missions.length} Done
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors">
                Daily Missions
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Complete daily login, ad watches, and gaming tasks for verified cashouts and reward points.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400">
              <span>View Missions</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Scratch Cards */}
          <div
            onClick={() => setCurrentView('scratch_cards')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                💎
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Up to $50 Jackpot
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-purple-300 transition-colors">
                Interactive Scratch Cards
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scratch off foil layers with realistic touch/mouse physics to match 3 winning symbols.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-purple-300">
              <span>Scratch &amp; Reveal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Gaming Tournaments */}
          <div
            onClick={() => setCurrentView('tournaments')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 hover:border-rose-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏆
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                $1,750+ Pools
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-rose-400 transition-colors">
                Gaming Tournaments
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Compete on live leaderboards in classic racing, arcade, and card game tournaments.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-rose-400">
              <span>Join Tournament</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Arcade & Mini Games (50+) */}
          <div
            onClick={() => setCurrentView('game_zone')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-sky-950/30 via-slate-900 to-slate-900 border border-sky-500/30 hover:border-sky-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👾
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Win $2 / Loss $1
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-sky-400 transition-colors">
                Game Zone (50 Games)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Play 30 full arcade games and 20 quick mini games. Guaranteed $2 Win or $1 Loss reward on every verified round!
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-sky-400">
              <span>Play 50 Games</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Referral Center */}
          <div
            onClick={() => setCurrentView('refer')}
            className="group p-5 rounded-3xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                +${vip.referralBonus.toFixed(0)} / Friend
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base group-hover:text-indigo-400 transition-colors">
                Referral Program
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Invite friends and classmates with your personal referral link to earn ${vip.referralBonus.toFixed(2)} cash per verified user!
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-indigo-400">
              <span>Share Link</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Streak Multiplier Ladder */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Daily Streak Multiplier</h3>
              <p className="text-xs text-slate-400">Active Rate: <strong className="text-amber-400 font-mono">{streak.multiplier}x</strong> Multiplier applied to all earnings</p>
            </div>
          </div>

          <button
            onClick={() => claimDailyBonus()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shadow-amber-500/20"
          >
            Claim Daily Login Bonus
          </button>
        </div>

        {/* 7 Days Ladder */}
        <div className="grid grid-cols-7 gap-2">
          {streakDays.map((s) => {
            const isCompleted = s.day <= streak.currentDay;
            const isCurrent = s.day === streak.currentDay;

            return (
              <div
                key={s.day}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg scale-102'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-mono uppercase block text-slate-400">Day {s.day}</span>
                <span className="font-bold font-mono text-xs sm:text-sm text-white block mt-1">{s.mult}</span>
                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Referrers Leaderboard Preview */}
      <TopReferrersLeaderboard compact />

      {/* Referral Link Quick Share Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Invite Friends &amp; Classmates for +${vip.referralBonus.toFixed(0)}.00 Cash</span>
          </h4>
          <p className="text-xs text-slate-400 font-mono">
            {referralLink}
          </p>
        </div>

        <button
          onClick={copyReferral}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Link' : 'Copy Referral Link'}</span>
        </button>
      </div>
    </div>
  );
};
