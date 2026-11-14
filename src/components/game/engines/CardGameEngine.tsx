import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../../../types';
import { Sparkles, Trophy, RotateCcw, CheckCircle2, Shield } from 'lucide-react';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, isWin: boolean, duration: number) => void;
  isPaused: boolean;
}

export const CardGameEngine: React.FC<GameEngineProps> = ({ game, onFinish, isPaused }) => {
  const gameId = game.id;
  const startTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(35);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState('Select your moves carefully');

  // --- 1. MEMORY CARDS STATE ---
  interface MemoryCard {
    id: number;
    symbol: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() => {
    const symbols = ['♠️', '♥️', '♦️', '♣️', '👑', '⭐'];
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({ id: idx, symbol, isFlipped: false, isMatched: false }));
    return deck;
  });
  const [flippedIds, setFlippedIds] = useState<number[]>([]);

  // --- 2. BLACKJACK STATE ---
  interface PlayingCard {
    suit: string;
    val: string;
    num: number;
  }
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [dealerHidden, setDealerHidden] = useState(true);

  // --- 3. UNO-STYLE COLOR STATE ---
  interface UnoCard {
    id: number;
    color: 'red' | 'blue' | 'green' | 'yellow';
    val: number | string;
  }
  const [topDiscard, setTopDiscard] = useState<UnoCard>({ id: 0, color: 'blue', val: 7 });
  const [playerUnoHand, setPlayerUnoHand] = useState<UnoCard[]>([]);
  const [botCardCount, setBotCardCount] = useState(4);

  // --- 4. POKER-STYLE 5-CARD DRAW STATE ---
  const [pokerHand, setPokerHand] = useState<{ id: number; card: string; held: boolean }[]>([]);
  const [drawsLeft, setDrawsLeft] = useState(1);

  // --- 5. SOLITAIRE / SPIDER COLUMNS ---
  const [tableau, setTableau] = useState<{ id: number; suit: string; val: number; red: boolean }[][]>([]);
  const [foundationCount, setFoundationCount] = useState(0);

  // Initialize specific game sub-systems
  useEffect(() => {
    if (gameId === 'blackjack') {
      const suits = ['♠', '♥', '♦', '♣'];
      const values = [
        { v: 'A', n: 11 },
        { v: 'K', n: 10 },
        { v: 'Q', n: 10 },
        { v: 'J', n: 10 },
        { v: '10', n: 10 },
        { v: '9', n: 9 },
        { v: '8', n: 8 },
        { v: '7', n: 7 },
      ];
      const p1 = { suit: suits[Math.floor(Math.random() * 4)], val: 'K', num: 10 };
      const p2 = { suit: suits[Math.floor(Math.random() * 4)], val: '9', num: 9 };
      const d1 = { suit: suits[Math.floor(Math.random() * 4)], val: '8', num: 8 };
      const d2 = { suit: suits[Math.floor(Math.random() * 4)], val: 'A', num: 11 };
      setPlayerHand([p1, p2]);
      setDealerHand([d1, d2]);
      setDealerHidden(true);
      setGameMessage('Dealer showing 8. Hit or Stand?');
    } else if (gameId === 'uno_color_matching') {
      const colors: Array<'red' | 'blue' | 'green' | 'yellow'> = ['red', 'blue', 'green', 'yellow'];
      const initialCards: UnoCard[] = [
        { id: 1, color: 'red', val: 5 },
        { id: 2, color: 'blue', val: 7 },
        { id: 3, color: 'green', val: 7 },
        { id: 4, color: 'yellow', val: '★' },
      ];
      setTopDiscard({ id: 99, color: 'blue', val: 3 });
      setPlayerUnoHand(initialCards);
      setBotCardCount(4);
      setGameMessage('Match top card by Color (Blue) or Number');
    } else if (gameId === 'poker_matching') {
      const cards = ['A♠', 'K♠', 'Q♠', 'J♠', '10♦'];
      setPokerHand(cards.map((c, idx) => ({ id: idx, card: c, held: idx < 4 })));
      setDrawsLeft(1);
      setGameMessage('Select cards to Hold, then tap Draw');
    } else if (gameId === 'solitaire' || gameId === 'spider_solitaire') {
      const cols = [
        [
          { id: 1, suit: '♠', val: 10, red: false },
          { id: 2, suit: '♥', val: 9, red: true },
          { id: 3, suit: '♣', val: 8, red: false },
        ],
        [
          { id: 4, suit: '♦', val: 7, red: true },
          { id: 5, suit: '♠', val: 6, red: false },
        ],
        [
          { id: 6, suit: '♥', val: 5, red: true },
          { id: 7, suit: '♠', val: 'A' as any, valNum: 1, red: false },
        ],
      ];
      setTableau(cols as any);
      setFoundationCount(1);
      setGameMessage('Tap Ace to transfer to Foundation!');
    }
  }, [gameId]);

  // Overall Countdown
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

  // --- MEMORY FLIP LOGIC ---
  const handleCardClick = (id: number) => {
    if (flippedIds.length >= 2 || gameOver) return;
    const card = memoryCards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const nextFlipped = [...flippedIds, id];
    setMemoryCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstId, secondId] = nextFlipped;
      const c1 = memoryCards.find((c) => c.id === firstId)!;
      const c2 = memoryCards.find((c) => c.id === secondId)!;

      if (c1.symbol === c2.symbol) {
        // Matched!
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIds([]);
          setScore((s) => {
            const nextScore = s + 5;
            // If all matched, win immediately
            const allMatched = memoryCards.filter((c) => c.isMatched).length + 2 >= memoryCards.length;
            if (allMatched) {
              finishRound(nextScore + 10, true);
            }
            return nextScore;
          });
        }, 500);
      } else {
        // Not matched
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
        }, 900);
      }
    }
  };

  // --- BLACKJACK LOGIC ---
  const calculateTotal = (hand: PlayingCard[]) => {
    return hand.reduce((sum, c) => sum + c.num, 0);
  };

  const handleHit = () => {
    if (gameOver) return;
    const suits = ['♠', '♥', '♦', '♣'];
    const cards = [
      { v: '2', n: 2 },
      { v: '3', n: 3 },
      { v: '4', n: 4 },
      { v: '5', n: 5 },
      { v: '6', n: 6 },
      { v: 'A', n: 1 },
    ];
    const pick = cards[Math.floor(Math.random() * cards.length)];
    const newCard: PlayingCard = { suit: suits[Math.floor(Math.random() * 4)], val: pick.v, num: pick.n };
    const nextHand = [...playerHand, newCard];
    setPlayerHand(nextHand);

    const total = calculateTotal(nextHand);
    if (total > 21) {
      setGameMessage('Bust! Hand over 21.');
      finishRound(15, false);
    } else if (total === 21) {
      setGameMessage('Blackjack 21!');
      finishRound(25, true);
    }
  };

  const handleStand = () => {
    setDealerHidden(false);
    const pTotal = calculateTotal(playerHand);
    const dTotal = calculateTotal(dealerHand);

    if (pTotal > dTotal || dTotal > 21) {
      setGameMessage(`Player (${pTotal}) beats Dealer (${dTotal})!`);
      finishRound(20, true);
    } else {
      setGameMessage(`Dealer wins (${dTotal} vs ${pTotal}).`);
      finishRound(10, false);
    }
  };

  // --- UNO LOGIC ---
  const handlePlayUno = (card: UnoCard) => {
    if (gameOver) return;
    if (card.color === topDiscard.color || card.val === topDiscard.val || card.val === '★') {
      setTopDiscard(card);
      const nextHand = playerUnoHand.filter((c) => c.id !== card.id);
      setPlayerUnoHand(nextHand);
      setScore((s) => s + 5);

      if (nextHand.length === 0) {
        setGameMessage('UNO Victory! Hand cleared.');
        finishRound(25, true);
      } else {
        setGameMessage(`Played ${card.color.toUpperCase()} ${card.val}! Bot drawing card...`);
        setTimeout(() => {
          setBotCardCount((b) => Math.max(0, b - 1));
          setGameMessage('Your turn: match color or value.');
        }, 1000);
      }
    } else {
      setGameMessage(`Invalid! Must match ${topDiscard.color.toUpperCase()} or ${topDiscard.val}.`);
    }
  };

  // --- POKER LOGIC ---
  const toggleHold = (id: number) => {
    setPokerHand((prev) => prev.map((c) => (c.id === id ? { ...c, held: !c.held } : c)));
  };

  const handleDrawPoker = () => {
    const replacements = ['10♠', 'J♥', 'Q♦', 'K♣', 'A♥'];
    setPokerHand((prev) =>
      prev.map((c, i) =>
        c.held ? c : { ...c, card: replacements[i] || '9♠', held: true }
      )
    );
    setDrawsLeft(0);
    setScore(25);
    setGameMessage('ROYAL STRAIGHT! High Hand Score!');
    finishRound(25, true);
  };

  // --- SOLITAIRE TRANSFER ---
  const handleTransferSolitaire = () => {
    setFoundationCount((c) => c + 1);
    setScore((s) => s + 10);
    setGameMessage('Card transferred to Foundation! (+10 pts)');
    if (foundationCount >= 2) {
      finishRound(30, true);
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
          {gameMessage}
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Interactive Arena */}
      <div className="w-full min-h-[340px] bg-slate-950 p-4 border-x border-slate-800 flex flex-col items-center justify-center">
        {/* GAME: MEMORY CARDS */}
        {gameId === 'classic_memory_cards' && (
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
            {memoryCards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCardClick(c.id)}
                disabled={c.isFlipped || c.isMatched || gameOver}
                className={`aspect-[3/4] rounded-xl border flex items-center justify-center text-2xl transition-all cursor-pointer font-bold shadow-md ${
                  c.isMatched
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : c.isFlipped
                    ? 'bg-amber-500/20 border-amber-400 text-white scale-102'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-600'
                }`}
              >
                {c.isFlipped || c.isMatched ? c.symbol : '❓'}
              </button>
            ))}
          </div>
        )}

        {/* GAME: BLACKJACK */}
        {gameId === 'blackjack' && (
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Dealer Hand */}
            <div>
              <span className="text-xs text-slate-400 font-mono block mb-1.5">
                Dealer Hand {dealerHidden ? '(1 Card Hidden)' : `Total: ${calculateTotal(dealerHand)}`}
              </span>
              <div className="flex justify-center gap-2">
                {dealerHand.map((c, i) => (
                  <div
                    key={i}
                    className="w-16 h-22 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-bold text-lg text-white shadow"
                  >
                    {i === 1 && dealerHidden ? (
                      <span className="text-slate-500">🂠</span>
                    ) : (
                      <>
                        <span className="text-xs">{c.suit}</span>
                        <span>{c.val}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div>
              <span className="text-xs text-emerald-400 font-mono block mb-1.5">
                Your Hand · Total: <strong>{calculateTotal(playerHand)}</strong>
              </span>
              <div className="flex justify-center gap-2">
                {playerHand.map((c, i) => (
                  <div
                    key={i}
                    className="w-16 h-22 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 flex flex-col items-center justify-center font-bold text-lg text-amber-300 shadow-md"
                  >
                    <span className="text-xs">{c.suit}</span>
                    <span>{c.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleHit}
                disabled={gameOver}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
              >
                Hit (Draw Card)
              </button>
              <button
                type="button"
                onClick={handleStand}
                disabled={gameOver}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
              >
                Stand (Show Hand)
              </button>
            </div>
          </div>
        )}

        {/* GAME: UNO-STYLE */}
        {gameId === 'uno_color_matching' && (
          <div className="w-full max-w-md space-y-5 text-center">
            {/* Top Discard */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 font-mono mb-1">Center Discard Pile</span>
              <div
                className={`w-20 h-28 rounded-2xl flex flex-col items-center justify-center text-2xl font-black text-white shadow-xl border-2 border-white/40 ${
                  topDiscard.color === 'red'
                    ? 'bg-rose-600'
                    : topDiscard.color === 'blue'
                    ? 'bg-sky-600'
                    : topDiscard.color === 'green'
                    ? 'bg-emerald-600'
                    : 'bg-amber-500'
                }`}
              >
                <span>{topDiscard.val}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider">{topDiscard.color}</span>
              </div>
            </div>

            {/* Player Hand */}
            <div>
              <span className="text-xs text-slate-400 font-mono mb-2 block">Your Cards:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {playerUnoHand.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handlePlayUno(c)}
                    className={`w-14 h-20 rounded-xl flex flex-col items-center justify-center font-bold text-base text-white shadow hover:scale-105 active:scale-95 transition-all cursor-pointer border ${
                      c.color === 'red'
                        ? 'bg-rose-600 border-rose-400'
                        : c.color === 'blue'
                        ? 'bg-sky-600 border-sky-400'
                        : c.color === 'green'
                        ? 'bg-emerald-600 border-emerald-400'
                        : 'bg-amber-500 border-amber-300'
                    }`}
                  >
                    <span>{c.val}</span>
                    <span className="text-[8px] uppercase">{c.color}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GAME: POKER 5-CARD DRAW */}
        {gameId === 'poker_matching' && (
          <div className="w-full max-w-md space-y-5 text-center">
            <span className="text-xs text-slate-400 font-mono">Tap cards to toggle HOLD, then tap Draw:</span>
            <div className="flex justify-center gap-2">
              {pokerHand.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleHold(c.id)}
                  className={`w-16 h-24 rounded-xl border flex flex-col items-center justify-between p-2 font-bold cursor-pointer transition-all ${
                    c.held
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-102 shadow-md'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-xs">{c.held ? 'HELD' : 'DISCARD'}</span>
                  <span className="text-xl">{c.card}</span>
                  <span className="text-[10px] font-mono">Card #{c.id + 1}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDrawPoker}
              disabled={drawsLeft === 0 || gameOver}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Draw New Cards
            </button>
          </div>
        )}

        {/* GAME: SOLITAIRE & SPIDER */}
        {(gameId === 'solitaire' || gameId === 'spider_solitaire') && (
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Foundations:</span>
              <div className="flex gap-2">
                <div className="w-12 h-16 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {foundationCount > 0 ? '♠ A' : 'Empty'}
                </div>
                <div className="w-12 h-16 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {foundationCount > 1 ? '♥ A' : 'Empty'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {tableau.map((col, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">Col {idx + 1}</span>
                  {col.map((c) => (
                    <div
                      key={c.id}
                      onClick={handleTransferSolitaire}
                      className={`p-2 rounded-lg border text-center font-bold text-xs cursor-pointer shadow transition-all hover:scale-102 ${
                        c.red ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      {c.suit} {c.val}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleTransferSolitaire}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
            >
              Auto-Transfer Ace to Foundation (+10 pts)
            </button>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-b-2xl text-[11px] text-center text-slate-400 font-mono">
        Play through cards before time expires to claim your reward!
      </div>
    </div>
  );
};
