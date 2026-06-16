'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';
import { tryPuzzleMove } from '@/lib/puzzles/attempt';
import type { AdultPuzzle } from '@/lib/puzzles/types';

type Phase = 'setup' | 'handoff' | 'attempt' | 'roundResult' | 'final';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function PuzzleDuelPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [p1, setP1] = useState('Player 1');
  const [p2, setP2] = useState('Player 2');
  const [rounds, setRounds] = useState(3);
  const [queue, setQueue] = useState<AdultPuzzle[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [current, setCurrent] = useState<AdultPuzzle | null>(null);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [p1Solved, setP1Solved] = useState<boolean | null>(null);
  const [p2Solved, setP2Solved] = useState<boolean | null>(null);
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const start = () => {
    const q = shuffle(adultPuzzles.filter((p) => ['intro', 'beginner', 'intermediate'].includes(p.difficulty))).slice(0, rounds);
    setQueue(q);
    setRound(0);
    setScore({ p1: 0, p2: 0 });
    beginRound(q, 0);
  };

  const beginRound = (q: AdultPuzzle[], r: number) => {
    const puzzle = q[r];
    setCurrent(puzzle);
    setGame(new Chess(puzzle.fen));
    setSelected(null);
    setLastMove(null);
    setActivePlayer(1);
    setP1Solved(null);
    setP2Solved(null);
    setPhase('handoff');
  };

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const recordAttempt = (solved: boolean) => {
    if (activePlayer === 1) {
      setP1Solved(solved);
      // reset board for player 2
      if (current) setGame(new Chess(current.fen));
      setSelected(null);
      setLastMove(null);
      setActivePlayer(2);
      setPhase('handoff');
    } else {
      setP2Solved(solved);
      finishRound(p1Solved ?? false, solved);
    }
  };

  const finishRound = (s1: boolean, s2: boolean) => {
    setScore((prev) => ({
      p1: prev.p1 + (s1 && !s2 ? 1 : 0),
      p2: prev.p2 + (s2 && !s1 ? 1 : 0),
    }));
    setPhase('roundResult');
  };

  const nextRound = () => {
    const next = round + 1;
    if (next >= queue.length) {
      setPhase('final');
      return;
    }
    setRound(next);
    beginRound(queue, next);
  };

  const onSquareClick = (square: Square) => {
    if (phase !== 'attempt' || !current) return;
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
    const result = tryPuzzleMove(current.fen, current.solution[0], selected, square);
    if (result.status === 'correct') {
      setLastMove({ from: selected, to: square });
      setSelected(null);
      window.setTimeout(() => recordAttempt(true), 350);
    } else if (result.status === 'incorrect') {
      setSelected(null);
      window.setTimeout(() => recordAttempt(false), 250);
    } else {
      setSelected(null);
    }
  };

  const activeName = activePlayer === 1 ? p1 : p2;
  const winner =
    score.p1 > score.p2 ? p1 : score.p2 > score.p1 ? p2 : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/puzzles" className="text-sm font-semibold text-indigo-300 hover:underline">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-black">👥 Puzzle Duel</h1>
        <span className="text-sm text-slate-400">
          {p1} {score.p1} — {score.p2} {p2}
        </span>
      </div>

      {phase === 'setup' && (
        <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="text-center text-2xl font-black">Set up the duel</h2>
          <div className="mt-4 space-y-3">
            <input value={p1} onChange={(e) => setP1(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Player 1" />
            <input value={p2} onChange={(e) => setP2(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Player 2" />
            <div className="flex items-center justify-center gap-2">
              {[3, 5, 7].map((n) => (
                <button key={n} onClick={() => setRounds(n)} className={`rounded-xl px-4 py-2 font-bold ${rounds === n ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`}>
                  {n} rounds
                </button>
              ))}
            </div>
          </div>
          <button onClick={start} className="mt-5 w-full rounded-full bg-indigo-500 py-3 font-black text-white hover:bg-indigo-400">
            Start Duel
          </button>
        </div>
      )}

      {phase === 'handoff' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Round {round + 1} of {queue.length}</p>
          <h2 className="mt-3 text-3xl font-black">{activeName}&apos;s turn</h2>
          <p className="mt-2 text-slate-300">Other player, look away! 🙈</p>
          <button onClick={() => setPhase('attempt')} className="mt-6 rounded-full bg-indigo-500 px-10 py-3 font-black text-white hover:bg-indigo-400">
            I&apos;m ready
          </button>
        </div>
      )}

      {phase === 'attempt' && current && (
        <div className="mt-4">
          <p className="text-center text-lg font-black text-indigo-300">{activeName}, find the best move!</p>
          <div className="mt-3">
            <ChessBoard
              game={game}
              selectedSquare={selected}
              legalTargets={legalTargets}
              lastMove={lastMove}
              flipped={current.sideToMove === 'b'}
              onSquareClick={onSquareClick}
            />
          </div>
          <p className="mt-2 text-center text-sm text-slate-400">
            {current.sideToMove === 'w' ? 'White' : 'Black'} to move · one attempt
          </p>
        </div>
      )}

      {phase === 'roundResult' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <h2 className="text-2xl font-black">Round {round + 1} result</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-800/70 p-4">
              <div className="font-bold">{p1}</div>
              <div className="text-3xl">{p1Solved ? '✅' : '❌'}</div>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-4">
              <div className="font-bold">{p2}</div>
              <div className="text-3xl">{p2Solved ? '✅' : '❌'}</div>
            </div>
          </div>
          <p className="mt-4 text-lg font-bold text-indigo-300">
            {p1} {score.p1} — {score.p2} {p2}
          </p>
          <button onClick={nextRound} className="mt-5 rounded-full bg-indigo-500 px-10 py-3 font-black text-white hover:bg-indigo-400">
            {round + 1 >= queue.length ? 'See winner' : 'Next round'}
          </button>
        </div>
      )}

      {phase === 'final' && (
        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="text-6xl">🏆</div>
          <h2 className="mt-3 text-3xl font-black">
            {winner ? `${winner} wins!` : "It's a draw!"}
          </h2>
          <p className="mt-2 text-lg font-bold text-indigo-300">
            {p1} {score.p1} — {score.p2} {p2}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={start} className="rounded-full bg-indigo-500 px-8 py-3 font-black text-white">
              Play Again
            </button>
            <Link href="/puzzles" className="rounded-full border border-slate-600 px-8 py-3 font-bold">
              Back to Puzzles
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
