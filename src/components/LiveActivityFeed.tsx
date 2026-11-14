import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, UserPlus, UserCheck, Trophy, Award, Crown, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LiveActivityFeed: React.FC = () => {
  const { user, language, t, openPublicProfile, addToast } = useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [followingOnly, setFollowingOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        followerId: user?.id || '',
        followingOnly: String(followingOnly),
      });
      const res = await fetch(`/api/activity/feed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setFollowing(data.following || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [category, followingOnly, user?.id]);

  const handleFollow = async (targetUserId: string, username: string) => {
    if (!user || targetUserId === user.id) return;
    const res = await fetch('/api/activity/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerUserId: user.id, followedUserId: targetUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowing((prev) =>
        data.following ? [...prev, targetUserId] : prev.filter((id) => id !== targetUserId)
      );
      addToast(data.following ? 'Following' : 'Unfollowed', `@${username}`, 'info');
    }
  };

  const categories = [
    { id: 'all', label: language === 'bn' ? 'সব' : 'All' },
    { id: 'tournament', label: language === 'bn' ? 'টুর্নামেন্ট' : 'Tournaments' },
    { id: 'badge', label: language === 'bn' ? 'ব্যাজ' : 'Badges' },
    { id: 'vip_upgrade', label: 'VIP' },
    { id: 'challenge', label: language === 'bn' ? 'চ্যালেঞ্জ' : 'Challenges' },
    { id: 'announcement', label: language === 'bn' ? 'ঘোষণা' : 'Announcements' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase">
            <Activity className="w-4 h-4" />
            <span>Verified Public Stream</span>
          </div>
          <h1 className="text-2xl font-black text-white">{t('activity.title')}</h1>
          <p className="text-xs text-slate-400">{t('activity.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFollowingOnly(!followingOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              followingOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950 text-slate-300 border-slate-700'
            }`}
          >
            {followingOnly ? 'Following Only ✓' : 'Following Filter'}
          </button>
          <button
            onClick={loadFeed}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-sky-400 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              category === c.id
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stream */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">{t('common.loading')}</div>
      ) : events.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          No public activity items match this filter yet.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const isFollow = following.includes(ev.user_id);
            const Icon =
              ev.category === 'tournament'
                ? Trophy
                : ev.category === 'vip_upgrade'
                ? Crown
                : ev.category === 'announcement'
                ? Megaphone
                : Award;

            return (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => openPublicProfile(ev.username)}
                    className="shrink-0 cursor-pointer"
                    title={`View @${ev.username}`}
                  >
                    <img
                      src={ev.avatar_url}
                      alt={ev.display_name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                    />
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openPublicProfile(ev.username)}
                        className="text-xs font-black text-white hover:text-amber-400 cursor-pointer"
                      >
                        {ev.display_name}
                      </button>
                      <span className="text-[10px] font-mono text-slate-400">@{ev.username}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold">
                        {ev.vip_tier}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{language === 'bn' && ev.title_bn ? ev.title_bn : ev.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {language === 'bn' && ev.description_bn ? ev.description_bn : ev.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] font-mono text-slate-500">{ev.created_at}</span>
                  {user && ev.user_id !== user.id && (
                    <button
                      onClick={() => handleFollow(ev.user_id, ev.username)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        isFollow
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-950 border border-slate-700 text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      {isFollow ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      <span>{isFollow ? 'Following' : 'Follow'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
