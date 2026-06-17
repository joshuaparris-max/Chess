'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import {
  ENDGAME_DRILL_PROGRESS_KEY,
  emptyEndgameProgress,
  endgameDrills,
  getEndgameHint,
  normaliseEndgameProgress,
  recordEndgameAttempt,
  tryEndgameMove,
  type EndgameDrillProgress,
} from '@/lib/endgames/drills';

export default function EndgameDrills() {
  const [activeId, setActiveId] = useState(endgameDrills[0]?.id ?? '');
  const active = useMemo(
    () => endgameDrills.find((drill) => drill.id === activeId) ?? endgameDrills[0],
    [activeId],
  );
  const [game, setGame] = useState(() => new Chess(active.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [ply, setPly] = useState(0);
  const [message, setMessage] = useState(active.goal);
  const [sessionMisses, setSessionMisses] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState<EndgameDrillProgress>(emptyEndgameProgress);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ENDGAME_DRILL_PROGRESS_KEY);
      setProgress(normaliseEndgameProgress(raw ? JSON.parse(raw) : undefined));
    } catch {
      setProgress(emptyEndgameProgress);
    }
  }, []);

  useEffect(() => {
    setGame(new Chess(active.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setPly(0);
    setCompleted(false);
    setSessionMisses(0);
    setMessage(active.goal);
  }, [active]);

  const saveProgress = (next: EndgameDrillProgress) => {
    setProgress(next);
    try {
      window.localStorage.setItem(ENDGAME_DRILL_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Drills remain playable if browser storage is unavailable.
    }
  };

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);

  const captureSquares = useMemo(() => {
    if (!selectedSquare) return [];
    return game
      .moves({ square: selectedSquare, verbose: true })
      .filter((move) => Boolean(move.captured))
      .map((move) => move.to);
  }, [game, selectedSquare]);

  const resetActive = () => {
    setGame(new Chess(active.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setPly(0);
    setCompleted(false);
    setSessionMisses(0);
    setMessage(active.goal);
  };

  const onSquareClick = (square: Square) => {
    if (completed) return;
    const piece = game.get(square);

    if (!selectedSquare) {
      if (piece?.color === game.turn()) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === game.turn()) {
      setSelectedSquare(square);
      return;
    }

    const result = tryEndgameMove(active, game.fen(), ply, selectedSquare, square);
    if (result.status === 'correct') {
      setGame(new Chess(result.fen));
      setLastMove({ from: selectedSquare, to: square });
      setSelectedSquare(null);
      setPly(result.nextPly);
      if (result.completed) {
        setCompleted(true);
        setMessage(active.successText);
        saveProgress(recordEndgameAttempt(progress, active.id, true));
      } else {
        setMessage(`Good move: ${result.san}. Keep going.`);
      }
      return;
    }

    if (result.status === 'incorrect') {
      const nextProgress = recordEndgameAttempt(progress, active.id, false);
      const misses = sessionMisses + 1;
      const totalMisses = nextProgress.attemptsById[active.id] ?? misses;
      setSessionMisses(misses);
      saveProgress(nextProgress);
      setSelectedSquare(null);
      setMessage(`${result.reason} Hint ${Math.min(Math.floor((totalMisses - 1) / 2) + 1, active.hints.length)}: ${getEndgameHint(active, totalMisses)}`);
      return;
    }

    setSelectedSquare(null);
    setMessage(result.reason);
  };

  const completedCount = endgameDrills.filter((drill) => progress.completedIds.includes(drill.id)).length;
  const totalAttemptsForActive = progress.attemptsById[active.id] ?? 0;
  const currentHint = getEndgameHint(active, Math.max(sessionMisses, totalAttemptsForActive));

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,620px)_minmax(320px,1fr)]">
      <div className="glass-panel min-w-0 rounded-3xl p-3 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Endgame Drills</p>
            <h2 className="mt-2 text-2xl font-black text-slate-50">{active.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{active.goal}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-950/30 px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-200">{completedCount}/{endgameDrills.length}</p>
            <p className="text-xs font-semibold text-emerald-100">complete</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-700 bg-slate-950/60 p-3">
          <ChessBoard
            game={game}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
            captureSquares={captureSquares}
            lastMove={lastMove}
            disabled={completed}
            onSquareClick={onSquareClick}
          />
        </div>

        <div className={`mt-4 rounded-2xl border p-4 ${
          completed
            ? 'border-emerald-300/50 bg-emerald-950/30 text-emerald-100'
            : message === active.goal
            ? 'border-slate-600/60 bg-slate-950/60 text-slate-200'
            : 'border-yellow-300/40 bg-yellow-950/30 text-yellow-100'
        }`}>
          <p className="font-bold">{completed ? 'Drill solved' : 'Coach note'}</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetActive}
            className="min-h-11 rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800"
          >
            Reset drill
          </button>
          <button
            type="button"
            onClick={() => setMessage(currentHint)}
            className="min-h-11 rounded-xl border border-emerald-300/60 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/20"
          >
            Get hint
          </button>
        </div>

        {!completed && (sessionMisses > 0 || totalAttemptsForActive > 0) && (
          <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-950/20 p-4 text-sm leading-6 text-emerald-50">
            <p className="font-bold text-emerald-200">Current hint</p>
            <p className="mt-1">{currentHint}</p>
            {totalAttemptsForActive >= 8 && (
              <p className="mt-2 text-emerald-100">
                You have tried this one {totalAttemptsForActive} times. It is okay to use the exact move hint and then replay it once from memory.
              </p>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="text-lg font-black text-emerald-200">Choose a drill</h3>
          <div className="mt-4 grid gap-3">
            {endgameDrills.map((drill) => {
              const isActive = drill.id === active.id;
              const isDone = progress.completedIds.includes(drill.id);
              const attempts = progress.attemptsById[drill.id] ?? 0;
              return (
                <button
                  key={drill.id}
                  type="button"
                  onClick={() => setActiveId(drill.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-300 text-slate-950'
                      : 'border-slate-600/60 bg-slate-950/60 text-slate-100 hover:border-emerald-300/70'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-black">{drill.title}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${
                      isActive
                        ? 'bg-slate-950 text-emerald-200'
                        : isDone
                        ? 'bg-emerald-300 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isDone ? 'Done' : drill.level}
                    </span>
                  </span>
                  <span className={`mt-1 block text-sm ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                    {drill.theme}{attempts > 0 ? ` · ${attempts} attempt${attempts === 1 ? '' : 's'}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-black text-yellow-200">How these help</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Endgames teach clean technique: king activity, opposition, rook checks, and pawn breakthroughs.
            These drills are stored in the app, so they work even when live puzzle services are unavailable.
          </p>
        </div>
      </aside>
    </section>
  );
}
