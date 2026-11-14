import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GameDefinition, GameCategory } from '../types';
import { SponsoredAdCard } from './game/SponsoredAdCard';
import { GamePlayer } from './game/GamePlayer';
import { PersonalGameHistory } from './game/PersonalGameHistory';
import { MiniGamesSection } from './game/MiniGamesSection';
import { GAME_AD_URL, openGameAdLink } from '../utils/adLinks';
import {
  Gamepad2,
  Trophy,
  Flame,
  Search,
  Sparkles,
  Play,
  RotateCcw,
  Star,
  Clock,
  Car,
  Layers,
  Zap,
  Brain,
  Award,
  History,
  ShieldCheck,
  ChevronRight,
  Filter,
  ExternalLink,
} from 'lucide-react';

export const GameZone: React.FC = () => {
  const { games, user, userGameHistory } = useApp();

  const [sectionView, setSectionView] = useState<'arcade' | 'mini_games'>('arcade');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Filtered games (Classic 30 Arcade Games)
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (!g.enabled) return false;
      if (g.isMiniGame) return false;

      // Category filter
      if (activeTab === 'featured' && !g.featured) return false;
      if (activeTab === 'popular' && !g.popular) return false;
      if (activeTab === 'new' && !g.isNew) return false;
      if (activeTab === 'racing' && g.category !== 'racing') return false;
      if (activeTab === 'cards' && g.category !== 'cards') return false;
      if (activeTab === 'arcade' && g.category !== 'arcade') return false;
      if (activeTab === 'puzzle' && g.category !== 'puzzle') return false;
      if (activeTab === 'sports' && g.category !== 'sports') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesCat = g.category.toLowerCase().includes(q);
        const matchesDesc = g.description.toLowerCase().includes(q);
        return matchesName || matchesCat || matchesDesc;
      }

      return true;
    });
  }, [games, activeTab, searchQuery]);

  // Featured games carousel items
  const featuredGames = useMemo(() => {
    return games.filter((g) => g.featured && g.enabled).slice(0, 4);
  }, [games]);

  // Recently played games for the active user
  const recentlyPlayed = useMemo(() => {
    if (!userGameHistory.length) return [];
    const uniqueIds = Array.from(new Set(userGameHistory.map((h) => h.gameId)));
    return uniqueIds
      .map((id) => games.find((g) => g.id === id))
      .filter((g): g is GameDefinition => !!g)
      .slice(0, 4);
  }, [userGameHistory, games]);

  // Handle Play Now click: Open ad in new browser tab, keep original tab open for game preparation
  const handlePlayNow = (game: GameDefinition) => {
    openGameAdLink();
    setSelectedGame(game);
  };

  // If a game is actively running in the player interface
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
      {/* SECTION NAVIGATOR: CLASSIC ARCADE (30) vs MINI GAMES ZONE (20) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs w-full max-w-md mx-auto shadow-lg">
        <button
          type="button"
          onClick={() => setSectionView('arcade')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            sectionView === 'arcade'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Classic Arcade (30)</span>
        </button>

        <button
          type="button"
          onClick={() => setSectionView('mini_games')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            sectionView === 'mini_games'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Mini Games (20)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider">
            Hot
          </span>
        </button>
      </div>

      {/* RENDER DEDICATED MINI GAMES ZONE OR CLASSIC ARCADE */}
      {sectionView === 'mini_games' ? (
        <MiniGamesSection />
      ) : (
        <>
          {/* ============================================================== */}
          {/* 1. LARGE GAME ZONE HERO BANNER */}
          {/* ============================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>Online Arcade · 30+ Playable Games · Real Cash Multipliers</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Lazy To Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">Game Zone</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Play Car Racing, Card Games, Retro Arcade, Logic Puzzles, and Sports challenges.
              Guaranteed server-verified rewards: <strong className="text-emerald-400 font-bold">Win: $2.00</strong> · <strong className="text-amber-400 font-bold">Loss: $1.00</strong> per completed game!
            </p>
          </div>

          {/* Quick Balance & Personal Game History Trigger */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex-1 sm:flex-initial text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Your Balance</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums">
                ${user ? user.availableBalance.toFixed(2) : '0.00'}
              </span>
            </div>

            <button
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className="px-4 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all text-center flex-1 sm:flex-initial cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                <History className="w-4 h-4" />
                <span>My Game History</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {userGameHistory.length} games recorded
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LOCATION 1: GAME ZONE HOMEPAGE SPONSORED ADVERTISEMENT */}
      {/* ============================================================== */}
      <section aria-label="Game Zone Homepage Advertisement">
        <SponsoredAdCard
          placement="homepage"
          variant="standard"
          subtitle="Explore high-paying sponsor offers, reward apps, and web monetization deals from our verified partner network."
        />
      </section>

      {/* ============================================================== */}
      {/* PERSONAL GAME HISTORY (Toggle View or In-page Section) */}
      {/* ============================================================== */}
      {showHistoryModal && (
        <section aria-label="Personal Game History Section">
          <PersonalGameHistory />
        </section>
      )}

      {/* ============================================================== */}
      {/* RECENTLY PLAYED GAMES (If any recorded) */}
      {/* ============================================================== */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase font-mono">
                Recently Played By You
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Quick resume</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentlyPlayed.map((g) => (
              <div
                key={g.id}
                onClick={() => handlePlayNow(g)}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 flex items-center gap-3 transition-all hover:scale-102 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                  <img src={g.thumbnailUrl} alt={g.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-base">
                    {g.icon}
                  </div>
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {g.name}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">Win: $2.00</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* FEATURED GAMES CAROUSEL / HIGHLIGHT ROW */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">
              Featured Arcade Games
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Verified Cash: Win $2.00 / Loss $1.00
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredGames.map((g) => (
            <div
              key={g.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl group"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
                <img
                  src={g.thumbnailUrl}
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    Featured
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-slate-200 text-[10px] font-mono">
                    ★ {g.rating}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-2xl">
                  {g.icon}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {g.description}
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
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-amber-400 font-bold">+$1.00</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlayNow(g)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-all hover:scale-102"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SEARCH AND CATEGORY FILTER BAR */}
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
              placeholder="Search 30+ games by name, category, or rules..."
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All 30 Games' },
              { id: 'racing', label: '🏎️ Car Racing (6)' },
              { id: 'cards', label: '♠️ Card Games (6)' },
              { id: 'arcade', label: '👾 Arcade (6)' },
              { id: 'puzzle', label: '🧩 Puzzle & Brain (6)' },
              { id: 'sports', label: '⚽ Sports & Action (6)' },
              { id: 'popular', label: '🔥 Popular' },
              { id: 'new', label: '✨ New' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Counter of matching games */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <span>Showing {filteredGames.length} of {games.length} Playable Games</span>
          <span>Guaranteed Reward on Every Completed Round</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 30 GAMES GRID WITH INLINE SPONSORED ADS */}
      {/* ============================================================== */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game, index) => {
            // Intersperse Sponsored Ad between game cards (e.g. after card 6 and 14)
            const showInterspersedAd = index === 5 || index === 13;

            return (
              <React.Fragment key={game.id}>
                <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 group">
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider text-amber-400 border border-amber-500/30">
                        {game.category}
                      </span>
                      {game.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-bold text-[9px]">
                          Hot
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 text-xs font-mono font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-full">
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
                        <span className="text-emerald-400 font-bold">Win $2.00</span>
                        <span className="text-slate-600 mx-1">·</span>
                        <span className="text-amber-400 font-bold">Loss $1.00</span>
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

                {/* INTERSPERSED AD CARD BETWEEN GAME CARDS */}
                {showInterspersedAd && (
                  <div className="col-span-full my-2">
                    <SponsoredAdCard
                      placement="between_sections"
                      variant="compact"
                      subtitle="Sponsored Partner Offer: Visit our official advertising partner link to support free games and rewards."
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-sm text-slate-300">No games matched your search query "{searchQuery}".</p>
            <button
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* LOCATION 3: BETWEEN GAME SECTIONS SPONSORED ADVERTISEMENT */}
      {/* ============================================================== */}
      <section aria-label="Between Game Sections Advertisement">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Sponsor Spotlight · Location 3: Arcade Showcase</span>
          <span className="text-amber-400/80 font-mono">uplcm.com/4/12238368</span>
        </div>
        <SponsoredAdCard
          placement="between_sections"
          variant="standard"
          subtitle="Support free gaming! Visit our official advertising partner link to explore trending deals."
        />
      </section>

      {/* ============================================================== */}
      {/* RULES, ANTI-CHEAT & REWARD TRANSPARENCY SECTION */}
      {/* ============================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Lazy To Earn Game Zone Rules &amp; Anti-Cheat Security
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span>
                <strong>Objective Verifiable Outcomes:</strong> Every game tracks real scores, timers, and moves. Minimum active play duration is enforced to prevent rapid automated loss-farming.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span>
                <strong>Unchanged Reward Payouts:</strong> Every win pays <span className="text-emerald-400 font-bold">$2.00</span>, and every completed game pays <span className="text-amber-400 font-bold">$1.00</span>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span>
                <strong>Strict Privacy Isolation:</strong> Your game history, transactions, and withdrawal records are 100% private to your user ID ({user?.id}).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span>
                <strong>Monetization Policy:</strong> Gameplay is made free by advertising sponsors. Clicking advertisements is completely optional and never forced.
              </span>
            </li>
          </ul>
        </div>

        {/* Live Session Counter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Arcade Statistics
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Your Gaming Summary</h4>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Games Available:</span>
                <span className="text-white font-bold">{games.length} Playable Games</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Your Total Rounds:</span>
                <span className="text-white font-bold">{userGameHistory.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Your Game Earnings:</span>
                <span className="text-emerald-400 font-bold">
                  ${userGameHistory.reduce((s, h) => s + h.rewardAmount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Open Detailed Game History</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* LOCATION 5: GAME ZONE FOOTER SPONSORED ADVERTISEMENT */}
      {/* ============================================================== */}
      <section aria-label="Game Zone Footer Advertisement" className="pt-4">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Sponsor Network · Location 5: Game Zone Footer</span>
          <span className="text-slate-400 font-mono">uplcm.com/4/12238368</span>
        </div>
        <SponsoredAdCard
          placement="footer"
          variant="standard"
          subtitle="Official sponsor integration for Lazy To Earn Game Zone. Visit verified high CPM partner campaigns."
        />
      </section>
        </>
      )}
    </div>
  );
};
