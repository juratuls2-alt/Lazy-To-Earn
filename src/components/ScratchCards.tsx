import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SCRATCH_CARDS, VIP_TIERS } from '../db/mockDb';
import { ScratchCardConfig, ScratchCardPlay } from '../types';
import {
  Sparkles,
  Trophy,
  History,
  ShieldCheck,
  AlertCircle,
  Coins,
  CheckCircle2,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface InteractiveScratchProps {
  card: ScratchCardConfig;
  onScratchComplete: (play: ScratchCardPlay) => void;
  disabled?: boolean;
}

const InteractiveScratch: React.FC<InteractiveScratchProps> = ({ card, onScratchComplete, disabled }) => {
  const { scratchCard } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [playOutcome, setPlayOutcome] = useState<ScratchCardPlay | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScratching, setIsScratching] = useState(false);

  // Initialize canvas with foil layer
  useEffect(() => {
    initCanvas();
  }, [card.id]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRevealed(false);
    setPlayOutcome(null);
    setErrorMsg(null);

    // Fill foil
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (card.tier === 'gold') {
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.5, '#fbbf24');
      grad.addColorStop(1, '#b45309');
    } else if (card.tier === 'platinum') {
      grad.addColorStop(0, '#a855f7');
      grad.addColorStop(0.5, '#c084fc');
      grad.addColorStop(1, '#6b21a8');
    } else if (card.tier === 'silver') {
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.5, '#cbd5e1');
      grad.addColorStop(1, '#64748b');
    } else {
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#78350f');
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Foil pattern text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE ✨', canvas.width / 2, canvas.height / 2);
  };

  const handlePointerDown = () => {
    if (disabled || isRevealed) return;
    setIsScratching(true);

    // Call server on first scratch action to determine result
    if (!playOutcome) {
      const res = scratchCard(card.id);
      if (res.success && res.play) {
        setPlayOutcome(res.play);
      } else {
        setErrorMsg(res.error || 'Cannot play card.');
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratching || isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check how much is scratched
    checkPercentage();
  };

  const handlePointerUp = () => {
    setIsScratching(false);
  };

  const checkPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentCount = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparentCount++;
    }

    const totalSamples = data.length / 16;
    const percent = transparentCount / totalSamples;

    // Auto-reveal when 40% cleared
    if (percent > 0.4) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsRevealed(true);
      if (playOutcome) {
        onScratchComplete(playOutcome);
      }
    }
  };

  const revealAllNow = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let outcome = playOutcome;
    if (!outcome) {
      const res = scratchCard(card.id);
      if (res.success && res.play) {
        outcome = res.play;
        setPlayOutcome(outcome);
      } else {
        setErrorMsg(res.error || 'Cannot play card.');
        return;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsRevealed(true);
    if (outcome) {
      onScratchComplete(outcome);
    }
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center select-none shadow-inner">
        {/* Hidden Prize Layer Behind Canvas */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2">
          {playOutcome ? (
            <>
              <div className="flex items-center justify-center gap-3 text-3xl">
                {playOutcome.symbols.map((s, idx) => (
                  <span key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow">
                    {s}
                  </span>
                ))}
              </div>
              <div>
                {playOutcome.isWin ? (
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-wider block">
                      3 MATCH WINNER!
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      +${playOutcome.prizeAmount.toFixed(2)} Cash
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-400">2 Matches (No Win)</span>
                    <span className="text-[11px] text-slate-500 font-mono block">Try another scratch card!</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs font-mono">Scratch to reveal 3 matching symbols!</div>
          )}
        </div>

        {/* Scratchable Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={320}
          height={176}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={revealAllNow}
          disabled={isRevealed || disabled}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {isRevealed ? 'Revealed ✓' : 'Instant Reveal'}
        </button>

        {isRevealed && (
          <button
            onClick={initCanvas}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Next</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const ScratchCards: React.FC = () => {
  const { user, userScratchHistory } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string>('sc_bronze');
  const [recentWin, setRecentWin] = useState<ScratchCardPlay | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const vip = VIP_TIERS[user?.vipTier || 'Free'];
  const activeCard = SCRATCH_CARDS.find((c) => c.id === selectedCardId) || SCRATCH_CARDS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/40 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Reveal Games</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Provably Fair Outcome</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Interactive Scratch Cards 💎
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Scratch off the foil coating to match 3 winning symbols and unlock instant withdrawable cash rewards up to $50.00!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Your Points</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{user?.points || 0} pts</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{vip.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Tier Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCRATCH_CARDS.map((card) => {
          const isSelected = card.id === selectedCardId;
          return (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10 scale-102'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {card.tier}
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {card.costPoints === 0 ? 'FREE' : `${card.costPoints} pts`}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2 truncate">{card.title}</h4>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Win up to ${card.maxCashPrize.toFixed(2)}</p>
            </button>
          );
        })}
      </div>

      {/* Active Scratch Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Arena: Card Play */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{activeCard.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeCard.description}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Max Jackpot</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ${activeCard.maxCashPrize.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Canvas Component */}
          <InteractiveScratch
            key={activeCard.id}
            card={activeCard}
            onScratchComplete={(play) => setRecentWin(play)}
          />

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Matching 3 symbols guarantees cash payout</span>
            </span>
            <span>Daily limit: {activeCard.dailyLimit} cards</span>
          </div>
        </div>

        {/* Right Info: Outcome details and history */}
        <div className="lg:col-span-5 space-y-5">
          {recentWin && recentWin.isWin && (
            <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-2 shadow-xl animate-fadeIn">
              <span className="text-3xl">🎉</span>
              <h4 className="text-xl font-black text-white">Winner Credited!</h4>
              <p className="text-xs text-emerald-200">
                You won <strong>+${recentWin.prizeAmount.toFixed(2)} cash</strong>! Verified and credited to your available balance.
              </p>
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                <span>Your Scratch History</span>
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono cursor-pointer"
              >
                {showHistory ? 'Hide' : `View (${userScratchHistory.length})`}
              </button>
            </div>

            {showHistory && (
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
                {userScratchHistory.length === 0 ? (
                  <p className="text-slate-500 text-[11px] py-4 text-center">No scratch cards played yet.</p>
                ) : (
                  userScratchHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
                    >
                      <div>
                        <span className="font-bold text-white uppercase">{h.tier}</span>
                        <span className="text-slate-400 text-[10px] ml-2">{h.date}</span>
                      </div>
                      <span className={`font-bold ${h.isWin ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {h.isWin ? `+$${h.prizeAmount.toFixed(2)}` : 'No Match'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
