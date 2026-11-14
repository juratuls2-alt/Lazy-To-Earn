import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GameDefinition, MiniGameCategory } from '../../types';
import { SponsoredAdCard } from './SponsoredAdCard';
import { GamePlayer } from './GamePlayer';
import { GAME_AD_URL, openGameAdLink } from '../../utils/adLinks';
import {
  Zap,
  Sparkles,
  Trophy,
  Brain,
  Smile,
  Target,
  Play,
  Clock,
  History,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  ExternalLink,
} from 'lucide-react';

export const MiniGamesSection: React.FC = () => {
  const { games, user, userGameHistory } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Filter only mini games
  const miniGames = useMemo(() => {
    return games.filter((g) => g.isMiniGame || ['quick_arcade', 'brain_memory', 'fun_casual', 'skill_timing'].includes(g.category));
  }, [games]);

  // User-isolated mini game history records
  const userMiniHistory = useMemo(() => {
    const miniIds = new Set(miniGames.map((g) => g.id));
    return userGameHistory.filter((h) => h.isMiniGame || miniIds.has(h.gameId));
  }, [userGameHistory, miniGames]);

  // Mini Games Dashboard Metrics
  const totalPlayed = userMiniHistory.length;
  const totalWins = userMiniHistory.filter((h) => h.result === 'Win').length;
  const totalLosses = userMiniHistory.filter((h) => h.result === 'Loss').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = userMiniHistory.filter((h) => h.date.startsWith(todayStr)).length;
  const totalEarned = userMiniHistory.reduce((sum, h) => sum + h.rewardAmount, 0);

  // Filtered mini games based on sub-category & search
  const filteredMiniGames = useMemo(() => {
    return miniGames.filter((g) => {
      if (!g.enabled) return false;

      if (activeCategory === 'quick_arcade' && g.miniCategory !== 'quick_arcade' && g.category !== 'quick_arcade') return false;
      if (activeCategory === 'brain_memory' && g.miniCategory !== 'brain_memory' && g.category !== 'brain_memory') return false;
      if (activeCategory === 'fun_casual' && g.miniCategory !== 'fun_casual' && g.category !== 'fun_casual') return false;
      if (activeCategory === 'skill_timing' && g.miniCategory !== 'skill_timing' && g.category !== 'skill_timing') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesDesc = g.description.toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [miniGames, activeCategory, searchQuery]);

  // Handle Play Now click: Open ad in new browser tab, keep original tab open for game preparation
  const handlePlayNow = (game: GameDefinition) => {
    openGameAdLink();
    setSelectedGame(game);
  };

  // If playing a mini game, render GamePlayer
  if (selectedGame) {
    return (
      <GamePlayer
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* ============================================================== */}
      {/* 1. VIBRANT MINI GAMES HERO BANNER */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/50 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Dedicated Mini Games Zone · 20 Quick-Play Games</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Lazy To Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Mini Games</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Fast, casual, instant-win games designed for lightning play on mobile or desktop.
              Earn guaranteed cash on every round: <strong className="text-emerald-400 font-bold">Win: $2.00</strong> · <strong className="text-amber-400 font-bold">Loss: $1.00</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 transition-all cursor-pointer text-center"
            >
              <span className="text-xs font-bold text-amber-400 font-mono block">Mini Game History</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{totalPlayed} rounds recorded</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MINI GAMES DASHBOARD (Personal User Isolated Metrics) */}
      {/* ============================================================== */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Played</span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 tabular-nums">
            {totalPlayed}
          </div>
          <span className="text-[10px] text-slate-400">Mini rounds</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Wins</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 tabular-nums">
            {totalWins}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">+$2.00 payouts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Losses</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 tabular-nums">
            {totalLosses}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">+$1.00 payouts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Today's Games</span>
          <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-0.5 tabular-nums">
            {todayCount}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Limit: 30 / day</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 text-center">
          <span className="text-[10px] text-amber-400 font-mono uppercase block">Mini Game Earnings</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 tabular-nums">
            ${totalEarned.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Verified in Balance</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. MINI GAMES HOMEPAGE SPONSORED ADVERTISEMENT */}
      {/* ============================================================== */}
      <section aria-label="Mini Games Homepage Sponsored Advertisement">
        <SponsoredAdCard
          placement="homepage"
          variant="standard"
          subtitle="Support free mini-games! Visit our verified sponsor partner to discover special gaming offers and reward apps."
        />
      </section>

      {/* ============================================================== */}
      {/* RECENT MINI GAME HISTORY (User Isolated) */}
      {/* ============================================================== */}
      {showHistory && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Recent Mini Game Sessions · {user?.name} ({user?.id})
              </h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hide History
            </button>
          </div>

          {userMiniHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No mini game sessions recorded yet. Play any game below to see your rewards!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Game</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Score</th>
                    <th className="p-2.5">Result</th>
                    <th className="p-2.5">Reward</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {userMiniHistory.slice(0, 10).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-white font-sans">{h.gameName}</td>
                      <td className="p-2.5 text-slate-400">{h.date}</td>
                      <td className="p-2.5 text-amber-400">{h.score} pts</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.result === 'Win' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {h.result}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-emerald-400 tabular-nums">
                        +${h.rewardAmount.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* 4. CATEGORY SELECTOR & SEARCH BAR */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20 mini games..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sub-Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Mini Games (20)', icon: Sparkles },
              { id: 'quick_arcade', label: 'Quick Arcade (5)', icon: Zap },
              { id: 'brain_memory', label: 'Brain & Memory (5)', icon: Brain },
              { id: 'fun_casual', label: 'Fun & Casual (5)', icon: Smile },
              { id: 'skill_timing', label: 'Skill & Timing (5)', icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <span>Displaying {filteredMiniGames.length} of {miniGames.length} Mini Games</span>
          <span className="text-emerald-400 font-bold">Win: $2.00 · Loss: $1.00</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. 20 MINI GAMES GRID WITH INLINE SPONSORED ADS */}
      {/* ============================================================== */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMiniGames.map((game, index) => {
            // Intersperse ad between cards (after card 4 and 12)
            const showInterspersedAd = index === 3 || index === 11;

            return (
              <React.Fragment key={game.id}>
                <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 group">
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider text-amber-400 border border-amber-500/30">
                        {game.miniCategory?.replace('_', ' ') || 'Mini'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-full">
                      ★ {game.rating}
                    </div>

                    <div className="absolute bottom-2 left-3 flex items-center gap-1 text-2xl">
                      {game.icon}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Sponsored ad placement on game card */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Sponsored Ad</span>
                      </span>
                      <a
                        href={GAME_AD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-amber-300 font-mono flex items-center gap-1 text-slate-400 hover:underline"
                        title="Visit sponsor ad in new tab"
                      >
                        <span>uplcm.com</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">+$2.00</span>
                        <span className="text-slate-600 mx-1">·</span>
                        <span className="text-amber-400 font-bold">+$1.00</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayNow(game)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-all hover:scale-102"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Now</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Sponsored Ad between cards */}
                {showInterspersedAd && (
                  <div className="col-span-full my-2">
                    <SponsoredAdCard
                      placement="between_sections"
                      variant="compact"
                      subtitle="Sponsored Mini Games Partner: Visit our official advertising partner link to support free games and rewards."
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. MINI GAMES FOOTER SPONSORED ADVERTISEMENT */}
      {/* ============================================================== */}
      <section aria-label="Mini Games Footer Advertisement" className="pt-4">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Sponsor Network · Mini Games Footer Placement</span>
          <span className="text-slate-400 font-mono">uplcm.com/4/12238368</span>
        </div>
        <SponsoredAdCard
          placement="footer"
          variant="standard"
          subtitle="Official sponsor integration for Lazy To Earn Mini Games Zone. Visit verified high CPM partner campaigns."
        />
      </section>
    </div>
  );
};
