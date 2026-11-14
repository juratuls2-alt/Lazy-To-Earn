import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Users, Crown, Award, TrendingUp, ArrowUpRight } from 'lucide-react';

interface TopReferrersLeaderboardProps {
  compact?: boolean;
}

export const TopReferrersLeaderboard: React.FC<TopReferrersLeaderboardProps> = ({ compact = false }) => {
  const { user, topReferrers, setCurrentView } = useApp();

  const displayed = compact ? topReferrers.slice(0, 5) : topReferrers.slice(0, 10);
  const topThree = topReferrers.slice(0, 3);
  const currentUserRank = user
    ? topReferrers.findIndex((r) => r.userId === user.id) + 1
    : 0;

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Top Referrers Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Live ranking of members with the highest verified referral signups and commission volume.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {currentUserRank > 0 && (
            <span className="text-slate-300 tabular-nums">
              Your Rank: <strong className="text-amber-400">#{currentUserRank}</strong> / {topReferrers.length}
            </span>
          )}
          {compact && (
            <button
              onClick={() => setCurrentView('refer')}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Full Rankings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!compact && topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topThree.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = user?.id === entry.userId;
            const borderTone =
              rank === 1
                ? 'border-amber-500/40 bg-amber-950/15'
                : rank === 2
                ? 'border-slate-500/40 bg-slate-950'
                : 'border-orange-500/30 bg-slate-950';
            const rankColor =
              rank === 1
                ? 'text-amber-400'
                : rank === 2
                ? 'text-slate-300'
                : 'text-orange-400';

            return (
              <div
                key={entry.userId}
                className={`p-4 rounded-xl border ${borderTone} ${
                  isMe ? 'ring-1 ring-sky-400/50' : ''
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-black text-sm tabular-nums ${rankColor}`}>
                    #{rank} {rank === 1 ? 'Leader' : rank === 2 ? 'Runner-Up' : '3rd Place'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {entry.vipTier} Tier
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={entry.avatarUrl}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {entry.name} {isMe && <span className="text-sky-400 text-[11px]">(You)</span>}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Code: {entry.referralCode}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">
                    <strong className="text-white">{entry.referralCount}</strong> Referrals
                  </span>
                  <span className="text-emerald-400 font-bold">
                    +${entry.referralEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <th className="pb-2.5 pr-3 font-semibold">Rank</th>
              <th className="pb-2.5 pr-3 font-semibold">Member</th>
              <th className="pb-2.5 pr-3 font-semibold">Tier</th>
              <th className="pb-2.5 pr-3 font-semibold text-right">Verified Referrals</th>
              <th className="pb-2.5 font-semibold text-right">Commission Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayed.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = user?.id === entry.userId;
              return (
                <tr
                  key={entry.userId}
                  className={`transition-colors ${
                    isMe ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 pr-3 font-mono font-bold tabular-nums">
                    <span
                      className={
                        rank === 1
                          ? 'text-amber-400'
                          : rank === 2
                          ? 'text-slate-200'
                          : rank === 3
                          ? 'text-orange-400'
                          : 'text-slate-400'
                      }
                    >
                      #{rank}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.avatarUrl}
                        alt={entry.name}
                        className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800 object-cover shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          {entry.name}{' '}
                          {isMe && <span className="text-sky-400 font-mono text-[10px]">(You)</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {entry.userId} · {entry.referralCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-300 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      {entry.vipTier !== 'Free' && <Crown className="w-3 h-3 text-amber-400" />}
                      {entry.vipTier}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono font-bold text-white tabular-nums">
                    {entry.referralCount}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                    ${entry.referralEarnings.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Every valid signup via your link credits +$10.00 (up to $20.00 for Platinum VIP).</span>
          </span>
          <span className="font-mono flex items-center gap-1 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Updated live upon registration</span>
          </span>
        </div>
      )}
    </div>
  );
};
