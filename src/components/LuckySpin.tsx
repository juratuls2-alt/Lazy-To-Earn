import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SPIN_SEGMENTS } from '../db/mockDb';
import { SpinSegment } from '../types';
import {
  Disc,
  Sparkles,
  Trophy,
  History,
  ShieldCheck,
  Crown,
  AlertCircle,
  Coins,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export const LuckySpin: React.FC = () => {
  const { user, spinWheel, userSpinHistory, setCurrentView, effectiveVipTier, vipTiersConfig } = useApp();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonSegment, setWonSegment] = useState<SpinSegment | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const vip = vipTiersConfig[effectiveVipTier] || vipTiersConfig.Free;
  const maxSpins = vip.dailyFreeSpins;
  const spinsUsed = user?.spinsUsedToday || 0;
  const spinsRemaining = Math.max(0, maxSpins - spinsUsed);

  const numSegments = SPIN_SEGMENTS.length;
  const segmentAngle = 360 / numSegments;

  const handleSpinClick = async () => {
    if (isSpinning) return;
    if (spinsRemaining <= 0) {
      setSpinError(`You have used all ${maxSpins} spins for today. Upgrade your VIP tier for more spins!`);
      return;
    }

    setSpinError(null);
    setWonSegment(null);
    setIsSpinning(true);

    try {
      const res = await spinWheel();
      if (!res.success) {
        setSpinError(res.error || 'Spin verification failed');
        setIsSpinning(false);
        return;
      }

      const segment = res.segment;
      const targetIndex = SPIN_SEGMENTS.findIndex((s) => s.id === segment.id);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      // Calculate final rotation so the pointer (at 12 o'clock, 270 deg or top) aligns with the segment
      // Segment 0 center is at: (0.5 * segmentAngle)
      const targetAngle = 360 - (safeIndex * segmentAngle + segmentAngle / 2);
      const extraSpins = 360 * 6; // 6 full rotations
      const finalRotation = rotation + extraSpins + (targetAngle - (rotation % 360) + 360) % 360;

      setRotation(finalRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setWonSegment(segment);
      }, 4500);
    } catch (err: any) {
      setSpinError(err?.message || 'Error executing spin');
      setIsSpinning(false);
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
                <Disc className="w-3.5 h-3.5 animate-spin" />
                <span>Provably Fair RNG</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Server-Side Verified</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Lucky Spin Wheel 🎡
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Spin the wheel daily to win instant withdrawable cash prizes, points, and multipliers!
              Anti-cheat protection ensures 100% genuine outcomes verified on our backend.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex-1 sm:flex-initial text-center min-w-[130px]">
              <span className="block text-[10px] text-slate-400 font-mono uppercase">Spins Remaining</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {spinsRemaining} / {maxSpins}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{vip.name}</span>
            </div>

            <button
              onClick={() => setCurrentView('vip_membership')}
              className="px-4 py-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/40 text-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Get More Spins</span>
            </button>
          </div>
        </div>
      </div>

      {spinError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{spinError}</span>
        </div>
      )}

      {/* Main Wheel Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive Animated Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96">
            {/* Top Pointer Indicator */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 drop-shadow-lg">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />
            </div>

            {/* Outer Glowing Ring */}
            <div className="absolute inset-0 rounded-full border-8 border-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.25)]" />

            {/* The SVG Wheel */}
            <div
              className="w-full h-full rounded-full overflow-hidden shadow-2xl transition-transform ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: isSpinning ? '4.5s' : '0s',
                transitionTimingFunction: 'cubic-bezier(0.15, 0.85, 0.35, 1)',
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {SPIN_SEGMENTS.map((seg, idx) => {
                  const startAngle = (idx * segmentAngle * Math.PI) / 180;
                  const endAngle = ((idx + 1) * segmentAngle * Math.PI) / 180;
                  const x1 = 200 + 200 * Math.cos(startAngle);
                  const y1 = 200 + 200 * Math.sin(startAngle);
                  const x2 = 200 + 200 * Math.cos(endAngle);
                  const y2 = 200 + 200 * Math.sin(endAngle);
                  const pathData = `M 200 200 L ${x1} ${y1} A 200 200 0 0 1 ${x2} ${y2} Z`;

                  // Text rotation angle
                  const midAngleDeg = idx * segmentAngle + segmentAngle / 2;

                  return (
                    <g key={seg.id}>
                      <path d={pathData} fill={seg.color} stroke="#0f172a" strokeWidth="2" />
                      <g transform={`rotate(${midAngleDeg} 200 200)`}>
                        <text
                          x="320"
                          y="205"
                          fill={seg.textColor}
                          fontSize="13"
                          fontWeight="800"
                          textAnchor="middle"
                          transform="rotate(90 320 205)"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                        >
                          {seg.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Golden Hub / Spin Trigger Button */}
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || spinsRemaining <= 0}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full z-20 flex flex-col items-center justify-center font-black text-slate-950 shadow-2xl transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-amber-400 scale-95 opacity-90 cursor-not-allowed'
                  : spinsRemaining > 0
                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 hover:scale-105 shadow-amber-500/50'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-xs sm:text-sm tracking-wide uppercase font-extrabold mt-0.5">
                {isSpinning ? 'SPINNING' : spinsRemaining > 0 ? 'SPIN NOW' : 'NO SPINS'}
              </span>
            </button>
          </div>

          {/* Spin Action CTA Button */}
          <div className="mt-8 text-center space-y-2">
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || spinsRemaining <= 0}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? 'Calculating server outcome...' : `PLAY FREE SPIN (${spinsRemaining} LEFT)`}
            </button>
            <p className="text-[11px] text-slate-400 font-mono">
              Resets every midnight (00:00 UTC) · Free for all registered members
            </p>
          </div>
        </div>

        {/* Right Column: Prize Outcome Modal / Probability Matrix */}
        <div className="lg:col-span-5 space-y-5">
          {/* Winner Banner Card */}
          {wonSegment && (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/50 text-center space-y-3 shadow-2xl animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl mx-auto">
                🎁
              </div>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                Provably Verified Prize
              </span>
              <h3 className="text-2xl font-black text-white">{wonSegment.label} Won!</h3>
              <p className="text-xs text-slate-300">
                {wonSegment.type === 'cash'
                  ? `+$${(wonSegment.value * vip.multiplier).toFixed(2)} cash credited directly to your available withdrawable balance!`
                  : wonSegment.type === 'points'
                  ? `+${wonSegment.value} points added to your rewards wallet for tournaments and cards.`
                  : 'Better luck next spin! Additional spins available via VIP.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Credited to Wallet Balance</span>
              </div>
            </div>
          )}

          {/* Probability & Segments Overview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Prize Segments &amp; Probabilities</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">100% Fair</span>
            </div>

            <div className="space-y-2">
              {SPIN_SEGMENTS.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="font-bold text-white">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{seg.probabilityWeight}% Chance</span>
                    <span className="text-amber-400 font-semibold">
                      {seg.type === 'cash' ? `+$${(seg.value * vip.multiplier).toFixed(2)}` : seg.type === 'points' ? `+${seg.value} pts` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Spin History Toggle */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Your Spin Records</span>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono cursor-pointer"
              >
                {showHistory ? 'Hide' : `View (${userSpinHistory.length})`}
              </button>
            </div>

            {showHistory && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
                {userSpinHistory.length === 0 ? (
                  <p className="text-slate-500 text-[11px] py-2 text-center">No spins recorded yet today.</p>
                ) : (
                  userSpinHistory.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg">
                      <span className="text-white font-sans">{s.label}</span>
                      <span className="text-slate-400 text-[10px]">{s.date}</span>
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
