import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, History, Shield, CheckCircle2, Coins, ArrowUpRight } from 'lucide-react';

export const PersonalGameHistory: React.FC = () => {
  const { user, userGameHistory, setCurrentView } = useApp();

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-xs text-slate-400">Please sign in to view your game history.</p>
      </div>
    );
  }

  const winsCount = userGameHistory.filter((h) => h.result === 'Win').length;
  const lossesCount = userGameHistory.filter((h) => h.result === 'Loss').length;
  const totalEarned = userGameHistory.reduce((sum, h) => sum + h.rewardAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header and User Isolation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">Personal Game History</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual gameplay records for <strong className="text-white">{user.name}</strong> ({user.id}). Strictly private and isolated.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[75px]">
            <span className="text-[10px] text-slate-400 font-mono block">Wins</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{winsCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[75px]">
            <span className="text-[10px] text-slate-400 font-mono block">Losses</span>
            <span className="text-sm font-black text-amber-400 font-mono">{lossesCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-mono block">Total Earned</span>
            <span className="text-sm font-black text-amber-400 font-mono">${totalEarned.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      {userGameHistory.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
            🎮
          </div>
          <h3 className="text-sm font-bold text-white">No Game Rounds Played Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose any of the 30 online games above to start playing and claiming $2.00 or $1.00 cash rewards!
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Game Name</th>
                  <th className="px-4 py-3">Game ID</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {userGameHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white font-sans">
                      {item.gameName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.gameId}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400">
                      {item.score} pts
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.result === 'Win'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {item.result === 'Win' ? '🏆 WIN' : '⭐ LOSS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400 tabular-nums">
                      +${item.rewardAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
