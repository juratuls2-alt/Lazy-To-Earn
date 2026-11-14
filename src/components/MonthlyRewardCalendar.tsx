import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Gift,
  Sparkles,
  Crown,
  CheckCircle2,
  Lock,
  Clock,
  History,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

interface CalendarEvent {
  id: string;
  event_date: string;
  day_number: number;
  title: string;
  title_bn: string;
  description: string;
  description_bn: string;
  event_type: 'daily_login' | 'special_event' | 'weekly_milestone' | 'monthly_milestone' | 'vip_exclusive';
  reward_type: string;
  reward_value: number;
  vip_only: number;
  required_tier: string;
  claim_deadline?: string;
}

interface CalendarClaim {
  id: string;
  event_id: string;
  reward_type: string;
  reward_value: number;
  claimed_at: string;
}

export const MonthlyRewardCalendar: React.FC = () => {
  const { user, language, t, addToast, creditCalendarReward, setCurrentView, effectiveVipTier } = useApp();
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [claims, setClaims] = useState<CalendarClaim[]>([]);
  const [history, setHistory] = useState<CalendarClaim[]>([]);
  const [serverDate, setServerDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');

  const loadCalendar = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?userId=${encodeURIComponent(user.id)}&month=${encodeURIComponent(month)}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setClaims(data.claims || []);
        setHistory(data.history || []);
        if (data.serverDate) setServerDate(data.serverDate);
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [user?.id, month]);

  // Countdown to next special/VIP/milestone event
  const upcomingEvent = events.find(
    (e) => e.event_date >= serverDate && e.event_type !== 'daily_login'
  );

  useEffect(() => {
    const updateCountdown = () => {
      if (!upcomingEvent) {
        setCountdownText('All monthly milestones unlocked');
        return;
      }
      const target = new Date(`${upcomingEvent.event_date}T23:59:59Z`).getTime();
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdownText(`${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [upcomingEvent?.id]);

  if (!user) return null;

  const claimedIds = new Set(claims.map((c) => c.event_id));
  const todayDayNum = Number(serverDate.split('-')[2] || 1);

  const handleClaim = async (ev: CalendarEvent) => {
    setClaimingId(ev.id);
    try {
      const res = await fetch('/api/calendar/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          eventId: ev.id,
          vipTier: effectiveVipTier,
          username: user.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          displayName: user.name,
          avatarUrl: user.avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Claim Blocked', data.error || 'Cannot claim this reward right now.', 'error');
        return;
      }
      creditCalendarReward(ev.reward_type, ev.reward_value, language === 'bn' ? ev.title_bn : ev.title);
      confetti({ particleCount: 75, spread: 70 });
      addToast(
        language === 'bn' ? 'রিওয়ার্ড সংগৃহীত!' : 'Calendar Reward Claimed!',
        `${language === 'bn' ? ev.title_bn : ev.title} (${
          ev.reward_type === 'points'
            ? `+${ev.reward_value} pts`
            : ev.reward_type === 'multiplier_boost'
            ? `${ev.reward_value}x Boost`
            : `+$${ev.reward_value.toFixed(2)}`
        })`,
        'bonus'
      );
      await loadCalendar();
    } catch {
      addToast('Network Error', 'Unable to validate calendar claim.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = claims.length;
  const weeklyMilestones = events.filter((e) => e.event_type === 'weekly_milestone' || e.event_type === 'monthly_milestone');

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider font-bold">
            <CalendarDays className="w-4 h-4" />
            <span>{month} · Server Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('calendar.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {t('calendar.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
          />
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Claimed This Month</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {completedCount} / {events.length}
            </span>
          </div>
        </div>
      </div>

      {/* Countdown + Milestones Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {t('calendar.upcoming')}
            </span>
            <span className="font-mono text-[11px] bg-amber-500/15 px-2 py-0.5 rounded-md">LIVE</span>
          </div>
          <div className="text-base font-black text-white">
            {upcomingEvent ? (language === 'bn' ? upcomingEvent.title_bn : upcomingEvent.title) : 'Month Complete'}
          </div>
          <div className="text-xl font-mono font-black text-emerald-400 tabular-nums">{countdownText}</div>
          <p className="text-[11px] text-slate-400">
            {upcomingEvent
              ? language === 'bn'
                ? upcomingEvent.description_bn
                : upcomingEvent.description
              : 'Stay tuned for next month events.'}
          </p>
        </div>

        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{language === 'bn' ? 'সাপ্তাহিক ও মাসিক মাইলফলক' : 'Weekly & Monthly Milestones'}</span>
            </h3>
            <button
              onClick={() => setCurrentView('vip_club')}
              className="text-xs text-purple-400 hover:underline font-bold cursor-pointer"
            >
              VIP Clubhouse Perks →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {weeklyMilestones.map((m) => {
              const isClaimed = claimedIds.has(m.id);
              const isReady = m.event_date <= serverDate && !isClaimed;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isClaimed
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : isReady
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-400">Day {m.day_number}</div>
                  <div className="font-bold text-white line-clamp-1">{language === 'bn' ? m.title_bn : m.title}</div>
                  <div className="font-mono font-black text-amber-400">
                    {m.reward_type === 'points' ? `+${m.reward_value} pts` : `+$${m.reward_value.toFixed(2)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Monthly Calendar Grid */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>{language === 'bn' ? 'দৈনিক ক্যালেন্ডার গ্রিড' : 'Daily Calendar Grid'}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Claimed</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Ready Today</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> VIP Exclusive</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Upcoming</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('common.loading')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {events.map((ev) => {
              const isClaimed = claimedIds.has(ev.id);
              const isFuture = ev.event_date > serverDate;
              const isToday = ev.event_date === serverDate;
              const isMissed = ev.event_date < serverDate && !isClaimed && ev.event_type === 'daily_login' && ev.day_number < todayDayNum - 3;
              const isVip = ev.vip_only === 1;

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                    isClaimed
                      ? 'bg-emerald-950/25 border-emerald-500/40'
                      : isToday
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                      : isVip
                      ? 'bg-purple-950/25 border-purple-500/40'
                      : isFuture
                      ? 'bg-slate-950/70 border-slate-800/80 opacity-85'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-white">Day {ev.day_number}</span>
                    {isVip ? (
                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                    ) : isClaimed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isFuture ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-100 leading-snug line-clamp-2">
                      {language === 'bn' && ev.title_bn ? ev.title_bn : ev.title}
                    </div>
                    <div className="text-xs font-mono font-black text-amber-400">
                      {ev.reward_type === 'points'
                        ? `+${ev.reward_value} pts`
                        : ev.reward_type === 'multiplier_boost'
                        ? `${ev.reward_value}x Boost`
                        : `+$${ev.reward_value.toFixed(2)}`}
                    </div>
                    {isVip && (
                      <span className="inline-block text-[10px] font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded">
                        {ev.required_tier}+ VIP
                      </span>
                    )}
                  </div>

                  <button
                    disabled={isClaimed || isFuture || isMissed || claimingId === ev.id}
                    onClick={() => handleClaim(ev)}
                    className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                        : isFuture
                        ? 'bg-slate-900 text-slate-500 cursor-not-allowed'
                        : isMissed
                        ? 'bg-rose-500/15 text-rose-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {claimingId === ev.id
                      ? '...'
                      : isClaimed
                      ? t('common.claimed')
                      : isFuture
                      ? t('common.locked')
                      : isMissed
                      ? 'Missed'
                      : t('common.claim_reward')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claim History */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <span>{t('calendar.history')}</span>
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-400">No calendar rewards claimed yet. Claim today&apos;s check-in above!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {history.slice(0, 9).map((h) => (
              <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{h.event_id}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{h.claimed_at.slice(0, 16)}</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {h.reward_type === 'points' ? `+${h.reward_value} pts` : `+$${Number(h.reward_value).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
