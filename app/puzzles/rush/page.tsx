'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import PuzzleRushHUD from '@/components/puzzles/PuzzleRushHUD';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';
import { tryPuzzleMove } from '@/lib/puzzles/attempt';
import type { AdultPuzzle, PuzzleDifficulty } from '@/lib/puzzles/types';

const TOTAL_SECONDS = 180;
const PENALTY_SECONDS = 10;
const BEST_KEY = 'puzzleRushBest';
const DIFF_ORDER: PuzzleDifficulty[] = ['intro', 'beginner', 'intermediate', 'advanced', 'expert'];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQueue(): AdultPuzzle[] {
  // Easy → hard, shuffled within each difficulty band.
  return DIFF_ORDER.flatMap((diff) => shuffle(adultPuzzles.filter((p) => p.difficulty === diff)));
}

type Phase = 'ready' | 'playing' | 'over';

export default function PuzzleRushPage() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [queue, setQueue] = useState<AdultPuzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [timeLost, setTimeLost] = useState(0);
  const [best, setBest] = useState(0);
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const endAtRef = useRef<number>(0);
  const lockRef = useRef(false);

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem(BEST_KEY)) || 0);
    } catch {
      setBest(0);
    }
  }, []);

  const current = queue[index];

  const loadPuzzle = useCallback((puzzle: AdultPuzzle | undefined) => {
    if (!puzzle) return;
    setGame(new Chess(puzzle.fen));
    setSelected(null);
    setLastMove(null);
    lockRef.current = false;
  }, []);

  const start = () => {
    const q = buildQueue();
    setQueue(q);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLost(0);
    setSecondsLeft(TOTAL_SECONDS);
    endAtRef.current = Date.now() + TOTAL_SECONDS * 1000;
    loadPuzzle(q[0]);
    setPhase('playing');
  };

  const finish = useCallback(() => {
    setPhase('over');
    setScore((finalScore) => {
      try {
        const prevBest = Number(window.localStorage.getItem(BEST_KEY)) || 0;
        if (finalScore > prevBest) {
          window.localStorage.setItem(BEST_KEY, String(finalScore));
          setBest(finalScore);
        }
      } catch {
        // ignore
      }
      return finalScore;
    });
  }, []);

  // Accurate timer driven by Date.now(), not render counting.
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = () => {
      const remaining = Math.ceil((endAtRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        finish();
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, finish]);

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) {
        finish();
        return i;
      }
      loadPuzzle(queue[next]);
      return next;
    });
  }, [queue, finish, loadPuzzle]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const onSquareClick = (square: Square) => {
    if (phase !== 'playing' || !current || lockRef.current) return;
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
      lockRef.current = true;
      setGame(new Chess(result.fen));
      setLastMove({ from: selected, to: square });
      setSelected(null);
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setFlash('correct');
      window.setTimeout(() => {
        setFlash(null);
        advance();
      }, 350);
    } else if (result.status === 'incorrect') {
      lockRef.current = true;
      setStreak(0);
      setSelected(null);
      setFlash('wrong');
      endAtRef.current -= PENALTY_SECONDS * 1000;
      setTimeLost((t) => t + PENALTY_SECONDS);
      // Show the correct move briefly.
      const from = expected.slice(0, 2);
      const to = expected.slice(2, 4);
      setLastMove({ from, to });
      window.setTimeout(() => {
        setFlash(null);
        advance();
      }, 1500);
    } else {
      // illegal — just deselect, no penalty
      setSelected(null);
    }
  };

  const isNewBest = phase === 'over' && score > 0 && score >= best;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/puzzles" className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-black">⚡ Puzzle Rush</h1>
        <span className="text-sm text-slate-400">Best: {best}</span>
      </div>

      {phase === 'ready' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="text-6xl">⚡</div>
          <h2 className="mt-3 text-2xl font-black">3-Minute Puzzle Rush</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-300">
            Solve as many puzzles as you can in 3:00. Each correct first move scores a point.
            A wrong move costs {PENALTY_SECONDS} seconds and shows you the answer.
          </p>
          <button
            onClick={start}
            className="mt-6 rounded-full bg-emerald-500 px-10 py-3 text-lg font-black text-slate-950 hover:bg-emerald-400"
          >
            Start
          </button>
        </div>
      )}

      {phase === 'playing' && current && (
        <div className="mt-4">
          <PuzzleRushHUD secondsLeft={secondsLeft} score={score} streak={streak} totalSeconds={TOTAL_SECONDS} />
          <div
            className={`mt-3 rounded-2xl transition ${flash === 'correct' ? 'ring-4 ring-emerald-400' : ''} ${flash === 'wrong' ? 'ring-4 ring-red-500' : ''}`}
          >
            <ChessBoard
              game={game}
              selectedSquare={selected}
              legalTargets={legalTargets}
              lastMove={lastMove}
              disabled={lockRef.current}
              flipped={current.sideToMove === 'b'}
              onSquareClick={onSquareClick}
            />
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-300">
            {current.sideToMove === 'w' ? 'White' : 'Black'} to move — find the best move!
            {flash === 'wrong' && <span className="ml-2 text-red-400">−{PENALTY_SECONDS}s · correct move shown</span>}
          </p>
        </div>
      )}

      {phase === 'over' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          {isNewBest && <div className="text-2xl font-black text-yellow-300">New Personal Best! 🎉</div>}
          <div className="mt-2 text-6xl font-black text-emerald-300">{score}</div>
          <p className="text-slate-300">puzzles solved</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-800/70 p-3">
              <div className="text-lg font-black">{best}</div>
              <div className="text-slate-400">personal best</div>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-3">
              <div className="text-lg font-black">{timeLost}s</div>
              <div className="text-slate-400">lost to mistakes</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={start}
              className="rounded-full bg-emerald-500 px-8 py-3 font-black text-slate-950 hover:bg-emerald-400"
            >
              Play Again
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
