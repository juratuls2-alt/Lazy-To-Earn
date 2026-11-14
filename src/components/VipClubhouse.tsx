import React, { useEffect, useState } from 'react';
import { Crown, Trophy, Sparkles, LifeBuoy, CheckCircle2, ShieldAlert, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VipClubhouse: React.FC = () => {
  const { user, language, t, setCurrentView, openPublicProfile, addToast, effectiveVipTier, vipMembershipStatus } = useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVipClub = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vip-club/events?userId=${encodeURIComponent(user?.id || '')}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setJoinedIds(data.joinedIds || []);
        setLeaderboard(data.vipLeaderboard || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVipClub();
  }, [user?.id]);

  if (!user) return null;

  const isVip = effectiveVipTier !== 'Free';
  const isExpired = vipMembershipStatus?.status === 'expired';

  const handleJoin = async (eventId: string) => {
    const res = await fetch('/api/vip-club/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, eventId, vipTier: effectiveVipTier }),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast('VIP Tier Required', data.error || 'Upgrade your VIP club tier to join.', 'error');
      return;
    }
    addToast('Joined VIP Event!', 'You are enrolled in this VIP Clubhouse event.', 'bonus');
    await loadVipClub();
  };

  const clubs = [
    { tier: 'Bronze', color: 'border-amber-600/40 bg-amber-950/20 text-amber-300', perks: '15th & 28th Withdrawals, 1.25x Points, Bronze Badge' },
    { tier: 'Silver', color: 'border-sky-500/40 bg-sky-950/20 text-sky-300', perks: 'Silver Tournaments, 1.5x Points, Priority Desk' },
    { tier: 'Gold', color: 'border-yellow-400/50 bg-yellow-950/20 text-yellow-300', perks: 'Mid-Month Promo Drops, 2.0x Points, Gold Frame' },
    { tier: 'Platinum', color: 'border-purple-500/50 bg-purple-950/25 text-purple-300', perks: 'All VIP Events, 2.5x Points, Concierge Support' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Clubhouse Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-amber-950/30 border border-purple-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-bold uppercase">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>
              Active Club Tier: {effectiveVipTier}
              {isExpired ? ` (${vipMembershipStatus?.highestTier} Expired)` : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{t('vip_club.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">{t('vip_club.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('vip_membership')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
          >
            {isVip ? 'Manage VIP Tier' : 'Join VIP Club'}
          </button>
          <button
            onClick={() => setCurrentView('live_support')}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Priority Support</span>
          </button>
        </div>
      </div>

      {/* Clear Benefit Transparency Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>VIP Transparency:</strong> VIP Clubhouse memberships unlock extra platform perks (15th &amp; 28th monthly withdrawal windows, priority support, exclusive missions, badges, and point boosters). Membership rewards require active participation and do not promise guaranteed financial returns.
        </span>
      </div>

      {/* Tier Clubs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clubs.map((c) => {
          const isCurrent = effectiveVipTier === c.tier;
          return (
            <div key={c.tier} className={`p-4 rounded-2xl border space-y-2 ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm">{c.tier} Club</span>
                {isCurrent && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black">
                    YOUR TIER
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{c.perks}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exclusive VIP Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>VIP-Only Missions, Tournaments &amp; Drops</span>
            </h2>
            <button
              onClick={() => setCurrentView('calendar')}
              className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>VIP Calendar Events</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-xs text-slate-400">{t('common.loading')}</div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const isJoined = joinedIds.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                          {ev.min_tier}+ VIP
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold">
                          {ev.reward_summary}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white">
                        {language === 'bn' && ev.title_bn ? ev.title_bn : ev.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {language === 'bn' && ev.description_bn ? ev.description_bn : ev.description}
                      </p>
                      <div className="text-[10px] font-mono text-slate-500">
                        {ev.starts_at} → {ev.ends_at} · {ev.participants_count} joined
                      </div>
                    </div>

                    <button
                      disabled={isJoined}
                      onClick={() => handleJoin(ev.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                        isJoined
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : 'bg-purple-500 hover:bg-purple-400 text-white cursor-pointer'
                      }`}
                    >
                      {isJoined && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{isJoined ? 'Joined' : 'Join VIP Event'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* VIP Leaderboard */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 h-fit">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>VIP Clubhouse Leaderboard</span>
          </h3>
          <div className="space-y-2.5">
            {leaderboard.map((m, idx) => (
              <button
                key={m.user_id}
                onClick={() => openPublicProfile(m.username)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-mono font-black text-amber-400 text-xs">#{idx + 1}</span>
                  <img src={m.avatar_url} alt={m.display_name} className="w-8 h-8 rounded-xl object-cover" />
                  <div>
                    <div className="text-xs font-bold text-white">{m.display_name}</div>
                    <div className="text-[10px] font-mono text-purple-300">{m.vip_tier} · LVL {m.user_level}</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {m.tournaments_won}W
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
