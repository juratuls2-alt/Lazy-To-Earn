import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Coins,
  LogIn,
  UserPlus,
  Gamepad2,
  Crown,
} from 'lucide-react';

export const Achievements: React.FC = () => {
  const { achievements, claimAchievement } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = achievements.filter((a) => {
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const claimedCount = achievements.filter((a) => a.isClaimed).length;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'LogIn':
        return <LogIn className="w-5 h-5 text-amber-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'Coins':
        return <Coins className="w-5 h-5 text-emerald-400" />;
      case 'UserPlus':
        return <UserPlus className="w-5 h-5 text-sky-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-indigo-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-300" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Badges &amp; Milestones</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Unlock Platform Perks</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Achievements &amp; Badges 🎖️
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn exclusive platform badges and points by completing milestones across games, missions, referrals, and withdrawals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Badges Unlocked</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {unlockedCount} / {achievements.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{claimedCount} Claimed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'onboarding', label: '🚀 Getting Started' },
          { id: 'missions', label: '🎯 Missions' },
          { id: 'earning', label: '💰 Cashouts' },
          { id: 'social', label: '👥 Referrals' },
          { id: 'gaming', label: '👾 Arcade' },
          { id: 'vip', label: '👑 VIP' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
              categoryFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ach) => {
          const percent = Math.min(100, Math.round((ach.currentProgress / ach.targetCount) * 100));

          return (
            <div
              key={ach.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                ach.isClaimed
                  ? 'bg-slate-950/60 border-slate-900 opacity-75'
                  : ach.isUnlocked
                  ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/50 shadow-xl'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      ach.isUnlocked
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {ach.isUnlocked ? renderIcon(ach.icon) : <Lock className="w-5 h-5 text-slate-600" />}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ach.category}
                    </span>
                    {ach.isUnlocked && (
                      <span className="text-[10px] text-emerald-400 font-mono block mt-1">Unlocked ✓</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{ach.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {ach.currentProgress} / {ach.targetCount}
                    </span>
                    <span className="text-slate-300 font-bold">{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ach.isUnlocked ? 'bg-amber-400' : 'bg-slate-700'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reward & Claim */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{ach.rewardPoints} pts</span>
                  {ach.rewardCash && <span className="text-emerald-400 ml-1">+${ach.rewardCash.toFixed(2)}</span>}
                </div>

                <div>
                  {ach.isClaimed ? (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Claimed</span>
                    </span>
                  ) : ach.isUnlocked ? (
                    <button
                      onClick={() => claimAchievement(ach.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 transition-all hover:scale-102"
                    >
                      CLAIM
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">In Progress</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
