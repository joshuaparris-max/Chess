'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';
import { tryPuzzleMove } from '@/lib/puzzles/attempt';
import type { AdultPuzzle, PuzzleDifficulty } from '@/lib/puzzles/types';
import { recordPuzzleSolved } from '@/lib/progression/xp';

const BEST_KEY = 'puzzleStreakBest';
const DIFF_ORDER: PuzzleDifficulty[] = ['intro', 'beginner', 'intermediate', 'advanced', 'expert'];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function byBand(): Record<PuzzleDifficulty, AdultPuzzle[]> {
  const map = {} as Record<PuzzleDifficulty, AdultPuzzle[]>;
  DIFF_ORDER.forEach((d) => {
    map[d] = shuffle(adultPuzzles.filter((p) => p.difficulty === d));
  });
  return map;
}

type Phase = 'ready' | 'playing' | 'over';

export default function PuzzleStreakPage() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [bands, setBands] = useState(() => byBand());
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [current, setCurrent] = useState<AdultPuzzle | null>(null);
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const loadBest = () => {
    try {
      return Number(window.localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  };

  // Difficulty band rises every 5 correct answers.
  const pickPuzzle = useCallback((nextStreak: number, source: Record<PuzzleDifficulty, AdultPuzzle[]>) => {
    const bandIndex = Math.min(DIFF_ORDER.length - 1, Math.floor(nextStreak / 5));
    for (let i = bandIndex; i < DIFF_ORDER.length; i += 1) {
      const list = source[DIFF_ORDER[i]];
      if (list && list.length > 0) return list[(nextStreak + i) % list.length];
    }
    // fall back to any
    const all = DIFF_ORDER.flatMap((d) => source[d]);
    return all[nextStreak % all.length];
  }, []);

  const start = () => {
    const fresh = byBand();
    setBands(fresh);
    setStreak(0);
    setBest(loadBest());
    const first = pickPuzzle(0, fresh);
    setCurrent(first);
    setGame(new Chess(first.fen));
    setSelected(null);
    setLastMove(null);
    setLocked(false);
    setPhase('playing');
  };

  const endStreak = (finalStreak: number) => {
    try {
      const prev = loadBest();
      if (finalStreak > prev) {
        window.localStorage.setItem(BEST_KEY, String(finalStreak));
        setBest(finalStreak);
      }
    } catch {
      // ignore
    }
    setPhase('over');
  };

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const onSquareClick = (square: Square) => {
    if (phase !== 'playing' || !current || locked) return;
    const piece = game.get(square);
    const turn = game.turn();
    if (!selected) {
      if (piece?.color === turn) setSelected(square);
      return;
    }
    if (selected === square) {
      setSelected(null);
      return;
    }
    if (piece?.color === turn) {
      setSelected(square);
      return;
    }

    const expected = current.solution[0];
    const result = tryPuzzleMove(current.fen, expected, selected, square);
    if (result.status === 'correct') {
      setLocked(true);
      const nextStreak = streak + 1;
      setGame(new Chess(result.fen));
      setLastMove({ from: selected, to: square });
      setSelected(null);
      setStreak(nextStreak);
      recordPuzzleSolved(false);
      if (nextStreak === 5 || nextStreak === 10 || nextStreak === 20 || nextStreak === 50) {
        setBurst('🔥🔥🔥');
        window.setTimeout(() => setBurst(null), 1200);
      }
      window.setTimeout(() => {
        const next = pickPuzzle(nextStreak, bands);
        setCurrent(next);
        setGame(new Chess(next.fen));
        setLocked(false);
      }, 450);
    } else if (result.status === 'incorrect') {
      setLocked(true);
      const from = expected.slice(0, 2);
      const to = expected.slice(2, 4);
      setLastMove({ from, to });
      setSelected(null);
      window.setTimeout(() => endStreak(streak), 900);
    } else {
      setSelected(null);
    }
  };

  const isNewBest = phase === 'over' && streak > 0 && streak >= best;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/puzzles" className="text-sm font-semibold text-orange-300 hover:underline">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-black">🔥 Puzzle Streak</h1>
        <span className="text-sm text-slate-400">Best: {best}</span>
      </div>

      {phase === 'ready' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="text-6xl">🔥</div>
          <h2 className="mt-3 text-2xl font-black">How long is your streak?</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-300">
            Solve puzzles in a row. One wrong move ends the run. Puzzles get harder every 5 solved.
          </p>
          <button
            onClick={start}
            className="mt-6 rounded-full bg-orange-500 px-10 py-3 text-lg font-black text-slate-950 hover:bg-orange-400"
          >
            Start
          </button>
        </div>
      )}

      {phase === 'playing' && current && (
        <div className="mt-4">
          <div className="relative flex items-center justify-center">
            <span className="text-5xl font-black text-orange-400">{streak} 🔥</span>
            {burst && (
              <span className="absolute -top-2 animate-bounce text-3xl">{burst}</span>
            )}
          </div>
          <div className="mt-3">
            <ChessBoard
              game={game}
              selectedSquare={selected}
              legalTargets={legalTargets}
              lastMove={lastMove}
              disabled={locked}
              flipped={current.sideToMove === 'b'}
              onSquareClick={onSquareClick}
            />
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-300">
            {current.sideToMove === 'w' ? 'White' : 'Black'} to move — find the best move!
          </p>
        </div>
      )}

      {phase === 'over' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          {isNewBest && <div className="text-2xl font-black text-yellow-300">New Best Streak! 🎉</div>}
          <div className="mt-2 text-6xl font-black text-orange-400">{streak}</div>
          <p className="text-slate-300">puzzles in a row</p>
          <div className="mt-3 text-sm text-slate-400">All-time best: {best}</div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={start}
              className="rounded-full bg-orange-500 px-8 py-3 font-black text-slate-950 hover:bg-orange-400"
            >
              Try Again
            </button>
            <Link
              href="/puzzles"
              className="rounded-full border border-slate-600 px-8 py-3 font-bold text-slate-100 hover:bg-slate-800"
            >
              Back to Puzzles
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
