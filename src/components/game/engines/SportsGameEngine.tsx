import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { Play, RotateCcw, Shield, Zap, Target, Flame, ArrowLeft, ArrowRight } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const SportsGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const gameId = game.id;
  const startTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState('Take your shot!');

  // --- 25. BASKETBALL STATE ---
  const [ballState, setBallState] = useState<{ x: number; y: number; shooting: boolean }>({
    x: 100,
    y: 240,
    shooting: false,
  });

  // --- 26. FOOTBALL PENALTY STATE ---
  const [goaliePos, setGoaliePos] = useState<'left' | 'center' | 'right'>('center');
  const [kickResult, setKickResult] = useState<string | null>(null);

  // --- 27. TABLE TENNIS STATE ---
  const [rallyCount, setRallyCount] = useState(0);

  // --- 28. MINI GOLF STATE ---
  const [strokes, setStrokes] = useState(0);
  const [ballDistance, setBallDistance] = useState(15); // feet to hole

  // --- 29. BOXING STATE ---
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [isBlocking, setIsBlocking] = useState(false);

  // --- 30. BIKE RACING STATE ---
  const [bikeSpeed, setBikeSpeed] = useState(85); // km/h
  const [distanceKm, setDistanceKm] = useState(0.8);

  // Countdown timer
  useEffect(() => {
    if (gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishRound(score, score >= 8);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, isPaused, score]);

  const finishRound = (finalScore: number, isWin: boolean) => {
    setGameOver(true);
    const duration = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    onFinish(finalScore, isWin, duration);
  };

  // --- 25. BASKETBALL SHOOT ACTION ---
  const shootBasketball = () => {
    if (ballState.shooting || gameOver) return;
    setBallState({ x: 100, y: 240, shooting: true });
    setFeedback('Shooting ball towards the rim...');

    setTimeout(() => {
      const isSwish = Math.random() > 0.35;
      if (isSwish) {
        setScore((s) => {
          const next = s + 3;
          if (next >= 9) finishRound(next, true);
          return next;
        });
        setFeedback('SWISH! 3-Pointer Sunk! 🏀 (+3 pts)');
      } else {
        setScore((s) => s + 1);
        setFeedback('Hit the backboard! (+1 pt)');
      }
      setBallState({ x: 100, y: 240, shooting: false });
    }, 1200);
  };

  // --- 26. FOOTBALL SHOOT ACTION ---
  const shootPenalty = (corner: 'left' | 'center' | 'right') => {
    if (gameOver) return;
    const goalieChoices: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    const dive = goalieChoices[Math.floor(Math.random() * goalieChoices.length)];
    setGoaliePos(dive);

    if (dive !== corner) {
      // Goal!
      setKickResult('GOAL! ⚽');
      setFeedback('GOAAAL! Beautiful shot into the net!');
      setScore((s) => {
        const next = s + 4;
        if (next >= 12) finishRound(next, true);
        return next;
      });
    } else {
      // Saved
      setKickResult('SAVED!');
      setFeedback('Goalkeeper made a heroic diving save!');
      setScore((s) => s + 1);
    }
  };

  // --- 27. TABLE TENNIS RALLY ACTION ---
  const hitPingPong = () => {
    if (gameOver) return;
    const nextRally = rallyCount + 1;
    setRallyCount(nextRally);
    setScore((s) => s + 2);
    setFeedback(`Rally: ${nextRally} hits! Spinning return... 🏓`);

    if (nextRally >= 6) {
      setFeedback('Smash Winner! Table point won!');
      finishRound(score + 10, true);
    }
  };

  // --- 28. MINI GOLF PUTT ACTION ---
  const puttGolf = () => {
    if (gameOver) return;
    setStrokes((s) => s + 1);
    const progress = Math.floor(Math.random() * 6) + 4;
    const remaining = Math.max(0, ballDistance - progress);
    setBallDistance(remaining);

    if (remaining === 0) {
      setFeedback('IN THE HOLE! ⛳ Eagle Putt completed!');
      finishRound(25, true);
    } else {
      setScore((s) => s + 3);
      setFeedback(`Putt rolled ${progress}ft! (${remaining}ft left to cup)`);
    }
  };

  // --- 29. BOXING ACTIONS ---
  const strikeBoxer = (type: 'jab' | 'cross') => {
    if (gameOver) return;
    const dmg = type === 'cross' ? 20 : 12;
    const nextOppHp = Math.max(0, opponentHp - dmg);
    setOpponentHp(nextOppHp);
    setScore((s) => s + 3);

    if (nextOppHp === 0) {
      setFeedback('KNOCKOUT! Opponent down! 🥊');
      finishRound(30, true);
    } else {
      // Counter strike
      setFeedback(`Landed ${type.toUpperCase()}! Opponent counter-attacking...`);
      setTimeout(() => {
        if (!isBlocking) {
          setPlayerHp((hp) => Math.max(10, hp - 10));
        } else {
          setFeedback('Blocked counter-punch successfully! 🛡️');
        }
      }, 600);
    }
  };

  // --- 30. BIKE RACING SPEED BOOST ---
  const boostBike = () => {
    if (gameOver) return;
    setBikeSpeed((spd) => Math.min(220, spd + 25));
    const nextDist = +(distanceKm - 0.2).toFixed(1);
    setDistanceKm(nextDist);
    setScore((s) => s + 3);

    if (nextDist <= 0) {
      setFeedback('CHECKERED FLAG! Finish line reached! 🏁');
      finishRound(25, true);
    } else {
      setFeedback(`Nitrous boost fired! Speed: ${bikeSpeed} km/h`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* HUD Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-2xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Score:</span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">{score} pts</span>
        </div>
        <div className="text-xs text-amber-300 font-medium truncate max-w-[200px]">
          {feedback}
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Arena */}
      <div className="w-full min-h-[340px] bg-slate-950 p-4 border-x border-slate-800 flex flex-col items-center justify-center">
        {/* GAME 25: BASKETBALL CHALLENGE */}
        {gameId === 'basketball_challenge' && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="relative w-full h-44 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between px-8 overflow-hidden">
              {/* Backboard & Rim */}
              <div className="absolute right-6 top-8 flex items-center">
                <div className="w-2 h-20 bg-white rounded shadow-md" />
                <div className="w-12 h-2 bg-rose-500 rounded-r shadow-lg relative">
                  <div className="w-10 h-8 border-b-2 border-x-2 border-white/60 absolute left-0 top-2" />
                </div>
              </div>

              {/* Basketball Animation */}
              <div
                className={`text-4xl transition-all duration-700 ${
                  ballState.shooting ? 'translate-x-48 -translate-y-12 rotate-180 scale-90' : ''
                }`}
              >
                🏀
              </div>

              <div className="absolute left-6 bottom-4 text-xs font-mono text-slate-400">
                Shooting Spot: Free-throw Line
              </div>
            </div>

            <button
              type="button"
              onClick={shootBasketball}
              disabled={ballState.shooting || gameOver}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4 fill-current" />
              <span>SHOOT BASKETBALL (Swish = +3 pts)</span>
            </button>
          </div>
        )}

        {/* GAME 26: FOOTBALL PENALTY SHOOTOUT */}
        {gameId === 'football_penalty' && (
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Goal Net */}
            <div className="relative w-full h-40 bg-slate-900 rounded-2xl border-2 border-white/80 p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="flex justify-between text-xs font-mono text-slate-400 relative z-10">
                <span>Top Left</span>
                <span>Crossbar</span>
                <span>Top Right</span>
              </div>

              {/* Goalkeeper */}
              <div
                className={`text-4xl transition-all duration-300 relative z-10 ${
                  goaliePos === 'left' ? 'text-left' : goaliePos === 'right' ? 'text-right' : 'text-center'
                }`}
              >
                🧤
              </div>

              <div className="text-3xl relative z-10">⚽</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => shootPenalty('left')}
                className="py-3 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer shadow"
              >
                Bottom Left
              </button>
              <button
                type="button"
                onClick={() => shootPenalty('center')}
                className="py-3 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer shadow"
              >
                Center Strike
              </button>
              <button
                type="button"
                onClick={() => shootPenalty('right')}
                className="py-3 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer shadow"
              >
                Top Right
              </button>
            </div>
          </div>
        )}

        {/* GAME 27: TABLE TENNIS */}
        {gameId === 'table_tennis' && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-full h-36 bg-emerald-950/70 border-4 border-white/80 rounded-2xl flex items-center justify-between px-6 shadow-inner relative">
              <div className="text-4xl">🏓</div>
              <div className="w-1 h-full bg-white/60 absolute left-1/2 -translate-x-1/2" />
              <div className="text-4xl">🤖</div>
            </div>

            <button
              type="button"
              onClick={hitPingPong}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-sm shadow cursor-pointer active:scale-95 transition-all"
            >
              Return Ping-Pong Rally Strike! 🏓
            </button>
          </div>
        )}

        {/* GAME 28: MINI GOLF */}
        {gameId === 'mini_golf' && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-full h-36 bg-emerald-900/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between px-8 shadow-inner">
              <div className="text-3xl">⛳</div>
              <div className="text-xs font-mono text-emerald-300">
                Distance: <strong>{ballDistance} ft</strong> · Strokes: {strokes}
              </div>
              <div className="text-2xl">🏌️</div>
            </div>

            <button
              type="button"
              onClick={puttGolf}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm shadow cursor-pointer active:scale-95 transition-all"
            >
              PUTT GOLF BALL INTO HOLE
            </button>
          </div>
        )}

        {/* GAME 29: BOXING CHALLENGE */}
        {gameId === 'boxing_challenge' && (
          <div className="w-full max-w-md space-y-5 text-center">
            {/* Health Bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-left">
                <span className="text-[10px] text-slate-400 uppercase font-mono">You (Player)</span>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-500" style={{ width: `${playerHp}%` }} />
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Rival Boxer</span>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-rose-500" style={{ width: `${opponentHp}%` }} />
                </div>
              </div>
            </div>

            <div className="flex justify-center text-5xl py-2">🥊 vs 🥊</div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => strikeBoxer('jab')}
                className="py-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs shadow cursor-pointer"
              >
                Quick Jab
              </button>
              <button
                type="button"
                onClick={() => strikeBoxer('cross')}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow cursor-pointer"
              >
                Heavy Cross
              </button>
              <button
                type="button"
                onClick={() => setIsBlocking(!isBlocking)}
                className={`py-3 rounded-xl border font-bold text-xs shadow cursor-pointer transition-colors ${
                  isBlocking ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {isBlocking ? 'Blocking 🛡️' : 'Block Punch'}
              </button>
            </div>
          </div>
        )}

        {/* GAME 30: BIKE RACING */}
        {gameId === 'bike_racing' && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-full h-36 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-inner">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Speedometer: <strong className="text-amber-400">{bikeSpeed} km/h</strong></span>
                <span>Distance: <strong className="text-emerald-400">{distanceKm} km</strong></span>
              </div>
              <div className="text-4xl">🏍️ 💨</div>
              <div className="text-[10px] text-slate-500 font-mono">Grand Highway Superbike Circuit</div>
            </div>

            <button
              type="button"
              onClick={boostBike}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm shadow cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>NITROUS SUPERBIKE BOOST!</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-b-2xl text-[11px] text-center text-slate-400 font-mono">
        Active sports physics engine · Complete round to claim your reward!
      </div>
    </div>
  );
};
