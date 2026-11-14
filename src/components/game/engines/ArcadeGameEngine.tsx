import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Target } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const ArcadeGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const gameId = game.id;

  // Directions for Snake
  const snakeDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });

  // Flappy Bird Jump
  const birdVelocityRef = useRef<number>(0);
  const birdYRef = useRef<number>(150);

  // Paddle X for Brick Breaker / Space Shooter
  const playerXRef = useRef<number>(200);

  const setSnakeDir = (x: number, y: number) => {
    // Prevent immediate 180 reverse
    if (snakeDirRef.current.x + x === 0 && snakeDirRef.current.y + y === 0) return;
    snakeDirRef.current = { x, y };
  };

  const jumpFlappy = () => {
    birdVelocityRef.current = -7;
  };

  const movePlayerLeft = () => {
    playerXRef.current = Math.max(30, playerXRef.current - 35);
  };

  const movePlayerRight = () => {
    playerXRef.current = Math.min(370, playerXRef.current + 35);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPausedRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSnakeDir(0, -1);
        jumpFlappy();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSnakeDir(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setSnakeDir(-1, 0);
        movePlayerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setSnakeDir(1, 0);
        movePlayerRight();
      } else if (e.key === ' ') {
        e.preventDefault();
        jumpFlappy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    // SNAKE DATA
    let snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    let food = { x: 15, y: 10 };
    const gridSize = 20;

    // BRICK BREAKER DATA
    interface Brick {
      x: number;
      y: number;
      w: number;
      h: number;
      alive: boolean;
      color: string;
    }
    const bricks: Brick[] = [];
    if (gameId === 'brick_breaker') {
      const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8'];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          bricks.push({
            x: 25 + c * 50,
            y: 30 + r * 22,
            w: 42,
            h: 16,
            alive: true,
            color: colors[r],
          });
        }
      }
    }
    let ball = { x: 200, y: 240, vx: 3, vy: -3, radius: 6 };

    // FLAPPY BIRD DATA
    interface Pipe {
      x: number;
      topH: number;
      gap: number;
      passed: boolean;
    }
    const pipes: Pipe[] = [
      { x: 400, topH: 100, gap: 110, passed: false },
      { x: 620, topH: 140, gap: 110, passed: false },
    ];

    // SPACE SHOOTER DATA
    interface Bullet {
      x: number;
      y: number;
    }
    interface Enemy {
      x: number;
      y: number;
      alive: boolean;
    }
    const bullets: Bullet[] = [];
    const enemies: Enemy[] = [];

    // FRUIT SLICE DATA
    interface Fruit {
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: 'watermelon' | 'orange' | 'bomb';
      sliced: boolean;
    }
    const fruits: Fruit[] = [];

    const loop = () => {
      if (!isPausedRef.current && !gameOver) {
        frame++;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Dark background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // ==========================================
        // 13. SNAKE GAME
        // ==========================================
        if (gameId === 'snake_game') {
          // Snake movement every 6 frames
          if (frame % 6 === 0) {
            const head = {
              x: snake[0].x + snakeDirRef.current.x,
              y: snake[0].y + snakeDirRef.current.y,
            };

            // Wrap around walls
            const cols = Math.floor(w / gridSize);
            const rows = Math.floor(h / gridSize);
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;

            // Check food collision
            if (head.x === food.x && head.y === food.y) {
              snake.unshift(head);
              food = {
                x: Math.floor(Math.random() * (cols - 2)) + 1,
                y: Math.floor(Math.random() * (rows - 2)) + 1,
              };
              setScore((s) => {
                const next = s + 2;
                scoreRef.current = next;
                return next;
              });
            } else {
              snake.unshift(head);
              snake.pop();
            }
          }

          // Draw Food
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(food.x * gridSize + 10, food.y * gridSize + 10, 8, 0, Math.PI * 2);
          ctx.fill();

          // Draw Snake
          snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? '#10b981' : '#059669';
            ctx.beginPath();
            ctx.roundRect(seg.x * gridSize + 2, seg.y * gridSize + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
          });
        }

        // ==========================================
        // 14. BRICK BREAKER
        // ==========================================
        else if (gameId === 'brick_breaker') {
          // Move ball
          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.x < ball.radius || ball.x > w - ball.radius) ball.vx = -ball.vx;
          if (ball.y < ball.radius) ball.vy = -ball.vy;

          // Paddle collision
          const paddleW = 75;
          const paddleY = h - 25;
          const px = playerXRef.current;
          if (
            ball.y + ball.radius >= paddleY &&
            ball.y - ball.radius <= paddleY + 12 &&
            ball.x >= px - paddleW / 2 &&
            ball.x <= px + paddleW / 2
          ) {
            ball.vy = -Math.abs(ball.vy);
            ball.vx = ((ball.x - px) / (paddleW / 2)) * 4;
          }

          // Reset if falls
          if (ball.y > h + 10) {
            ball.x = px;
            ball.y = 200;
            ball.vy = -3;
          }

          // Draw Bricks
          bricks.forEach((b) => {
            if (b.alive) {
              if (
                ball.x + ball.radius >= b.x &&
                ball.x - ball.radius <= b.x + b.w &&
                ball.y + ball.radius >= b.y &&
                ball.y - ball.radius <= b.y + b.h
              ) {
                b.alive = false;
                ball.vy = -ball.vy;
                setScore((s) => {
                  const next = s + 1;
                  scoreRef.current = next;
                  return next;
                });
              }

              ctx.fillStyle = b.color;
              ctx.beginPath();
              ctx.roundRect(b.x, b.y, b.w, b.h, 4);
              ctx.fill();
            }
          });

          // Draw Ball
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();

          // Draw Paddle
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(px - paddleW / 2, paddleY, paddleW, 12, 6);
          ctx.fill();
        }

        // ==========================================
        // 15. FLAPPY BIRD
        // ==========================================
        else if (gameId === 'flappy_bird') {
          // Bird physics
          birdVelocityRef.current += 0.35; // gravity
          birdYRef.current += birdVelocityRef.current;

          if (birdYRef.current > h - 20) {
            birdYRef.current = h - 20;
            birdVelocityRef.current = 0;
          }
          if (birdYRef.current < 10) birdYRef.current = 10;

          // Pipes
          pipes.forEach((p) => {
            p.x -= 2.5;
            if (p.x < -60) {
              p.x = w + 40;
              p.topH = Math.floor(Math.random() * 120) + 60;
              p.passed = false;
            }

            // Draw Pipes
            ctx.fillStyle = '#10b981';
            ctx.fillRect(p.x, 0, 48, p.topH);
            ctx.fillRect(p.x, p.topH + p.gap, 48, h - (p.topH + p.gap));

            // Pipe borders
            ctx.strokeStyle = '#047857';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, 48, p.topH);
            ctx.strokeRect(p.x, p.topH + p.gap, 48, h - (p.topH + p.gap));

            // Scoring
            if (!p.passed && p.x < 100) {
              p.passed = true;
              setScore((s) => {
                const next = s + 3;
                scoreRef.current = next;
                return next;
              });
            }
          });

          // Draw Bird
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(100, birdYRef.current, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(110, birdYRef.current + 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(104, birdYRef.current - 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // ==========================================
        // 16. SPACE SHOOTER / BUBBLE / FRUIT
        // ==========================================
        else {
          // Starfield animation
          ctx.fillStyle = '#ffffff44';
          for (let i = 0; i < 20; i++) {
            const sx = (i * 37 + frame * 2) % w;
            const sy = (i * 59 + frame * 3) % h;
            ctx.fillRect(sx, sy, 2, 2);
          }

          // Spawn enemies / targets
          if (frame % 45 === 0) {
            enemies.push({
              x: Math.floor(Math.random() * (w - 60)) + 30,
              y: -20,
              alive: true,
            });
          }

          // Auto-shoot bullets
          if (frame % 20 === 0) {
            bullets.push({ x: playerXRef.current, y: h - 50 });
          }

          // Update bullets
          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            b.y -= 7;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(b.x - 2, b.y, 4, 10);
            if (b.y < -10) bullets.splice(bi, 1);
          }

          // Update enemies
          for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const en = enemies[ei];
            en.y += 2.5;

            // Collision with bullets
            for (let bi = bullets.length - 1; bi >= 0; bi--) {
              const b = bullets[bi];
              if (Math.abs(b.x - en.x) < 18 && Math.abs(b.y - en.y) < 18) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                setScore((s) => {
                  const next = s + 1;
                  scoreRef.current = next;
                  return next;
                });
                break;
              }
            }

            if (en.y > h + 30) enemies.splice(ei, 1);
            else {
              ctx.fillStyle = '#ec4899';
              ctx.beginPath();
              ctx.arc(en.x, en.y, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillText('👾', en.x - 7, en.y + 4);
            }
          }

          // Draw Player Ship
          const px = playerXRef.current;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(px, h - 55);
          ctx.lineTo(px - 18, h - 25);
          ctx.lineTo(px + 18, h - 25);
          ctx.closePath();
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameId, gameOver]);

  // Overall Timer
  useEffect(() => {
    if (gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameOver(true);
          const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
          const finalScore = scoreRef.current;
          const isWin = finalScore >= 8;
          onFinish(finalScore, isWin, duration);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, isPaused, onFinish]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* HUD Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-2xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Score:</span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">{score} pts</span>
          <span className="text-[10px] text-slate-400">(Win at 8+)</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-slate-950 flex items-center justify-center border-x border-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={320}
          className="w-full h-full object-contain"
          onClick={jumpFlappy}
        />
      </div>

      {/* Responsive Touch Controls */}
      <div className="w-full p-3 bg-slate-900 border border-slate-800 rounded-b-2xl">
        {gameId === 'snake_game' ? (
          <div className="flex flex-col items-center gap-1.5 max-w-[180px] mx-auto">
            <button
              type="button"
              onClick={() => setSnakeDir(0, -1)}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold cursor-pointer shadow"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSnakeDir(-1, 0)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold cursor-pointer shadow"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSnakeDir(1, 0)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold cursor-pointer shadow"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSnakeDir(0, 1)}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold cursor-pointer shadow"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        ) : gameId === 'flappy_bird' ? (
          <button
            type="button"
            onClick={jumpFlappy}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>TAP TO FLAP WINGS [Space]</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={movePlayerLeft}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Move Left [A]</span>
            </button>
            <button
              type="button"
              onClick={movePlayerRight}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
            >
              <span>Move Right [D]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
          Use Arrow Keys or on-screen buttons · Score points before timer expires
        </p>
      </div>
    </div>
  );
};
