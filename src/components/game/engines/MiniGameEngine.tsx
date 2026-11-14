import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { Play, RotateCcw, Zap, Target, Sparkles, Check, Clock, Trophy } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const MiniGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const gameId = game.id;
  const startTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState('Game started! Complete the objective.');

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const finishRound = (finalScore: number, isWin: boolean) => {
    setGameOver(true);
    const duration = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    onFinish(finalScore, isWin, duration);
  };

  // ==========================================
  // 1. TAP THE CIRCLE STATE
  // ==========================================
  const [circleTarget, setCircleTarget] = useState<{ x: number; y: number; id: number }>({
    x: 50,
    y: 50,
    id: 1,
  });

  const handleTapCircle = () => {
    if (gameOver) return;
    setScore((s) => {
      const next = s + 1;
      if (next >= 8) {
        setFeedback('Target reached! 8 circles popped! 🎯');
        finishRound(next, true);
      } else {
        setFeedback(`Popped! ${next}/8 circles`);
      }
      return next;
    });
    // Spawn next circle
    setCircleTarget({
      x: Math.floor(Math.random() * 70) + 15,
      y: Math.floor(Math.random() * 70) + 15,
      id: Math.random(),
    });
  };

  // ==========================================
  // 2. SPEED TAP CHALLENGE STATE
  // ==========================================
  const [tapCount, setTapCount] = useState(0);

  const handleSpeedTap = () => {
    if (gameOver) return;
    setTapCount((c) => {
      const next = c + 1;
      setScore(next);
      if (next >= 35) {
        setFeedback('SPEED CHAMPION! 35+ Taps reached! ⚡');
        finishRound(next, true);
      }
      return next;
    });
  };

  // ==========================================
  // 3. WHACK-A-MOLE STATE
  // ==========================================
  const [activeMole, setActiveMole] = useState<number | null>(4);

  useEffect(() => {
    if (gameId !== 'whack_a_mole' || gameOver || isPaused) return;
    const interval = setInterval(() => {
      setActiveMole(Math.floor(Math.random() * 9));
    }, 900);
    return () => clearInterval(interval);
  }, [gameId, gameOver, isPaused]);

  const handleWhack = (index: number) => {
    if (activeMole === index && !gameOver) {
      setScore((s) => {
        const next = s + 1;
        if (next >= 6) {
          setFeedback('6 Moles Whacked! Victory! 🔨');
          finishRound(next, true);
        } else {
          setFeedback(`Whacked mole! (${next}/6)`);
        }
        return next;
      });
      setActiveMole(null);
    }
  };

  // ==========================================
  // 4. COLOR REACTION TEST STATE
  // ==========================================
  const [reactionPhase, setReactionPhase] = useState<'wait' | 'ready' | 'clicked'>('wait');
  const [greenTime, setGreenTime] = useState(0);
  const [reactionMs, setReactionMs] = useState<number | null>(null);

  useEffect(() => {
    if (gameId !== 'color_reaction_test' || gameOver) return;
    const delay = Math.floor(Math.random() * 2000) + 1500;
    const t = setTimeout(() => {
      setReactionPhase('ready');
      setGreenTime(Date.now());
      setFeedback('CLICK NOW!!');
    }, delay);
    return () => clearTimeout(t);
  }, [gameId, gameOver]);

  const handleReactionClick = () => {
    if (reactionPhase === 'wait') {
      setFeedback('Too early! Wait for GREEN!');
    } else if (reactionPhase === 'ready') {
      const ms = Date.now() - greenTime;
      setReactionMs(ms);
      setReactionPhase('clicked');
      setScore(ms < 380 ? 30 : 15);
      if (ms < 380) {
        setFeedback(`Lighting Fast! ${ms}ms Reaction Time! 🚦`);
        finishRound(30, true);
      } else {
        setFeedback(`Reaction Time: ${ms}ms. Good try!`);
        finishRound(15, false);
      }
    }
  };

  // ==========================================
  // 5. CATCH FALLING OBJECTS STATE
  // ==========================================
  const [basketX, setBasketX] = useState(50);
  const [fallingItems, setFallingItems] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (gameId !== 'catch_falling_objects' || gameOver || isPaused) return;
    const interval = setInterval(() => {
      setFallingItems((prev) => [
        ...prev.map((item) => ({ ...item, y: item.y + 12 })),
        { id: Math.random(), x: Math.floor(Math.random() * 80) + 10, y: 0 },
      ].filter((item) => {
        // check catch
        if (item.y >= 75 && item.y <= 90 && Math.abs(item.x - basketX) < 18) {
          setScore((s) => {
            const next = s + 1;
            if (next >= 8) {
              setFeedback('Caught 8 stars! Victory! 🧺');
              finishRound(next, true);
            }
            return next;
          });
          return false;
        }
        return item.y < 100;
      }));
    }, 400);

    return () => clearInterval(interval);
  }, [gameId, basketX, gameOver, isPaused]);

  // ==========================================
  // 6. MEMORY MATCH STATE
  // ==========================================
  interface MiniCard {
    id: number;
    icon: string;
    flipped: boolean;
    matched: boolean;
  }
  const [miniCards, setMiniCards] = useState<MiniCard[]>(() => {
    const icons = ['⭐', '💎', '🔥', '🏆'];
    return [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon, flipped: false, matched: false }));
  });
  const [miniFlipped, setMiniFlipped] = useState<number[]>([]);

  const handleMiniCardFlip = (id: number) => {
    if (miniFlipped.length >= 2 || gameOver) return;
    const card = miniCards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const nextFlipped = [...miniFlipped, id];
    setMiniCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setMiniFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [id1, id2] = nextFlipped;
      const c1 = miniCards.find((c) => c.id === id1)!;
      const c2 = miniCards.find((c) => c.id === id2)!;
      if (c1.icon === c2.icon) {
        setTimeout(() => {
          setMiniCards((prev) =>
            prev.map((c) => (c.id === id1 || c.id === id2 ? { ...c, matched: true } : c))
          );
          setMiniFlipped([]);
          setScore((s) => {
            const next = s + 5;
            const allMatched = miniCards.filter((c) => c.matched).length + 2 >= miniCards.length;
            if (allMatched) {
              setFeedback('All Pairs Matched! 🎴');
              finishRound(next + 10, true);
            }
            return next;
          });
        }, 400);
      } else {
        setTimeout(() => {
          setMiniCards((prev) =>
            prev.map((c) => (c.id === id1 || c.id === id2 ? { ...c, flipped: false } : c))
          );
          setMiniFlipped([]);
        }, 800);
      }
    }
  };

  // ==========================================
  // 7. FIND THE DIFFERENCE STATE
  // ==========================================
  const [diffTiles, setDiffTiles] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [diffTarget] = useState<number>(3);

  const handleDiffClick = (idx: number) => {
    if (gameOver) return;
    if (idx === diffTarget) {
      setScore(25);
      setFeedback('Anomaly Spotted! Difference Identified! 🔍');
      finishRound(25, true);
    } else {
      setFeedback('Not quite. Inspect the subtle shading difference!');
    }
  };

  // ==========================================
  // 8. QUICK MATH STATE
  // ==========================================
  const [mathQ, setMathQ] = useState({ q: '9 × 7 = ?', ans: 63, options: [54, 63, 72, 81] });
  const [mathSolved, setMathSolved] = useState(0);

  const handleQuickMath = (chosen: number) => {
    if (gameOver) return;
    if (chosen === mathQ.ans) {
      const nextCount = mathSolved + 1;
      setMathSolved(nextCount);
      setScore(nextCount * 6);
      if (nextCount >= 3) {
        setFeedback('Math Wizard! 3 Equations Solved! 🧠');
        finishRound(nextCount * 6 + 10, true);
      } else {
        // next question
        const a = Math.floor(Math.random() * 9) + 4;
        const b = Math.floor(Math.random() * 8) + 3;
        const ans = a * b;
        setMathQ({
          q: `${a} × ${b} = ?`,
          ans,
          options: [ans, ans + 4, ans - 6, ans + 9].sort(() => Math.random() - 0.5),
        });
        setFeedback(`Correct! ${nextCount}/3 solved.`);
      }
    } else {
      setFeedback('Oops! Try the next one.');
    }
  };

  // ==========================================
  // 9. NUMBER SEQUENCE STATE
  // ==========================================
  const seqData = {
    sequence: '3, 6, 12, 24, ?',
    ans: 48,
    options: [36, 42, 48, 56],
  };

  const handleSequenceClick = (val: number) => {
    if (gameOver) return;
    if (val === seqData.ans) {
      setScore(25);
      setFeedback('Pattern Solved! Correct answer is 48! 🔢');
      finishRound(25, true);
    } else {
      setFeedback('Incorrect pattern deduction.');
    }
  };

  // ==========================================
  // 10. WORD SCRAMBLE STATE
  // ==========================================
  const scrambleData = {
    scrambled: 'E - R - W - D - A',
    ans: 'REWARD',
    options: ['DRAW', 'REWARD', 'WADER', 'DRAFT'],
  };

  const handleScrambleWord = (word: string) => {
    if (gameOver) return;
    if (word === scrambleData.ans) {
      setScore(25);
      setFeedback('Word Unscrambled: REWARD! 🔤');
      finishRound(25, true);
    } else {
      setFeedback('Incorrect word selection.');
    }
  };

  // ==========================================
  // 11. ROCK PAPER SCISSORS STATE
  // ==========================================
  const [rpsRound, setRpsRound] = useState(1);
  const [rpsScore, setRpsScore] = useState({ user: 0, bot: 0 });

  const handleRPS = (choice: 'rock' | 'paper' | 'scissors') => {
    if (gameOver) return;
    const botChoices: Array<'rock' | 'paper' | 'scissors'> = ['rock', 'paper', 'scissors'];
    const botChoice = botChoices[Math.floor(Math.random() * 3)];

    let win = false;
    let tie = choice === botChoice;
    if (
      (choice === 'rock' && botChoice === 'scissors') ||
      (choice === 'paper' && botChoice === 'rock') ||
      (choice === 'scissors' && botChoice === 'paper')
    ) {
      win = true;
    }

    if (tie) {
      setFeedback(`Tie! Both picked ${choice.toUpperCase()}`);
    } else if (win) {
      const nextU = rpsScore.user + 1;
      setRpsScore({ ...rpsScore, user: nextU });
      setFeedback(`Point! ${choice.toUpperCase()} beats ${botChoice.toUpperCase()}!`);
      if (nextU >= 2) {
        setScore(30);
        finishRound(30, true);
      }
    } else {
      const nextB = rpsScore.bot + 1;
      setRpsScore({ ...rpsScore, bot: nextB });
      setFeedback(`Bot point! ${botChoice.toUpperCase()} beats ${choice.toUpperCase()}!`);
      if (nextB >= 2) {
        setScore(15);
        finishRound(15, false);
      }
    }
  };

  // ==========================================
  // 12. COIN TOSS STATE
  // ==========================================
  const handleCoinToss = (pick: 'heads' | 'tails') => {
    if (gameOver) return;
    const outcome = Math.random() > 0.45 ? pick : pick === 'heads' ? 'tails' : 'heads';
    if (outcome === pick) {
      setScore(25);
      setFeedback(`Result: ${outcome.toUpperCase()}! Prediction Matched! 🪙`);
      finishRound(25, true);
    } else {
      setScore(12);
      setFeedback(`Result: ${outcome.toUpperCase()}. Consolation credited.`);
      finishRound(12, false);
    }
  };

  // ==========================================
  // 13. DICE CHALLENGE STATE
  // ==========================================
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 4]);

  const handleDiceGuess = (guess: 'over' | 'under' | 'seven') => {
    if (gameOver) return;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    setDiceValues([d1, d2]);

    const isMatch =
      (guess === 'over' && total > 7) ||
      (guess === 'under' && total < 7) ||
      (guess === 'seven' && total === 7);

    if (isMatch) {
      setScore(25);
      setFeedback(`Total was ${total}! Matched your call! 🎲`);
      finishRound(25, true);
    } else {
      setScore(12);
      setFeedback(`Total was ${total}. Nice try!`);
      finishRound(12, false);
    }
  };

  // ==========================================
  // 14. SPIN THE WHEEL STATE
  // ==========================================
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const handleSpinWheel = () => {
    if (spinning || gameOver) return;
    setSpinning(true);
    const targetDeg = wheelRotation + 1440 + Math.floor(Math.random() * 360);
    setWheelRotation(targetDeg);
    setFeedback('Wheel spinning at full speed... 🎡');

    setTimeout(() => {
      setSpinning(false);
      setScore(30);
      setFeedback('JACKPOT! Landed on 2.0x Gold Prize! 🎡');
      finishRound(30, true);
    }, 2000);
  };

  // ==========================================
  // 15. LUCKY NUMBER STATE
  // ==========================================
  const [scratched, setScratched] = useState<boolean[]>([false, false, false, false]);
  const luckySymbols = ['⭐', '⭐', '💎', '⭐'];

  const handleScratch = (idx: number) => {
    if (gameOver) return;
    const next = [...scratched];
    next[idx] = true;
    setScratched(next);
    if (next.filter(Boolean).length >= 3) {
      setScore(25);
      setFeedback('3 Lucky Stars Uncovered! Lucky Win! 🍀');
      finishRound(25, true);
    }
  };

  // ==========================================
  // 16. PERFECT TIMING STATE
  // ==========================================
  const [sliderPos, setSliderPos] = useState(0);
  const sliderDirRef = useRef(1);

  useEffect(() => {
    if (gameId !== 'perfect_timing' || gameOver || isPaused) return;
    const timer = setInterval(() => {
      setSliderPos((p) => {
        let next = p + sliderDirRef.current * 4;
        if (next >= 100) sliderDirRef.current = -1;
        if (next <= 0) sliderDirRef.current = 1;
        return next;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [gameId, gameOver, isPaused]);

  const handleTimingStop = () => {
    if (gameOver) return;
    // Green zone is 40 - 60
    if (sliderPos >= 40 && sliderPos <= 60) {
      setScore(30);
      setFeedback('BULLSEYE! Perfect green zone timing! 🎯');
      finishRound(30, true);
    } else {
      setScore(12);
      setFeedback(`Stopped at ${sliderPos}%. Outside target zone.`);
      finishRound(12, false);
    }
  };

  // ==========================================
  // 17. STOP THE TIMER STATE
  // ==========================================
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(true);

  useEffect(() => {
    if (gameId !== 'stop_the_timer' || !stopwatchRunning || gameOver) return;
    const timer = setInterval(() => {
      setStopwatchMs((m) => m + 35);
    }, 35);
    return () => clearInterval(timer);
  }, [gameId, stopwatchRunning, gameOver]);

  const handleStopwatchStop = () => {
    if (gameOver) return;
    setStopwatchRunning(false);
    const secs = stopwatchMs / 1000;
    const diff = Math.abs(secs - 5.0);
    if (diff <= 0.22) {
      setScore(30);
      setFeedback(`Target Hit! Stopped at ${secs.toFixed(3)}s (±${diff.toFixed(3)}s) ⏱️`);
      finishRound(30, true);
    } else {
      setScore(12);
      setFeedback(`Stopped at ${secs.toFixed(3)}s. Target was 5.000s.`);
      finishRound(12, false);
    }
  };

  // ==========================================
  // 18. TARGET SHOOTING STATE
  // ==========================================
  const [targetX, setTargetX] = useState(50);
  const targetDirRef = useRef(1);

  useEffect(() => {
    if (gameId !== 'target_shooting' || gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTargetX((x) => {
        let next = x + targetDirRef.current * 3;
        if (next >= 85) targetDirRef.current = -1;
        if (next <= 15) targetDirRef.current = 1;
        return next;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [gameId, gameOver, isPaused]);

  const handleFireDart = () => {
    if (gameOver) return;
    if (Math.abs(targetX - 50) < 15) {
      setScore(30);
      setFeedback('DIRECT BULLSEYE HIT! 🎯');
      finishRound(30, true);
    } else {
      setScore(12);
      setFeedback('Near miss on the outer rim.');
      finishRound(12, false);
    }
  };

  // ==========================================
  // 19. BALLOON POP STATE
  // ==========================================
  interface Balloon {
    id: number;
    x: number;
    y: number;
    color: string;
    isSkull?: boolean;
  }
  const [balloons, setBalloons] = useState<Balloon[]>(() => [
    { id: 1, x: 20, y: 30, color: 'bg-rose-500' },
    { id: 2, x: 50, y: 50, color: 'bg-amber-500' },
    { id: 3, x: 75, y: 20, color: 'bg-sky-500' },
    { id: 4, x: 35, y: 65, color: 'bg-emerald-500' },
    { id: 5, x: 60, y: 75, color: 'bg-purple-500' },
  ]);

  const handlePopBalloon = (id: number) => {
    if (gameOver) return;
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => {
      const next = s + 2;
      if (balloons.length <= 2) {
        setFeedback('All Balloons Popped! 🎈');
        finishRound(next + 10, true);
      }
      return next;
    });
  };

  // ==========================================
  // 20. STACK THE BLOCKS STATE
  // ==========================================
  const [towerHeight, setTowerHeight] = useState(1);

  const handleStackBlock = () => {
    if (gameOver) return;
    setTowerHeight((h) => {
      const next = h + 1;
      setScore(next * 4);
      if (next >= 5) {
        setFeedback('Tower Completed! 5 Blocks Stacked High! 🏗️');
        finishRound(next * 4 + 10, true);
      } else {
        setFeedback(`Block Placed! Layer ${next}/5 stacked.`);
      }
      return next;
    });
  };

  // Global timer countdown
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

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* HUD Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-t-2xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Score:</span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">{score} pts</span>
        </div>
        <div className="text-xs text-amber-300 font-medium truncate max-w-[220px]">
          {feedback}
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Main Interactive Arena */}
      <div className="w-full min-h-[350px] bg-slate-950 p-6 border-x border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
        {/* 1. TAP THE CIRCLE */}
        {gameId === 'tap_the_circle' && (
          <div className="w-full h-64 relative bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={handleTapCircle}
              style={{ left: `${circleTarget.x}%`, top: `${circleTarget.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center animate-pulse shadow-lg cursor-pointer hover:scale-110 active:scale-90 transition-transform"
            >
              TAP!
            </button>
          </div>
        )}

        {/* 2. SPEED TAP CHALLENGE */}
        {gameId === 'speed_tap_challenge' && (
          <div className="space-y-4 text-center">
            <div className="text-5xl font-black text-amber-400 font-mono tabular-nums">
              {tapCount}
            </div>
            <span className="text-xs text-slate-400 font-mono block">Target: 35+ Taps</span>
            <button
              type="button"
              onClick={handleSpeedTap}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 active:scale-90 text-slate-950 font-black text-xl shadow-2xl shadow-amber-500/30 flex items-center justify-center mx-auto cursor-pointer transition-all"
            >
              TAP!!
            </button>
          </div>
        )}

        {/* 3. WHACK-A-MOLE */}
        {gameId === 'whack_a_mole' && (
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
              const isUp = activeMole === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleWhack(idx)}
                  className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isUp
                      ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <span className="text-3xl">{isUp ? '🦫' : '🕳️'}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. COLOR REACTION TEST */}
        {gameId === 'color_reaction_test' && (
          <button
            type="button"
            onClick={handleReactionClick}
            className={`w-full max-w-sm h-52 rounded-3xl border-2 flex flex-col items-center justify-center text-center p-6 transition-all cursor-pointer shadow-2xl ${
              reactionPhase === 'ready'
                ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
                : reactionPhase === 'clicked'
                ? 'bg-sky-950 border-sky-400 text-white'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <span className="text-4xl mb-2">
              {reactionPhase === 'ready' ? '⚡' : reactionPhase === 'clicked' ? '⏱️' : '🛑'}
            </span>
            <h3 className="text-xl font-black">
              {reactionPhase === 'ready'
                ? 'TAP NOW!!'
                : reactionPhase === 'clicked'
                ? `${reactionMs} ms`
                : 'WAIT FOR GREEN...'}
            </h3>
            <span className="text-xs opacity-80 mt-1">
              {reactionPhase === 'wait' ? 'Do not tap yet!' : 'Tap anywhere in the box'}
            </span>
          </button>
        )}

        {/* 5. CATCH THE FALLING OBJECTS */}
        {gameId === 'catch_falling_objects' && (
          <div className="w-full h-64 relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {fallingItems.map((item) => (
              <div
                key={item.id}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute text-xl -translate-x-1/2 -translate-y-1/2"
              >
                ⭐
              </div>
            ))}
            {/* Basket */}
            <div
              style={{ left: `${basketX}%` }}
              className="absolute bottom-2 -translate-x-1/2 text-3xl transition-all duration-75"
            >
              🧺
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex justify-between pointer-events-auto">
              <button
                type="button"
                onClick={() => setBasketX((x) => Math.max(15, x - 20))}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs"
              >
                ← Left
              </button>
              <button
                type="button"
                onClick={() => setBasketX((x) => Math.min(85, x + 20))}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs"
              >
                Right →
              </button>
            </div>
          </div>
        )}

        {/* 6. MEMORY MATCH */}
        {gameId === 'mini_memory_match' && (
          <div className="grid grid-cols-4 gap-2.5 w-full max-w-xs">
            {miniCards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleMiniCardFlip(c.id)}
                className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-all cursor-pointer ${
                  c.matched
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                    : c.flipped
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {c.flipped || c.matched ? c.icon : '❓'}
              </button>
            ))}
          </div>
        )}

        {/* 7. FIND THE DIFFERENCE */}
        {gameId === 'find_the_difference' && (
          <div className="space-y-4 text-center">
            <span className="text-xs text-slate-400 font-mono">Spot the single odd tile:</span>
            <div className="grid grid-cols-3 gap-2 w-64 mx-auto">
              {diffTiles.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDiffClick(idx)}
                  className={`aspect-square rounded-xl border transition-all cursor-pointer ${
                    idx === diffTarget
                      ? 'bg-amber-500/35 border-amber-400'
                      : 'bg-amber-500/20 border-amber-500/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 8. QUICK MATH */}
        {gameId === 'mini_quick_math' && (
          <div className="space-y-5 text-center max-w-xs w-full">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-mono uppercase">Solve Equation:</span>
              <h3 className="text-3xl font-black text-white font-mono mt-1">{mathQ.q}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {mathQ.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickMath(opt)}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black text-base font-mono border border-slate-800 transition-colors cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 9. NUMBER SEQUENCE */}
        {gameId === 'number_sequence' && (
          <div className="space-y-5 text-center max-w-xs w-full">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-mono uppercase">What comes next?</span>
              <h3 className="text-2xl font-black text-white font-mono mt-1">{seqData.sequence}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {seqData.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSequenceClick(opt)}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-white font-black text-base font-mono border border-slate-800 transition-colors cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 10. WORD SCRAMBLE */}
        {gameId === 'word_scramble' && (
          <div className="space-y-5 text-center max-w-xs w-full">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-mono uppercase">Unscramble Letters:</span>
              <h3 className="text-2xl font-black text-white font-mono mt-1 tracking-widest">{scrambleData.scrambled}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {scrambleData.options.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleScrambleWord(w)}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-purple-500 hover:text-white text-white font-bold text-sm font-mono border border-slate-800 transition-colors cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 11. ROCK PAPER SCISSORS */}
        {gameId === 'rock_paper_scissors' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-emerald-400 font-bold">You: {rpsScore.user}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-rose-400 font-bold">Bot: {rpsScore.bot}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRPS('rock')}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 text-3xl cursor-pointer hover:scale-105 transition-all"
              >
                🪨
              </button>
              <button
                type="button"
                onClick={() => handleRPS('paper')}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 text-3xl cursor-pointer hover:scale-105 transition-all"
              >
                📄
              </button>
              <button
                type="button"
                onClick={() => handleRPS('scissors')}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 text-3xl cursor-pointer hover:scale-105 transition-all"
              >
                ✂️
              </button>
            </div>
          </div>
        )}

        {/* 12. COIN TOSS */}
        {gameId === 'mini_coin_toss' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 flex items-center justify-center text-4xl shadow-2xl mx-auto border-4 border-amber-400">
              🪙
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCoinToss('heads')}
                className="py-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs border border-slate-800 cursor-pointer shadow"
              >
                Predict Heads
              </button>
              <button
                type="button"
                onClick={() => handleCoinToss('tails')}
                className="py-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs border border-slate-800 cursor-pointer shadow"
              >
                Predict Tails
              </button>
            </div>
          </div>
        )}

        {/* 13. DICE CHALLENGE */}
        {gameId === 'dice_challenge' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="flex justify-center gap-3 text-4xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white shadow-lg">
                {diceValues[0]}
              </div>
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white shadow-lg">
                {diceValues[1]}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDiceGuess('under')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs border border-slate-800"
              >
                Under 7
              </button>
              <button
                type="button"
                onClick={() => handleDiceGuess('seven')}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
              >
                Lucky 7
              </button>
              <button
                type="button"
                onClick={() => handleDiceGuess('over')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs border border-slate-800"
              >
                Over 7
              </button>
            </div>
          </div>
        )}

        {/* 14. SPIN THE WHEEL */}
        {gameId === 'mini_spin_wheel' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div
              style={{ transform: `rotate(${wheelRotation}deg)` }}
              className="w-40 h-40 rounded-full border-4 border-amber-400 bg-[conic-gradient(#f59e0b_0deg_45deg,#38bdf8_45deg_90deg,#10b981_90deg_135deg,#ec4899_135deg_180deg,#8b5cf6_180deg_225deg,#f97316_225deg_270deg,#14b8a6_270deg_315deg,#eab308_315deg_360deg)] mx-auto shadow-2xl transition-transform duration-[2000ms] flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                ★
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpinWheel}
              disabled={spinning}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
            >
              {spinning ? 'SPINNING...' : 'SPIN THE WHEEL NOW'}
            </button>
          </div>
        )}

        {/* 15. LUCKY NUMBER */}
        {gameId === 'lucky_number' && (
          <div className="space-y-4 text-center max-w-xs w-full">
            <span className="text-xs text-slate-400 font-mono">Scratch cards to uncover stars:</span>
            <div className="grid grid-cols-2 gap-3">
              {scratched.map((isRevealed, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleScratch(idx)}
                  className={`aspect-[4/3] rounded-2xl border font-black text-3xl flex items-center justify-center transition-all cursor-pointer shadow ${
                    isRevealed
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {isRevealed ? luckySymbols[idx] : '❓'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 16. PERFECT TIMING */}
        {gameId === 'perfect_timing' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="relative w-full h-8 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
              {/* Green Bullseye Zone */}
              <div className="absolute left-[40%] right-[40%] h-full bg-emerald-500/40 border-x-2 border-emerald-400" />
              {/* Needle Indicator */}
              <div
                style={{ left: `${sliderPos}%` }}
                className="absolute top-0 bottom-0 w-2.5 bg-amber-400 -translate-x-1/2 rounded-full shadow-lg"
              />
            </div>

            <button
              type="button"
              onClick={handleTimingStop}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95"
            >
              STOP THE NEEDLE IN GREEN ZONE
            </button>
          </div>
        )}

        {/* 17. STOP THE TIMER */}
        {gameId === 'stop_the_timer' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Target: 5.000s</span>
              <div className="text-4xl font-black text-amber-400 font-mono tabular-nums mt-1">
                {(stopwatchMs / 1000).toFixed(3)}s
              </div>
            </div>

            <button
              type="button"
              onClick={handleStopwatchStop}
              disabled={!stopwatchRunning}
              className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-lg cursor-pointer active:scale-95"
            >
              STOP AT EXACTLY 5.000s!
            </button>
          </div>
        )}

        {/* 18. TARGET SHOOTING */}
        {gameId === 'target_shooting' && (
          <div className="space-y-6 text-center max-w-xs w-full">
            <div className="relative w-full h-28 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center">
              <div
                style={{ left: `${targetX}%` }}
                className="absolute -translate-x-1/2 text-4xl"
              >
                🎯
              </div>
            </div>

            <button
              type="button"
              onClick={handleFireDart}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95"
            >
              FIRE DART AT TARGET
            </button>
          </div>
        )}

        {/* 19. BALLOON POP */}
        {gameId === 'balloon_pop' && (
          <div className="w-full h-64 relative bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            {balloons.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handlePopBalloon(b.id)}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-14 rounded-full ${b.color} text-white font-bold flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-90 transition-transform`}
              >
                🎈
              </button>
            ))}
          </div>
        )}

        {/* 20. STACK THE BLOCKS */}
        {gameId === 'stack_the_blocks' && (
          <div className="space-y-5 text-center max-w-xs w-full">
            <div className="w-full h-44 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col-reverse items-center justify-start gap-1 overflow-hidden">
              {Array.from({ length: towerHeight }).map((_, i) => (
                <div
                  key={i}
                  className="w-32 h-6 rounded-md bg-gradient-to-r from-amber-500 to-emerald-400 border border-white/40 shadow-sm"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleStackBlock}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95"
            >
              DROP &amp; STACK NEXT LAYER
            </button>
          </div>
        )}
      </div>

      <div className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-b-2xl text-[11px] text-center text-slate-400 font-mono">
        Quick-play Mini Game · Complete to verify $2.00 Win or $1.00 Loss!
      </div>
    </div>
  );
};
