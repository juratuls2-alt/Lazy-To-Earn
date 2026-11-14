import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VIP_TIERS } from '../db/mockDb';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Tv,
  Gamepad2,
  Disc,
  Users,
  Coins,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DailyMissions: React.FC = () => {
  const { user, missions, claimMission, setCurrentView } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const vip = VIP_TIERS[user?.vipTier || 'Free'];

  const filteredMissions = missions.filter((m) => {
    if (filter === 'pending') return !m.isClaimed;
    if (filter === 'completed') return m.isClaimed;
    return true;
  });

  const completedCount = missions.filter((m) => m.isCompleted).length;
  const claimedCount = missions.filter((m) => m.isClaimed).length;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'CalendarCheck':
        return <CalendarCheck className="w-5 h-5 text-amber-400" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-sky-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Disc':
        return <Disc className="w-5 h-5 text-pink-400" />;
      case 'Users':
      default:
        return <Users className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Resets in 11h 24m</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Daily Mission Board</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Daily Missions &amp; Tasks 🎯
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete simple daily platform actions to earn cash rewards and reward points.
              With your {vip.name} membership, you receive a{' '}
              <strong className="text-amber-400 font-mono">{vip.multiplier}x</strong> bonus multiplier!
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex-1 sm:flex-initial text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Missions Done</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {completedCount} / {missions.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{claimedCount} Claimed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Missions ({missions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Progress ({missions.length - claimedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
              filter === 'completed'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Claimed ({claimedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Server Verified Completion</span>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMissions.map((m) => {
          const percent = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));
          const adjustedCash = +(m.rewardCash * vip.multiplier).toFixed(2);
          const adjustedPoints = Math.round(m.rewardPoints * vip.multiplier);

          return (
            <div
              key={m.id}
              className={`rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all ${
                m.isClaimed
                  ? 'bg-slate-950/40 border-slate-900 opacity-70'
                  : m.isCompleted
                  ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/50 shadow-xl'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                    {renderIcon(m.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {m.category}
                      </span>
                      {m.isClaimed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Claimed ✓
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Progress: {m.currentCount} / {m.targetCount}
                    </span>
                    <span className="text-slate-300 font-bold">{percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reward & Action */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+${adjustedCash}</span>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{adjustedPoints} pts</span>
                  </div>
                </div>

                <div>
                  {m.isClaimed ? (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Reward Received</span>
                    </span>
                  ) : m.isCompleted ? (
                    <button
                      onClick={() => claimMission(m.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>CLAIM REWARD</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentView(m.actionView as any)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Go to Task</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
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
