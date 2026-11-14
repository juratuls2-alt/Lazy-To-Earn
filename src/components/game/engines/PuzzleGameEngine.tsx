import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { Sparkles, Check, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const PuzzleGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const gameId = game.id;
  const startTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(35);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hint, setHint] = useState('');

  // --- 19. SUDOKU STATE ---
  interface SudokuCell {
    row: number;
    col: number;
    val: number | null;
    isFixed: boolean;
  }
  const [sudokuGrid, setSudokuGrid] = useState<SudokuCell[]>(() => {
    const initial: SudokuCell[] = [];
    const seed = [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9],
    ];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        initial.push({
          row: r,
          col: c,
          val: seed[r][c],
          isFixed: seed[r][c] !== null,
        });
      }
    }
    return initial;
  });
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // --- 20. 2048 STATE ---
  const [grid2048, setGrid2048] = useState<number[][]>([
    [2, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 4, 0],
    [0, 0, 0, 0],
  ]);

  // --- 21. NUMBER GUESSING STATE ---
  const [targetNumber] = useState<number>(() => Math.floor(Math.random() * 90) + 10);
  const [guessInput, setGuessInput] = useState<string>('');
  const [attemptsLeft, setAttemptsLeft] = useState<number>(6);
  const [guessFeedback, setGuessFeedback] = useState<string>('Pick a number between 1 and 100');

  // --- 22. WORD SEARCH STATE ---
  const wordsToFind = ['LAZY', 'EARN', 'COIN', 'GAME'];
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const letterGrid = [
    ['L', 'A', 'Z', 'Y', 'X', 'B'],
    ['E', 'A', 'R', 'N', 'P', 'K'],
    ['C', 'O', 'I', 'N', 'M', 'Q'],
    ['G', 'A', 'M', 'E', 'S', 'T'],
    ['W', 'I', 'N', 'C', 'A', 'S'],
    ['R', 'E', 'W', 'A', 'R', 'D'],
  ];

  // --- 23. JIGSAW / SLIDING PUZZLE STATE ---
  const [puzzleTiles, setPuzzleTiles] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 0, 8]); // 0 is empty

  // --- 24. MATH CHALLENGE STATE ---
  const [mathQuestion, setMathQuestion] = useState<{ q: string; ans: number; options: number[] }>({
    q: '14 + 18 = ?',
    ans: 32,
    options: [28, 32, 36, 42],
  });
  const [mathStreak, setMathStreak] = useState(0);

  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * 12) + 3;
    const isMult = Math.random() > 0.5;
    const ans = isMult ? a * b : a + b;
    const q = isMult ? `${a} × ${b} = ?` : `${a} + ${b} = ?`;
    const opts = [ans, ans + 4, ans - 3, ans + 7].sort(() => Math.random() - 0.5);
    setMathQuestion({ q, ans, options: opts });
  };

  // Timer Countdown
  useEffect(() => {
    if (gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishRound(score, score >= 10);
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

  // --- SUDOKU ACTIONS ---
  const fillNumber = (num: number) => {
    if (!selectedCell || gameOver) return;
    setSudokuGrid((prev) =>
      prev.map((c) =>
        c.row === selectedCell.row && c.col === selectedCell.col ? { ...c, val: num } : c
      )
    );
    setScore((s) => s + 5);
    setHint(`Placed ${num}! (+5 pts)`);
    if (score >= 15) {
      finishRound(score + 10, true);
    }
  };

  // --- 2048 SLIDE ACTIONS ---
  const slide2048 = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    // Simple state merge demonstration
    setGrid2048((prev) => {
      const copy = prev.map((row) => [...row]);
      // Spawn or double
      copy[1][1] = Math.min(256, (copy[1][1] || 2) * 2);
      return copy;
    });
    setScore((s) => {
      const next = s + 8;
      if (next >= 24) finishRound(next, true);
      return next;
    });
  };

  // --- NUMBER GUESS ACTION ---
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver) return;
    const num = parseInt(guessInput.trim(), 10);
    if (isNaN(num)) return;

    if (num === targetNumber) {
      setGuessFeedback(`🎯 EXACT MATCH! Secret was ${targetNumber}!`);
      setScore(30);
      finishRound(30, true);
    } else {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      if (num < targetNumber) {
        setGuessFeedback(`Too Low! Try Higher ⬆️ (${remaining} attempts left)`);
      } else {
        setGuessFeedback(`Too High! Try Lower ⬇️ (${remaining} attempts left)`);
      }
      setScore((s) => s + 3);

      if (remaining <= 0) {
        setGuessFeedback(`Out of tries! Secret was ${targetNumber}.`);
        finishRound(15, false);
      }
    }
    setGuessInput('');
  };

  // --- WORD SEARCH ACTION ---
  const clickWord = (word: string) => {
    if (foundWords.includes(word) || gameOver) return;
    const nextFound = [...foundWords, word];
    setFoundWords(nextFound);
    setScore((s) => s + 8);
    setHint(`Found "${word}"! (+8 pts)`);

    if (nextFound.length >= 3) {
      finishRound(nextFound.length * 8 + 10, true);
    }
  };

  // --- JIGSAW SLIDE ACTION ---
  const slideTile = (index: number) => {
    if (gameOver) return;
    const emptyIndex = puzzleTiles.indexOf(0);
    // Check adjacency
    const isAdjacent =
      Math.abs(Math.floor(index / 3) - Math.floor(emptyIndex / 3)) +
        Math.abs((index % 3) - (emptyIndex % 3)) === 1;

    if (isAdjacent) {
      const next = [...puzzleTiles];
      next[emptyIndex] = next[index];
      next[index] = 0;
      setPuzzleTiles(next);
      setScore((s) => s + 5);

      if (score >= 15) {
        finishRound(score + 10, true);
      }
    }
  };

  // --- MATH ANSWER ACTION ---
  const handleMathAnswer = (choice: number) => {
    if (gameOver) return;
    if (choice === mathQuestion.ans) {
      const nextStreak = mathStreak + 1;
      setMathStreak(nextStreak);
      setScore((s) => s + 6);
      setHint(`Correct! Streak: ${nextStreak} 🔥`);

      if (nextStreak >= 4) {
        finishRound(30, true);
      } else {
        generateMathQuestion();
      }
    } else {
      setHint(`Incorrect! Correct was ${mathQuestion.ans}.`);
      generateMathQuestion();
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
          {hint || 'Solve puzzle to unlock reward!'}
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Arena */}
      <div className="w-full min-h-[340px] bg-slate-950 p-4 border-x border-slate-800 flex flex-col items-center justify-center">
        {/* GAME: SUDOKU */}
        {gameId === 'sudoku' && (
          <div className="w-full max-w-xs space-y-4 text-center">
            <div className="grid grid-cols-9 gap-0.5 bg-slate-800 p-1 rounded-xl">
              {sudokuGrid.map((c, i) => {
                const isSelected = selectedCell?.row === c.row && selectedCell?.col === c.col;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !c.isFixed && setSelectedCell({ row: c.row, col: c.col })}
                    className={`aspect-square flex items-center justify-center text-xs font-bold transition-colors ${
                      c.isFixed
                        ? 'bg-slate-900 text-slate-300'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : c.val
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-slate-950 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {c.val || ''}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => fillNumber(num)}
                  className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs cursor-pointer"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME: 2048 */}
        {gameId === 'game_2048' && (
          <div className="w-full max-w-xs space-y-4 text-center">
            <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              {grid2048.flat().map((val, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex items-center justify-center font-black text-base shadow-sm transition-all ${
                    val === 0
                      ? 'bg-slate-950 text-transparent'
                      : val === 2
                      ? 'bg-slate-800 text-white'
                      : val === 4
                      ? 'bg-amber-900/60 text-amber-300'
                      : val === 8
                      ? 'bg-amber-600 text-white'
                      : val === 16
                      ? 'bg-orange-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {val > 0 ? val : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => slide2048('left')}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ← Left
              </button>
              <button
                type="button"
                onClick={() => slide2048('up')}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ↑ Up
              </button>
              <button
                type="button"
                onClick={() => slide2048('down')}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ↓ Down
              </button>
              <button
                type="button"
                onClick={() => slide2048('right')}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                → Right
              </button>
            </div>
          </div>
        )}

        {/* GAME: NUMBER GUESSING */}
        {gameId === 'number_guessing' && (
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-sm font-bold text-white">{guessFeedback}</p>
              <span className="text-xs text-amber-400 font-mono mt-1 block">
                Attempts Remaining: {attemptsLeft}
              </span>
            </div>

            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="1 - 100"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-sm focus:border-amber-400 outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
              >
                Guess
              </button>
            </form>
          </div>
        )}

        {/* GAME: WORD SEARCH */}
        {gameId === 'word_search' && (
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="grid grid-cols-6 gap-1 bg-slate-900 p-2 rounded-xl border border-slate-800 font-mono font-bold text-sm text-slate-300">
              {letterGrid.flat().map((l, i) => (
                <div key={i} className="aspect-square flex items-center justify-center bg-slate-950 rounded">
                  {l}
                </div>
              ))}
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono block mb-2">Click target words when spotted:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {wordsToFind.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => clickWord(w)}
                    disabled={foundWords.includes(w)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      foundWords.includes(w)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 line-through'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GAME: JIGSAW SLIDING PUZZLE */}
        {gameId === 'jigsaw_puzzle' && (
          <div className="w-full max-w-xs space-y-4 text-center">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-slate-800">
              {puzzleTiles.map((tile, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => slideTile(idx)}
                  className={`aspect-square rounded-xl font-black text-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    tile === 0
                      ? 'bg-slate-950 border border-dashed border-slate-800 text-transparent'
                      : 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 hover:scale-102'
                  }`}
                >
                  {tile !== 0 && tile}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-mono">Click tiles adjacent to empty slot to slide</p>
          </div>
        )}

        {/* GAME: MATH CHALLENGE */}
        {gameId === 'math_challenge' && (
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
              <span className="text-xs text-amber-400 uppercase font-mono tracking-wider">Speed Arithmetic</span>
              <h3 className="text-3xl font-black text-white mt-2 font-mono">{mathQuestion.q}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mathQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMathAnswer(opt)}
                  className="py-3.5 rounded-2xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-white font-black text-lg font-mono transition-all cursor-pointer shadow active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-b-2xl text-[11px] text-center text-slate-400 font-mono">
        Solve puzzle challenges to qualify for $2.00 Win or $1.00 Loss reward!
      </div>
    </div>
  );
};
