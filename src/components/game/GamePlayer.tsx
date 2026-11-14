import React, { useState } from 'react';
import { GameDefinition } from '../../types';
import { useApp } from '../../context/AppContext';
import { SponsoredAdCard } from './SponsoredAdCard';
import { GAME_AD_URL, openGameAdLink } from '../../utils/adLinks';
import { RacingGameEngine } from './engines/RacingGameEngine';
import { CardGameEngine } from './engines/CardGameEngine';
import { ArcadeGameEngine } from './engines/ArcadeGameEngine';
import { PuzzleGameEngine } from './engines/PuzzleGameEngine';
import { SportsGameEngine } from './engines/SportsGameEngine';
import { MiniGameEngine } from './engines/MiniGameEngine';
import {
  X,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  ShieldAlert,
  Coins,
  CheckCircle2,
  Clock,
  Info,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface GamePlayerProps {
  game: GameDefinition;
  onClose: () => void;
}

type Phase = 'pre_game' | 'loading' | 'playing' | 'result';

export const GamePlayer: React.FC<GamePlayerProps> = ({ game, onClose }) => {
  const { user, recordGameSession } = useApp();

  const [phase, setPhase] = useState<Phase>('pre_game');
  const [isPaused, setIsPaused] = useState(false);
  const [keyReset, setKeyReset] = useState(0);

  // Result state
  const [finalScore, setFinalScore] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleStartGameNow = () => {
    // 1. Open game advertisement in another new browser tab
    openGameAdLink();
    // 2. Keep original game tab open and start the selected game
    setPhase('loading');
    setTimeout(() => {
      setPhase('playing');
      setIsPaused(false);
    }, 600);
  };

  const handleGameFinish = (score: number, win: boolean, playDuration: number) => {
    setFinalScore(score);
    setIsWin(win);
    setDuration(playDuration);

    // Call server-side verified recording with minimum play duration anti-cheat
    const res = recordGameSession(game.id, game.name, score, win, playDuration);
    if (res.success) {
      setEarnedReward(res.reward);
      setSessionError(null);
    } else {
      setEarnedReward(0);
      setSessionError(res.error || 'Round not verified');
    }
    setPhase('result');
  };

  const restartRound = () => {
    setKeyReset((k) => k + 1);
    setPhase('loading');
    setTimeout(() => {
      setPhase('playing');
      setIsPaused(false);
    }, 500);
  };

  const renderGameEngine = () => {
    if (
      game.isMiniGame ||
      ['quick_arcade', 'brain_memory', 'fun_casual', 'skill_timing'].includes(game.category)
    ) {
      return <MiniGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
    }

    switch (game.category) {
      case 'racing':
        return <RacingGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
      case 'cards':
        return <CardGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
      case 'arcade':
        return <ArcadeGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
      case 'puzzle':
        return <PuzzleGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
      case 'sports':
      default:
        return <SportsGameEngine key={keyReset} game={game} onFinish={handleGameFinish} isPaused={isPaused} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* ================================================================ */}
      {/* PHASE 1: PRE-GAME SCREEN (Location 2 Ad Placement) */}
      {/* ================================================================ */}
      {phase === 'pre_game' && (
        <div className="space-y-6">
          {/* Top Return bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Game Zone</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">Win: $2.00</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-bold">Loss: $1.00</span>
            </div>
          </div>

          {/* SPONSOR SPOTLIGHT: Location 2 - Before starting a game */}
          <div className="bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
            <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sponsor Spotlight · Location 2: Pre-Game Lobby</span>
              <span className="text-amber-400/80 font-mono">Free Arcade Play</span>
            </div>
            <SponsoredAdCard
              placement="pre_game"
              variant="standard"
              subtitle={`Support Lazy To Earn! Check out our verified sponsor before diving into ${game.name}.`}
            />
          </div>

          {/* Pre-Game Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-800">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 shrink-0 shadow-lg relative group">
                <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center text-3xl">
                  {game.icon}
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {game.category}
                  </span>
                  <span className="text-xs text-slate-400">★ {game.rating} ({game.playCount} plays)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{game.name}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{game.description}</p>
              </div>
            </div>

            {/* Rules & Rewards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  🏆
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Winning Reward</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">$2.00 Cash</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                  ⭐
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Losing Reward</span>
                  <span className="text-lg font-black text-amber-400 font-mono">$1.00 Cash</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-6">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                <Info className="w-4 h-4" />
                <span>How to Play &amp; Controls</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{game.instructions}</p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                <strong>Objective:</strong> {game.winCondition}
              </div>
            </div>

            {/* Start Game Action Button - Two-Step Flow */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleStartGameNow}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START GAME NOW (GUARANTEED REWARD)</span>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>$2.00 for verified win</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>$1.00 for verified loss</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Sponsor: uplcm.com/4/12238368</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PHASE 2: LOADING SCREEN */}
      {/* ================================================================ */}
      {phase === 'loading' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Loading {game.name}...</h3>
            <p className="text-xs text-slate-400 font-mono">Initializing HTML5 physics engine and reward verifier...</p>
          </div>
          <SponsoredAdCard placement="pre_game" variant="compact" />
        </div>
      )}

      {/* ================================================================ */}
      {/* PHASE 3: PLAYING INTERFACE */}
      {/* ================================================================ */}
      {phase === 'playing' && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{game.icon}</span>
              <div>
                <h3 className="text-sm font-extrabold text-white leading-tight">{game.name}</h3>
                <span className="text-[10px] text-amber-400 font-mono">
                  Win: $2.00 · Loss: $1.00
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  isPaused
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isPaused ? 'Resume Game' : 'Pause Game'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={restartRound}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Restart Round"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 cursor-pointer"
                title="Exit Game"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Game Viewport */}
          {renderGameEngine()}
        </div>
      )}

      {/* ================================================================ */}
      {/* PHASE 4: RESULT SCREEN (Location 4 Ad Placement) */}
      {/* ================================================================ */}
      {phase === 'result' && (
        <div className="space-y-6">
          <div
            className={`rounded-3xl border p-6 sm:p-8 text-center space-y-6 shadow-2xl transition-all ${
              isWin
                ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40'
                : 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40'
            }`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-800 mx-auto text-4xl shadow-lg">
              {isWin ? '🏆' : '⭐'}
            </div>

            <div className="space-y-2">
              <span
                className={`text-xs font-mono font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                  isWin
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                {isWin ? 'Game Victory! Match Won' : 'Completed! Player Consolation Reward'}
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white">
                {isWin ? 'You Won $2.00 Cash!' : 'You Earned $1.00 Cash!'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                {isWin
                  ? `Spectacular performance in ${game.name}! Your $2.00 reward was verified and credited directly to your account.`
                  : `Well played in ${game.name}! You earned the guaranteed $1.00 participant reward. Every completed game pays out!`}
              </p>
            </div>

            {/* Score & Balance Display */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Final Score</span>
                <span className="text-lg font-black text-white font-mono">{finalScore} pts</span>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Cash Reward</span>
                <span className={`text-lg font-black font-mono ${isWin ? 'text-emerald-400' : 'text-amber-400'}`}>
                  +${earnedReward.toFixed(2)}
                </span>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Updated Balance</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${user ? user.availableBalance.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {sessionError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-mono max-w-md mx-auto">
                {sessionError}
              </div>
            )}

            {/* Actions: Play Again / Return to Game Zone */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={restartRound}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm cursor-pointer border border-slate-700"
              >
                <span>Return to Game Zone</span>
              </button>
            </div>
          </div>

          {/* SPONSOR SPOTLIGHT: Location 4 - Game Results Page */}
          <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-800/80">
            <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sponsored Advertisement · Location 4: Game Result Screen</span>
              <span className="text-emerald-400/90 font-mono">Verified Payout Credited</span>
            </div>
            <SponsoredAdCard
              placement="game_result"
              variant="standard"
              subtitle="Support our gaming platform! Visit our verified sponsor link to discover high CPM promotions and daily cash apps."
            />
          </div>
        </div>
      )}
    </div>
  );
};
