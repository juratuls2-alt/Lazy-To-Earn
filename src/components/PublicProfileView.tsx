import React, { useEffect, useState } from 'react';
import {
  Award,
  Shield,
  Users,
  Trophy,
  Copy,
  Check,
  Flag,
  Lock,
  Sparkles,
  UserPlus,
  UserCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PublicProfileData {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  profile_frame: string;
  profile_theme: string;
  bio: string;
  user_level: number;
  vip_tier: string;
  registration_date: string;
  followersCount?: number;
  completed_missions_count: number | null;
  tournaments_played: number | null;
  tournaments_won: number | null;
  achievements?: string[];
  badges: string[];
  unlocked_rewards?: string[];
}

export const PublicProfileView: React.FC = () => {
  const { user, viewedProfileHandle, openPublicProfile, t, addToast, missions, achievements } = useApp();
  const [directory, setDirectory] = useState<PublicProfileData[]>([]);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [privacy, setPrivacy] = useState({
    is_public: true,
    show_stats: true,
    show_achievements: true,
    show_activity: true,
    allow_gifts: true,
  });
  const [privateNotice, setPrivateNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Edit own profile form
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFrame, setEditFrame] = useState('default');
  const [editTheme, setEditTheme] = useState('amber-dark');
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const activeIdentifier = viewedProfileHandle || user?.id || 'tanvir_pro';

  const loadDirectory = async () => {
    try {
      const res = await fetch('/api/profiles/directory');
      if (res.ok) {
        const data = await res.json();
        setDirectory(data.profiles || []);
      }
      if (user) {
        const actRes = await fetch(`/api/activity/feed?followerId=${encodeURIComponent(user.id)}`);
        if (actRes.ok) {
          const actData = await actRes.json();
          setFollowingIds(actData.following || []);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadProfile = async (id: string) => {
    setPrivateNotice(null);
    try {
      const res = await fetch(
        `/api/profiles/public/${encodeURIComponent(id)}?viewerId=${encodeURIComponent(user?.id || '')}`
      );
      const data = await res.json();
      if (res.status === 403 && data.privateProfile) {
        setProfile(null);
        setPrivateNotice(data.message);
        return;
      }
      if (res.ok && data.profile) {
        setProfile(data.profile);
        if (data.privacy && id === user?.id) {
          setPrivacy({
            is_public: data.privacy.is_public !== 0,
            show_stats: data.privacy.show_stats !== 0,
            show_achievements: data.privacy.show_achievements !== 0,
            show_activity: data.privacy.show_activity !== 0,
            allow_gifts: data.privacy.allow_gifts !== 0,
          });
        }
        setEditUsername(data.profile.username);
        setEditBio(data.profile.bio || '');
        setEditFrame(data.profile.profile_frame || 'default');
        setEditTheme(data.profile.profile_theme || 'amber-dark');
      } else if (user && id === user.id) {
        // Initialize default form for a newly signed-up user
        setEditUsername(user.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 18));
        setEditBio('Active Lazy To Earn member.');
        setEditMode(true);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [user?.id]);

  useEffect(() => {
    if (activeIdentifier) loadProfile(activeIdentifier);
  }, [activeIdentifier, user?.id]);

  if (!user) return null;

  const isOwnProfile = profile ? profile.user_id === user.id : activeIdentifier === user.id;
  const isFollowing = profile ? followingIds.includes(profile.user_id) : false;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const completedMissions = missions.filter((m) => m.isCompleted).length;
      const unlockedBadges = achievements.filter((a) => a.isUnlocked).map((a) => a.title);
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: editUsername,
          display_name: user.name,
          avatar_url: user.avatarUrl,
          profile_frame: editFrame,
          profile_theme: editTheme,
          bio: editBio,
          user_level: Math.max(1, Math.floor((user.points || 200) / 150) + 1),
          vip_tier: user.vipTier || 'Free',
          registration_date: user.registrationDate,
          completed_missions_count: completedMissions + 12,
          tournaments_played: 4,
          tournaments_won: 1,
          achievements: unlockedBadges.length > 0 ? unlockedBadges : ['First Steps', 'Daily Earner'],
          badges: [`${user.vipTier || 'Free'} Member`, 'Verified Account'],
          unlocked_rewards: [editFrame],
          privacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Update Failed', data.error || 'Unable to save public profile.', 'error');
        return;
      }
      addToast('Public Profile Updated', 'Your showcase & privacy preferences are saved.', 'success');
      setEditMode(false);
      await loadProfile(user.id);
      await loadDirectory();
    } catch {
      addToast('Error', 'Unable to save profile changes.', 'error');
    }
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    const res = await fetch('/api/activity/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerUserId: user.id, followedUserId: profile.user_id }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowingIds((prev) =>
        data.following ? [...prev, profile.user_id] : prev.filter((id) => id !== profile.user_id)
      );
      addToast(data.following ? 'Followed Member' : 'Unfollowed Member', `@${profile.username}`, 'info');
      await loadProfile(profile.user_id);
    }
  };

  const handleCopyShareUrl = () => {
    const slug = profile?.username || editUsername || user.id;
    const url = `${window.location.origin}/?profile=${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    addToast('Profile Link Copied', 'Public showcase URL copied (financial data stays private).', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reportReason.trim()) return;
    const res = await fetch('/api/profiles/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_user_id: profile.user_id,
        reporter_user_id: user.id,
        reason: reportReason,
      }),
    });
    if (res.ok) {
      addToast('Report Submitted', 'Moderators will review this public profile.', 'info');
      setShowReportModal(false);
      setReportReason('');
    }
  };

  const filteredDir = directory.filter(
    (d) =>
      d.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const themeBg =
    profile?.profile_theme === 'emerald-royal'
      ? 'from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/30'
      : profile?.profile_theme === 'purple-galaxy'
      ? 'from-purple-950/50 via-slate-900 to-slate-900 border-purple-500/30'
      : 'from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>{t('profiles.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('profiles.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openPublicProfile(user.id)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs font-bold text-white cursor-pointer"
          >
            My Showcase
          </button>
          <button
            onClick={handleCopyShareUrl}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Share Profile URL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Showcase Card */}
        <div className="lg:col-span-2 space-y-5">
          {privateNotice ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Lock className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">Private Member Profile</h3>
              <p className="text-xs text-slate-400">{privateNotice}</p>
            </div>
          ) : profile ? (
            <div className={`p-6 rounded-3xl bg-gradient-to-br ${themeBg} border space-y-5 shadow-xl`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className={`w-20 h-20 rounded-2xl object-cover border-4 ${
                        profile.profile_frame === 'gold-crown'
                          ? 'border-amber-400 shadow-lg shadow-amber-500/30'
                          : profile.profile_frame === 'silver-aurora'
                          ? 'border-sky-400 shadow-lg shadow-sky-500/20'
                          : 'border-slate-700'
                      }`}
                    />
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-400">
                      LVL {profile.user_level}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white">{profile.display_name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {profile.vip_tier} VIP
                      </span>
                    </div>
                    <div className="text-xs font-mono text-amber-400">@{profile.username}</div>
                    <div className="text-[11px] text-slate-400">
                      Member since {profile.registration_date} · {profile.followersCount || 0} followers
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-xs font-bold text-white cursor-pointer"
                    >
                      {editMode ? 'Close Editor' : 'Customize & Privacy'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleToggleFollow}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          isFollowing
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        <span>{isFollowing ? 'Following' : 'Follow'}</span>
                      </button>
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Report Public Profile"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                {profile.bio || 'No bio added yet.'}
              </p>

              {/* Public Stats (only when privacy allows) */}
              {profile.completed_missions_count !== null ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Missions Done</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{profile.completed_missions_count}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Tournaments</span>
                    <span className="text-xl font-black text-sky-400 font-mono">{profile.tournaments_played}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Tournament Wins</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{profile.tournaments_won}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Gameplay statistics are hidden by this member&apos;s privacy settings.</span>
                </div>
              )}

              {/* Badges & Achievements */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unlocked Badges &amp; Showcase Rewards</span>
                </h3>
                {profile.badges.length === 0 && (profile.achievements?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-500">Achievements hidden by privacy controls.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((b, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3" />
                        {b}
                      </span>
                    ))}
                    {(profile.achievements || []).map((a, i) => (
                      <span
                        key={`ach-${i}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                      >
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy Protected: Email, phone, balances, and withdrawal details are never publicly exposed.</span>
              </div>
            </div>
          ) : null}

          {/* Customize & Privacy Form */}
          {editMode && isOwnProfile && (
            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-4">
              <h3 className="text-base font-extrabold text-white">Customize Public Showcase &amp; Privacy Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Custom Username / Handle</label>
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Profile Frame Style</label>
                  <select
                    value={editFrame}
                    onChange={(e) => setEditFrame(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="default">Classic Slate</option>
                    <option value="silver-aurora">Silver Aurora</option>
                    <option value="gold-crown">Golden Crown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Showcase Theme</label>
                  <select
                    value={editTheme}
                    onChange={(e) => setEditTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="amber-dark">Amber Midnight</option>
                    <option value="emerald-royal">Emerald Royal</option>
                    <option value="purple-galaxy">Purple Galaxy</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-bold">Short Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-2">
                {[
                  { key: 'is_public', label: 'Public Profile Enabled' },
                  { key: 'show_stats', label: 'Show Mission & Tournament Stats' },
                  { key: 'show_achievements', label: 'Show Badges & Achievements' },
                  { key: 'show_activity', label: 'Appear in Live Activity Feed' },
                  { key: 'allow_gifts', label: 'Allow Non-Cash Collectible Gifts' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(privacy as any)[opt.key]}
                      onChange={(e) => setPrivacy({ ...privacy, [opt.key]: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span className="text-slate-200">{opt.label}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                {t('common.save_changes')}
              </button>
            </form>
          )}
        </div>

        {/* Right: Community Profiles Directory */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Member Showcase Directory</span>
            </h3>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredDir.map((item) => (
              <button
                key={item.user_id}
                onClick={() => openPublicProfile(item.username)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  profile?.user_id === item.user_id
                    ? 'bg-amber-500/15 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={item.avatar_url} alt={item.display_name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.display_name}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      @{item.username} · {item.vip_tier}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">LVL {item.user_level}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-white">Report Public Profile</h3>
            <p className="text-xs text-slate-400">
              Help keep Lazy To Earn safe by reporting inappropriate usernames, bios, or spam.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              required
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                {t('common.submit')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
