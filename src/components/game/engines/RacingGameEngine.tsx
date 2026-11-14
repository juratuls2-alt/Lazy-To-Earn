import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { Play, RotateCcw, ArrowLeft, ArrowRight, Zap, Shield, Trophy } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const RacingGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [gameOver, setGameOver] = useState(false);
  const [lane, setLane] = useState(1); // 0: Left, 1: Center, 2: Right
  const [boostActive, setBoostActive] = useState(false);
  const [tilt, setTilt] = useState(0); // For monster truck / drift

  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const gameId = game.id;

  // Steering handlers
  const steerLeft = () => setLane((l) => Math.max(0, l - 1));
  const steerRight = () => setLane((l) => Math.min(2, l + 1));
  const triggerBoost = () => {
    setBoostActive(true);
    setTimeout(() => setBoostActive(false), 2000);
  };
  const tiltLeft = () => setTilt((t) => Math.max(-30, t - 15));
  const tiltRight = () => setTilt((t) => Math.min(30, t + 15));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPausedRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        steerLeft();
        tiltLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        steerRight();
        tiltRight();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        triggerBoost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let roadOffset = 0;

    // Obstacles and coins
    interface RoadEntity {
      lane: number;
      y: number;
      type: 'car' | 'coin' | 'cone' | 'ramp';
      color: string;
    }

    const entities: RoadEntity[] = [];
    let frameCount = 0;

    const loop = () => {
      if (!isPausedRef.current && !gameOver) {
        frameCount++;

        // Canvas setup
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Road background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Draw asphalt track
        const trackLeft = 40;
        const trackWidth = w - 80;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(trackLeft, 0, trackWidth, h);

        // Draw curbs
        const curbWidth = 8;
        roadOffset = (roadOffset + (boostActive ? 8 : 4)) % 40;

        for (let y = -40 + roadOffset; y < h; y += 40) {
          ctx.fillStyle = Math.floor(y / 40) % 2 === 0 ? '#ef4444' : '#ffffff';
          ctx.fillRect(trackLeft - curbWidth, y, curbWidth, 40);
          ctx.fillRect(trackLeft + trackWidth, y, curbWidth, 40);
        }

        // Draw Lane dividers
        const laneWidth = trackWidth / 3;
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -roadOffset;
        ctx.lineWidth = 3;

        // Line 1
        ctx.beginPath();
        ctx.moveTo(trackLeft + laneWidth, 0);
        ctx.lineTo(trackLeft + laneWidth, h);
        ctx.stroke();

        // Line 2
        ctx.beginPath();
        ctx.moveTo(trackLeft + laneWidth * 2, 0);
        ctx.lineTo(trackLeft + laneWidth * 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Spawn traffic / coins
        if (frameCount % (boostActive ? 40 : 60) === 0) {
          const spawnLane = Math.floor(Math.random() * 3);
          const isCoin = Math.random() > 0.4;
          entities.push({
            lane: spawnLane,
            y: -50,
            type: isCoin ? 'coin' : gameId === 'parking_master' ? 'cone' : 'car',
            color: isCoin ? '#fbbf24' : ['#38bdf8', '#a855f7', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)],
          });
        }

        // Move and render entities
        const speed = boostActive ? 7 : 4;
        for (let i = entities.length - 1; i >= 0; i--) {
          const e = entities[i];
          e.y += speed;

          const ex = trackLeft + e.lane * laneWidth + laneWidth / 2;

          if (e.type === 'coin') {
            // Draw Gold Coin
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(ex, e.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('$', ex, e.y + 3);
          } else if (e.type === 'cone') {
            // Parking cone
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(ex, e.y - 15);
            ctx.lineTo(ex - 12, e.y + 15);
            ctx.lineTo(ex + 12, e.y + 15);
            ctx.closePath();
            ctx.fill();
          } else {
            // Traffic Vehicle
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.roundRect(ex - 18, e.y - 30, 36, 60, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffffff33';
            ctx.stroke();
            // Headlights & windshield
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ex - 14, e.y - 12, 28, 16);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(ex - 14, e.y + 24, 6, 4);
            ctx.fillRect(ex + 8, e.y + 24, 6, 4);
          }

          // Player collision detection
          const playerY = h - 80;
          const playerX = trackLeft + lane * laneWidth + laneWidth / 2;

          if (e.lane === lane && Math.abs(e.y - playerY) < 45) {
            if (e.type === 'coin') {
              // Collected coin
              entities.splice(i, 1);
              setScore((s) => {
                const next = s + 2;
                scoreRef.current = next;
                return next;
              });
            } else {
              // Hit obstacle
              entities.splice(i, 1);
              setScore((s) => {
                const next = Math.max(0, s - 1);
                scoreRef.current = next;
                return next;
              });
            }
          } else if (e.y > h + 60) {
            // Passed successfully
            if (e.type !== 'coin') {
              setScore((s) => {
                const next = s + 1;
                scoreRef.current = next;
                return next;
              });
            }
            entities.splice(i, 1);
          }
        }

        // Draw Player Vehicle
        const playerX = trackLeft + lane * laneWidth + laneWidth / 2;
        const playerY = h - 80;

        ctx.save();
        ctx.translate(playerX, playerY);

        if (gameId === 'drift_racing') {
          ctx.rotate((tilt * Math.PI) / 180);
        }

        // Vehicle shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 24, 38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle Body
        const isMonster = gameId === 'monster_truck_challenge';
        const carColor = boostActive ? '#f59e0b' : '#10b981';
        ctx.fillStyle = carColor;
        ctx.beginPath();
        ctx.roundRect(isMonster ? -22 : -18, -32, isMonster ? 44 : 36, isMonster ? 64 : 64, 8);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -14, 28, 16);

        // Nitrous flames if boost
        if (boostActive) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-10, 32);
          ctx.lineTo(0, 48);
          ctx.lineTo(10, 32);
          ctx.fill();
        }

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-14, -30, 6, 4);
        ctx.fillRect(8, -30, 6, 4);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lane, boostActive, tilt, gameOver, gameId]);

  // Timer countdown
  useEffect(() => {
    if (gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameOver(true);
          const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
          const finalScore = scoreRef.current;
          // Winning condition: score >= 12
          const isWin = finalScore >= 12;
          onFinish(finalScore, isWin, duration);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, isPaused, onFinish]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-xl mx-auto">
      {/* Game HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-2xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Score:</span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">{score} pts</span>
          <span className="text-[10px] text-slate-400">(Win at 12+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Timer:</span>
          <span className={`font-bold text-sm tabular-nums ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-slate-950 flex items-center justify-center border-x border-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={340}
          className="w-full h-full object-contain"
        />

        {boostActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full animate-bounce shadow-lg flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>NITROUS BOOST 2X</span>
          </div>
        )}
      </div>

      {/* Touch & Keyboard Controls */}
      <div className="w-full p-3 bg-slate-900 border border-slate-800 rounded-b-2xl">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={steerLeft}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Steer Left</span>
          </button>

          <button
            type="button"
            onClick={triggerBoost}
            className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Boost [Space]</span>
          </button>

          <button
            type="button"
            onClick={steerRight}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer transition-colors"
          >
            <span>Steer Right</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
          Desktop: Use [Left / Right Arrow / A &amp; D] to steer · [Space] for Nitro
        </p>
      </div>
    </div>
  );
};
