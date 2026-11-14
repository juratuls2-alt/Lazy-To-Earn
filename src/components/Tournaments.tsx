import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tournament } from '../types';
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Gamepad2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const Tournaments: React.FC = () => {
  const { user, tournaments, joinTournament, recordTournamentScore, games, setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [selectedTournId, setSelectedTournId] = useState<string>('tourn_01');

  const filteredTournaments = tournaments.filter((t) => t.status === activeTab);
  const selectedTourn = tournaments.find((t) => t.id === selectedTournId) || filteredTournaments[0] || tournaments[0];

  const isEnrolled = selectedTourn?.leaderboard.some((p) => p.userId === user?.id);

  const handleSimulateGamePlay = () => {
    if (!user || !selectedTourn) return;
    // Generate realistic tournament game score and post
    const baseScore = 3500 + Math.floor(Math.random() * 2000);
    recordTournamentScore(selectedTourn.id, baseScore);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>$1,750+ Total Prize Pools</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Competition</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Gaming Tournaments 🏆
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Compete against other Lazy To Earn players on top arcade leaderboards. Top 3 finishers receive guaranteed cash payouts credited instantly to their wallets!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Your Points</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{user?.points || 0} pts</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Use for tournament buy-ins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs w-fit">
        {(['Active', 'Upcoming', 'Completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              const first = tournaments.find((t) => t.status === tab);
              if (first) setSelectedTournId(first.id);
            }}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab} Tournaments
          </button>
        ))}
      </div>

      {/* Tournament Cards Carousel / Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredTournaments.map((t) => {
          const isSelected = t.id === selectedTourn?.id;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTournId(t.id)}
              className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 scale-102'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                  {t.category}
                </span>
                <span className="font-mono text-emerald-400 font-bold">${t.prizePool.toFixed(2)} Pool</span>
              </div>
              <h3 className="font-bold text-white text-sm mt-2 line-clamp-1">{t.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 font-mono">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{t.participantsCount} players</span>
                </span>
                <span>{t.entryFeePoints === 0 ? 'Free Entry' : `${t.entryFeePoints} pts fee`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tournament Detail Arena */}
      {selectedTourn && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Tournament Detail Card */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-800">
              <img src={selectedTourn.bannerUrl} alt={selectedTourn.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-amber-400 border border-amber-500/30">
                {selectedTourn.status}
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] text-slate-300 uppercase font-mono block">Game Title</span>
                <h4 className="text-sm font-bold text-white">{selectedTourn.gameName}</h4>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">{selectedTourn.title}</h2>
              <p className="text-xs text-slate-400 font-mono">
                {selectedTourn.startDate} → {selectedTourn.endDate}
              </p>
            </div>

            {/* Prize Pool Split */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold block">1st Place</span>
                <span className="font-mono text-white font-extrabold text-sm">
                  ${selectedTourn.firstPlacePrize.toFixed(0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <span className="text-[10px] text-slate-300 font-bold block">2nd Place</span>
                <span className="font-mono text-white font-extrabold text-sm">
                  ${selectedTourn.secondPlacePrize.toFixed(0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-900/20 border border-amber-800/40">
                <span className="text-[10px] text-amber-500 font-bold block">3rd Place</span>
                <span className="font-mono text-white font-extrabold text-sm">
                  ${selectedTourn.thirdPlacePrize.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Enrollment / Action CTAs */}
            <div className="space-y-3 pt-2">
              {!isEnrolled ? (
                <button
                  onClick={() => joinTournament(selectedTourn.id)}
                  disabled={selectedTourn.status !== 'Active'}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedTourn.status === 'Active'
                    ? `JOIN TOURNAMENT (${selectedTourn.entryFeePoints === 0 ? 'FREE' : `${selectedTourn.entryFeePoints} PTS`})`
                    : 'REGISTRATION CLOSED'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>You are enrolled in this tournament!</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulateGamePlay}
                      className="flex-1 py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Play &amp; Post Score</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('game_zone')}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                    >
                      Game Zone
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Leaderboard */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">Live Tournament Leaderboard</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Anti-Cheat</span>
              </span>
            </div>

            {selectedTourn.leaderboard.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center font-mono">
                No scores recorded yet. Be the first player to join and claim 1st place!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Player</th>
                      <th className="p-3 text-right">High Score</th>
                      <th className="p-3 text-right">Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedTourn.leaderboard.map((p) => {
                      const isMe = p.userId === user?.id;
                      return (
                        <tr
                          key={p.userId}
                          className={`transition-colors ${
                            isMe ? 'bg-amber-500/10 font-bold text-amber-300' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                                p.rank === 1
                                  ? 'bg-amber-400 text-slate-950'
                                  : p.rank === 2
                                  ? 'bg-slate-300 text-slate-950'
                                  : p.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              {p.rank}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={p.avatarUrl} alt={p.userName} className="w-6 h-6 rounded-full object-cover" />
                              <span className="font-sans text-white font-medium">{p.userName}</span>
                              {isMe && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right text-amber-400 font-bold">{p.score.toLocaleString()} pts</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">
                            {p.reward > 0 ? `+$${p.reward.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
