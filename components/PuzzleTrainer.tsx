'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';
import type { AdultPuzzle, PuzzleDifficulty } from '@/lib/puzzles/types';

// ── Progress ──────────────────────────────────────────────────────────────────

const PROGRESS_KEY = 'gm-adult-puzzle-progress-v1';

type PuzzleRecord = { attempts: number; solved: number };
type PuzzleProgress = Record<string, PuzzleRecord>;

function loadProgress(): PuzzleProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw) as PuzzleProgress;
  } catch {}
  return {};
}

function saveProgress(p: PuzzleProgress) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<PuzzleDifficulty, string> = {
  intro: 'Intro',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const DIFFICULTIES: PuzzleDifficulty[] = ['intro', 'beginner', 'intermediate', 'advanced', 'expert'];

function uciToMove(uci: string): { from: Square; to: Square; promotion?: string } {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length === 5 ? { promotion: uci[4] } : {}),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleTrainer() {
  const [diffFilter, setDiffFilter] = useState<PuzzleDifficulty | 'all'>('all');

  const filteredPuzzles = useMemo(
    () => diffFilter === 'all' ? adultPuzzles : adultPuzzles.filter(p => p.difficulty === diffFilter),
    [diffFilter],
  );

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle: AdultPuzzle = filteredPuzzles[puzzleIndex] ?? adultPuzzles[0];

  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [step, setStep] = useState(0);          // index into puzzle.solution
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);  // 0 = no hint shown
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [progress, setProgress] = useState<PuzzleProgress>({});
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setProgress(loadProgress()); }, []);

  const legalTargets = useMemo(() => {
    if (!selectedSquare || opponentThinking || solved) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [game, selectedSquare, opponentThinking, solved]);

  const initPuzzle = useCallback((p: AdultPuzzle) => {
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    setGame(new Chess(p.fen));
    setSelectedSquare(null);
    setStep(0);
    setOpponentThinking(false);
    setSolved(false);
    setFailed(false);
    setHintLevel(0);
    setLastMove(null);
    setMessage(p.sideToMove === 'w' ? 'White to move. Find the best continuation.' : 'Black to move. Find the best continuation.');
  }, []);

  const loadPuzzle = useCallback((index: number) => {
    setPuzzleIndex(index);
    initPuzzle(filteredPuzzles[index] ?? adultPuzzles[0]);
  }, [filteredPuzzles, initPuzzle]);

  // Re-initialise when the puzzle changes due to filter change
  useEffect(() => {
    initPuzzle(filteredPuzzles[0] ?? adultPuzzles[0]);
    setPuzzleIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffFilter]);

  // Opponent auto-reply: when step is odd (after player move), play the opponent's reply
  useEffect(() => {
    if (!puzzle || solved || failed) return;
    const sol = puzzle.solution;
    if (step === 0 || step >= sol.length) return;
    if (step % 2 === 0) return;  // even = player's turn, odd = opponent's reply

    setOpponentThinking(true);
    const delay = 350 + Math.floor((step * 97 + puzzle.id.charCodeAt(1)) % 300);  // 350-650ms, deterministic
    opponentTimer.current = setTimeout(() => {
      setGame(prev => {
        const copy = new Chess(prev.fen());
        const m = uciToMove(sol[step]);
        try { copy.move(m); } catch { return prev; }
        setLastMove({ from: m.from, to: m.to });
        return copy;
      });
      const nextStep = step + 1;
      setStep(nextStep);
      setOpponentThinking(false);
      if (nextStep >= sol.length) {
        setSolved(true);
        setMessage('');
      } else {
        setMessage('Good move! Continue the line.');
      }
    }, delay);

    return () => { if (opponentTimer.current) clearTimeout(opponentTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const onSquareClick = (square: Square) => {
    if (solved || failed || opponentThinking) return;
    if (step % 2 !== 0) return;  // not player's turn

    const piece = game.get(square);

    if (!selectedSquare) {
      if (piece?.color === game.turn()) setSelectedSquare(square);
      return;
    }
    if (selectedSquare === square) { setSelectedSquare(null); return; }
    if (piece?.color === game.turn()) { setSelectedSquare(square); return; }

    const attempted = `${selectedSquare}${square}`;
    const expected = puzzle.solution[step];
    const copy = new Chess(game.fen());

    try {
      const mv = copy.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (!mv) { setMessage('Illegal move. Try again.'); setSelectedSquare(null); return; }

      const isCorrect = attempted === expected || `${selectedSquare}${square}q` === expected
        || `${selectedSquare}${square}n` === expected;

      if (!isCorrect) {
        setFailed(true);
        setMessage(`Not quite. The best move was ${expected}. Study the teaching point below, then try again.`);
        setSelectedSquare(null);
        const rec = progress[puzzle.id] ?? { attempts: 0, solved: 0 };
        const next = { ...progress, [puzzle.id]: { ...rec, attempts: rec.attempts + 1 } };
        setProgress(next);
        saveProgress(next);
        return;
      }

      setGame(copy);
      setLastMove({ from: mv.from, to: mv.to });
      setSelectedSquare(null);
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep >= puzzle.solution.length) {
        setSolved(true);
        setMessage('');
        const rec = progress[puzzle.id] ?? { attempts: 0, solved: 0 };
        const next = { ...progress, [puzzle.id]: { ...rec, attempts: rec.attempts + 1, solved: rec.solved + 1 } };
        setProgress(next);
        saveProgress(next);
      } else {
        setMessage('Good move! Opponent is thinking…');
      }
    } catch {
      setMessage('Illegal move. Try again.');
    }
  };

  const rec = progress[puzzle.id];
  const flipped = puzzle.sideToMove === 'b';

  const playerMoves = puzzle.solution.filter((_, i) => i % 2 === 0).length;
  const moveWord = playerMoves === 1 ? '1 move' : `${playerMoves} moves`;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(320px,1fr)]">
      {/* Board column */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6">
        {/* Puzzle meta */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
              Puzzle {puzzleIndex + 1}/{filteredPuzzles.length}
            </span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {DIFFICULTY_LABELS[puzzle.difficulty]}
            </span>
            {puzzle.themes.slice(0, 2).map(t => (
              <span key={t} className="rounded-full border border-teal-600/40 px-2 py-0.5 text-xs text-teal-300">{t}</span>
            ))}
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-100">{puzzle.title}</h2>
          <p className="text-sm text-slate-400">
            {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move · {moveWord} · {puzzle.phase}
          </p>
          {rec && (
            <p className="mt-1 text-xs text-teal-200">Solved locally: {rec.solved} / {rec.attempts} attempts</p>
          )}
        </div>

        <ChessBoard
          game={game}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          onSquareClick={onSquareClick}
          flipped={flipped}
        />
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* Status / coach */}
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Puzzle coach</h3>

          {opponentThinking && (
            <p className="mt-3 animate-pulse text-slate-400 text-sm">Opponent is thinking…</p>
          )}

          {solved && (
            <div className="mt-3 rounded-2xl bg-teal-400/10 border border-teal-400/30 p-4">
              <p className="font-bold text-teal-200 text-lg">Solved!</p>
              <p className="mt-2 text-sm text-slate-300 leading-6">{puzzle.teachingPoint}</p>
            </div>
          )}

          {failed && (
            <div className="mt-3 rounded-2xl bg-red-400/10 border border-red-400/30 p-4">
              <p className="font-bold text-red-300">Not quite this time.</p>
              <p className="mt-2 text-sm text-slate-300 leading-6">{puzzle.teachingPoint}</p>
            </div>
          )}

          {!solved && !failed && message && (
            <p className="mt-3 text-slate-100">{message}</p>
          )}

          {/* 3-level hints */}
          {!solved && !failed && (
            <div className="mt-4 space-y-2">
              {hintLevel === 0 && (
                <button
                  onClick={() => setHintLevel(1)}
                  className="w-full rounded-xl border border-yellow-200/40 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-200/10 text-left"
                >
                  Show gentle hint
                </button>
              )}
              {hintLevel >= 1 && (
                <div className="rounded-xl bg-yellow-200/10 p-3 text-sm text-yellow-100">
                  <span className="font-semibold">Hint 1: </span>{puzzle.hints.gentle}
                </div>
              )}
              {hintLevel === 1 && (
                <button
                  onClick={() => setHintLevel(2)}
                  className="w-full rounded-xl border border-yellow-200/30 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-200/10 text-left"
                >
                  Show directional hint
                </button>
              )}
              {hintLevel >= 2 && (
                <div className="rounded-xl bg-yellow-200/10 p-3 text-sm text-yellow-100">
                  <span className="font-semibold">Hint 2: </span>{puzzle.hints.directional}
                </div>
              )}
              {hintLevel === 2 && (
                <button
                  onClick={() => setHintLevel(3)}
                  className="w-full rounded-xl border border-orange-300/30 px-4 py-2 text-sm text-orange-200 hover:bg-orange-200/10 text-left"
                >
                  Reveal solution
                </button>
              )}
              {hintLevel >= 3 && (
                <div className="rounded-xl bg-orange-400/10 border border-orange-400/30 p-3 text-sm text-orange-100">
                  <span className="font-semibold">Solution: </span>{puzzle.hints.reveal}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => loadPuzzle((puzzleIndex - 1 + filteredPuzzles.length) % filteredPuzzles.length)}
              disabled={filteredPuzzles.length < 2}
              className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm hover:bg-slate-700/50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => loadPuzzle(puzzleIndex)}
              className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm hover:bg-slate-700/50"
            >
              Reset
            </button>
            <button
              onClick={() => loadPuzzle((puzzleIndex + 1) % filteredPuzzles.length)}
              disabled={filteredPuzzles.length < 2}
              className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200 mb-3">Filter by difficulty</h3>
          <div className="flex flex-wrap gap-2">
            {(['all', ...DIFFICULTIES] as const).map(d => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition active:scale-95 ${diffFilter === d ? 'bg-teal-400 text-slate-950' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'}`}
              >
                {d === 'all' ? 'All' : DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {filteredPuzzles.length} puzzle{filteredPuzzles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Teaching point when active */}
        {!solved && !failed && (
          <div className="glass-panel rounded-3xl p-5">
            <h3 className="font-bold text-teal-200">About this puzzle</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Tactics are the building blocks of chess mastery. Repeated pattern recognition at speed
              is how elite players see the whole board quickly. Each puzzle here teaches one idea
              cleanly — the teaching point appears when you solve or after a miss.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
