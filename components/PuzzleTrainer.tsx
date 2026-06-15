'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';
import type { AdultPuzzle, PuzzleDifficulty } from '@/lib/puzzles/types';
import type { LichessPuzzle } from '@/lib/lichessClient';

// ── Progress ──────────────────────────────────────────────────────────────────

const PROGRESS_KEY = 'gm-adult-puzzle-progress-v1';
const DAILY_PUZZLE_KEY = 'gm-daily-puzzle-solved-v1';
const LICHESS_CACHE_KEY = 'gm-lichess-puzzle-cache-v1';

type PuzzleRecord = { attempts: number; solved: number };
type PuzzleProgress = Record<string, PuzzleRecord>;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function isDailyPuzzleSolvedToday(puzzleId: string): boolean {
  try {
    const today = localDateKey();
    const raw = localStorage.getItem(DAILY_PUZZLE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, string>;
    return data[puzzleId] === today;
  } catch {
    return false;
  }
}

function markDailyPuzzleSolvedToday(puzzleId: string) {
  try {
    const today = localDateKey();
    const raw = localStorage.getItem(DAILY_PUZZLE_KEY) || '{}';
    const data = JSON.parse(raw) as Record<string, string>;
    data[puzzleId] = today;
    localStorage.setItem(DAILY_PUZZLE_KEY, JSON.stringify(data));
  } catch {}
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

/**
 * Convert LichessPuzzle to AdultPuzzle UI format.
 * Fills in missing fields (title, hints, teachingPoint) from puzzle metadata.
 */
function lichessToUiPuzzle(lp: LichessPuzzle): AdultPuzzle {
  return {
    id: lp.lichessId,
    title: `Rated ${lp.rating}`,
    difficulty: 'intermediate', // Lichess doesn't provide difficulty; show as intermediate
    themes: lp.themes.map(t => t as any),
    phase: 'middlegame',
    fen: lp.fen,
    sideToMove: lp.sideToMove,
    solution: lp.solution,
    hints: {
      gentle: `Played by ${lp.plays.toLocaleString()} players on Lichess`,
      directional: `Combination or tactical sequence rated ${lp.rating}`,
      reveal: `Lichess puzzle #${lp.lichessId} from an actual game. See ${lp.url}`,
    },
    teachingPoint: `This is a real game puzzle from Lichess. Players have trained this position ${lp.plays.toLocaleString()} times.`,
    source: 'lichess',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleTrainer() {
  const [sourceTab, setSourceTab] = useState<'local' | 'daily' | 'random' | 'archive'>('local');
  const [diffFilter, setDiffFilter] = useState<PuzzleDifficulty | 'all'>('all');
  const [lichessPuzzle, setLichessPuzzle] = useState<LichessPuzzle | null>(null);
  const [lichessLoading, setLichessLoading] = useState(false);
  const [lichessError, setLichessError] = useState<string | null>(null);
  const [fallbackToLocal, setFallbackToLocal] = useState(false);

  // Archive state
  const [archivePuzzles, setArchivePuzzles] = useState<AdultPuzzle[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveOffset, setArchiveOffset] = useState(0);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const ARCHIVE_PAGE_SIZE = 20;

  // Load Lichess daily puzzle
  useEffect(() => {
    if (sourceTab !== 'daily') return;
    let cancelled = false;

    const load = async () => {
      setLichessLoading(true);
      setLichessError(null);
      setFallbackToLocal(false);
      try {
        const res = await fetch('/api/puzzles?source=daily', { signal: AbortSignal.timeout(16000) });
        if (!res.ok) {
          throw new Error(res.status === 429 ? 'Rate limited by Lichess' : 'Failed to load daily puzzle');
        }
        const puzzle = (await res.json()) as LichessPuzzle;
        if (!cancelled) {
          setLichessPuzzle(puzzle);
        }
      } catch (error) {
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          setLichessError(msg);
          // After 2 retries, offer fallback to local
          setFallbackToLocal(true);
        }
      } finally {
        if (!cancelled) setLichessLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sourceTab]);

  // Load Lichess random puzzle (only on demand, not auto-refresh)
  const loadRandomLichessPuzzle = useCallback(async () => {
    setLichessLoading(true);
    setLichessError(null);
    setFallbackToLocal(false);
    try {
      const res = await fetch('/api/puzzles?source=random', { signal: AbortSignal.timeout(16000) });
      if (!res.ok) {
        throw new Error(res.status === 429 ? 'Rate limited by Lichess' : 'Failed to load random puzzle');
      }
      const puzzle = (await res.json()) as LichessPuzzle;
      setLichessPuzzle(puzzle);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setLichessError(msg);
      setFallbackToLocal(true);
    } finally {
      setLichessLoading(false);
    }
  }, []);

  // Load archive puzzles
  useEffect(() => {
    if (sourceTab !== 'archive') return;
    let cancelled = false;

    const load = async () => {
      setArchiveLoading(true);
      setArchiveError(null);
      try {
        const res = await fetch(
          `/api/accumulated-puzzles?limit=${ARCHIVE_PAGE_SIZE}&offset=${archiveOffset}`,
          { signal: AbortSignal.timeout(16000) },
        );
        if (!res.ok) {
          throw new Error('Failed to load archive');
        }
        const data = (await res.json()) as {
          puzzles: Array<{
            lichess_id: string;
            fen: string;
            side_to_move: 'w' | 'b';
            solution: string[];
            rating: number;
            plays: number;
            themes: string[];
            url: string;
            puzzle_date: string;
          }>;
          total: number;
        };

        if (!cancelled) {
          const converted: AdultPuzzle[] = data.puzzles.map((ap) => ({
            id: ap.lichess_id,
            title: `Rated ${ap.rating} · ${ap.puzzle_date}`,
            difficulty: 'intermediate',
            themes: ap.themes as any,
            phase: 'middlegame',
            fen: ap.fen,
            sideToMove: ap.side_to_move,
            solution: ap.solution,
            hints: {
              gentle: `Played by ${ap.plays.toLocaleString()} players on Lichess`,
              directional: `Combination rated ${ap.rating}`,
              reveal: `Lichess puzzle from ${ap.puzzle_date}. See ${ap.url}`,
            },
            teachingPoint: `Archived daily puzzle from ${ap.puzzle_date}. Players have trained this ${ap.plays.toLocaleString()} times.`,
            source: 'lichess',
          }));
          setArchivePuzzles(converted);
          setArchiveTotal(data.total);
        }
      } catch (error) {
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          setArchiveError(msg);
        }
      } finally {
        if (!cancelled) setArchiveLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sourceTab, archiveOffset]);

  const filteredPuzzles = useMemo(
    () => diffFilter === 'all' ? adultPuzzles : adultPuzzles.filter(p => p.difficulty === diffFilter),
    [diffFilter],
  );

  // Determine which puzzle list to display
  const activePuzzleList = useMemo((): AdultPuzzle[] => {
    if (sourceTab === 'local') return filteredPuzzles;
    if (sourceTab === 'daily' && lichessPuzzle) return [lichessToUiPuzzle(lichessPuzzle)];
    if (sourceTab === 'random' && lichessPuzzle) return [lichessToUiPuzzle(lichessPuzzle)];
    if (sourceTab === 'archive') return archivePuzzles;
    return [];
  }, [sourceTab, filteredPuzzles, lichessPuzzle, archivePuzzles]);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle: AdultPuzzle = activePuzzleList[puzzleIndex] ?? adultPuzzles[0];

  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [step, setStep] = useState(0);
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [progress, setProgress] = useState<PuzzleProgress>({});
  const [dailySolvedToday, setDailySolvedToday] = useState(false);
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

    // Check if daily puzzle was solved today
    if (sourceTab === 'daily' && p.source === 'lichess') {
      setDailySolvedToday(isDailyPuzzleSolvedToday(p.id));
    } else {
      setDailySolvedToday(false);
    }
  }, [sourceTab]);

  const loadPuzzle = useCallback((index: number) => {
    setPuzzleIndex(index);
    initPuzzle(activePuzzleList[index] ?? adultPuzzles[0]);
  }, [activePuzzleList, initPuzzle]);

  // Re-initialise when the puzzle changes due to tab/filter change
  useEffect(() => {
    initPuzzle(activePuzzleList[0] ?? adultPuzzles[0]);
    setPuzzleIndex(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab, diffFilter]);

  // Opponent auto-reply: when step is odd (after player move), play the opponent's reply
  useEffect(() => {
    if (!puzzle || solved || failed) return;
    const sol = puzzle.solution;
    if (step === 0 || step >= sol.length) return;
    if (step % 2 === 0) return;  // even = player's turn, odd = opponent's reply

    setOpponentThinking(true);
    const delay = 350 + Math.floor((step * 97 + puzzle.id.charCodeAt(1)) % 300);
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

        // Mark daily puzzle as solved today
        if (sourceTab === 'daily' && puzzle.source === 'lichess') {
          markDailyPuzzleSolvedToday(puzzle.id);
          setDailySolvedToday(true);
        }
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
    <section className="space-y-5">
      {/* Quick start: Lichess puzzle shortcut */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setSourceTab('daily')}
          className="px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center gap-2"
        >
          ⚡ Today's Lichess Puzzle
          {dailySolvedToday && ' ✓'}
        </button>
        <button
          onClick={() => { setSourceTab('archive'); }}
          className="px-4 py-3 rounded-xl font-semibold border border-blue-500/50 text-blue-300 hover:bg-blue-500/10 transition"
        >
          📚 Puzzle Archive
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSourceTab('local')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            sourceTab === 'local'
              ? 'bg-teal-400 text-slate-950'
              : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          Local Puzzles
        </button>
        <button
          onClick={() => setSourceTab('daily')}
          disabled={lichessError !== null && sourceTab !== 'daily'}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            sourceTab === 'daily'
              ? 'bg-teal-400 text-slate-950'
              : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50 disabled:opacity-40'
          }`}
        >
          Daily (Lichess)
          {dailySolvedToday && sourceTab === 'daily' && ' ✓'}
        </button>
        <button
          onClick={() => { setSourceTab('random'); if (!lichessPuzzle) loadRandomLichessPuzzle(); }}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            sourceTab === 'random'
              ? 'bg-teal-400 text-slate-950'
              : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          Random (Lichess)
        </button>
        <button
          onClick={() => setSourceTab('archive')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            sourceTab === 'archive'
              ? 'bg-teal-400 text-slate-950'
              : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          Daily Archive
        </button>
      </div>

      {/* Loading state */}
      {lichessLoading && sourceTab !== 'archive' && (
        <div className="glass-panel rounded-3xl p-5 text-center">
          <p className="text-slate-400">Loading puzzle from Lichess…</p>
        </div>
      )}

      {archiveLoading && sourceTab === 'archive' && (
        <div className="glass-panel rounded-3xl p-5 text-center">
          <p className="text-slate-400">Loading puzzles from archive…</p>
        </div>
      )}

      {/* Error state */}
      {lichessError && sourceTab !== 'local' && sourceTab !== 'archive' && (
        <div className="glass-panel rounded-3xl p-5 border border-red-500/30">
          <p className="text-red-300">
            {lichessError === 'Rate limited by Lichess'
              ? 'Lichess is rate-limiting us. Please wait and try again.'
              : `Could not load puzzle: ${lichessError}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => loadRandomLichessPuzzle()}
              className="rounded-xl border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              Retry
            </button>
            {fallbackToLocal && (
              <button
                onClick={() => {
                  setSourceTab('local');
                  setLichessError(null);
                  setFallbackToLocal(false);
                }}
                className="rounded-xl border border-yellow-500/50 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-500/10"
              >
                Use Local Puzzles Instead
              </button>
            )}
          </div>
        </div>
      )}

      {archiveError && sourceTab === 'archive' && (
        <div className="glass-panel rounded-3xl p-5 border border-red-500/30">
          <p className="text-red-300">Could not load archive: {archiveError}</p>
          <div className="mt-3">
            <button
              onClick={() => setArchiveOffset(0)}
              className="rounded-xl border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {sourceTab === 'archive' && !archiveLoading && archivePuzzles.length === 0 && !archiveError && (
        <div className="glass-panel rounded-3xl p-5 text-center">
          <p className="text-slate-400">No puzzles in archive yet. Check back after the first daily import!</p>
        </div>
      )}

      {/* Main puzzle view */}
      {!lichessLoading && !archiveLoading && activePuzzleList.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(320px,1fr)]">
          {/* Board column */}
          <div className="glass-panel rounded-3xl p-4 sm:p-6">
            {/* Puzzle meta */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {sourceTab === 'local' && (
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
                    Puzzle {puzzleIndex + 1}/{activePuzzleList.length}
                  </span>
                )}
                {sourceTab !== 'local' && (
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                    {puzzle.source === 'lichess' ? 'Lichess Puzzle' : 'Daily'}
                  </span>
                )}
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
                  {DIFFICULTY_LABELS[puzzle.difficulty]}
                </span>
                {puzzle.source === 'lichess' && puzzle.themes.length > 0 && (
                  <span className="rounded-full border border-blue-600/40 px-2 py-0.5 text-xs text-blue-300">
                    Rated {(puzzle as any).rating || '?'}
                  </span>
                )}
                {puzzle.themes.slice(0, 1).map(t => (
                  <span key={t} className="rounded-full border border-teal-600/40 px-2 py-0.5 text-xs text-teal-300">{t}</span>
                ))}
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-100">{puzzle.title}</h2>
              <p className="text-sm text-slate-400">
                {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move · {moveWord} · {puzzle.phase}
              </p>
              {rec && sourceTab === 'local' && (
                <p className="mt-1 text-xs text-teal-200">Solved: {rec.solved} / {rec.attempts} attempts</p>
              )}
              {sourceTab === 'daily' && dailySolvedToday && (
                <p className="mt-1 text-xs text-teal-200">✓ Solved today!</p>
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
                {sourceTab === 'local' && (
                  <>
                    <button
                      onClick={() => loadPuzzle((puzzleIndex - 1 + activePuzzleList.length) % activePuzzleList.length)}
                      disabled={activePuzzleList.length < 2}
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
                      onClick={() => loadPuzzle((puzzleIndex + 1) % activePuzzleList.length)}
                      disabled={activePuzzleList.length < 2}
                      className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </>
                )}
                {sourceTab === 'archive' && (
                  <>
                    <button
                      onClick={() => setArchiveOffset(Math.max(0, archiveOffset - ARCHIVE_PAGE_SIZE))}
                      disabled={archiveOffset === 0}
                      className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm hover:bg-slate-700/50 disabled:opacity-40"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => loadPuzzle(0)}
                      className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm hover:bg-slate-700/50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setArchiveOffset(archiveOffset + ARCHIVE_PAGE_SIZE)}
                      disabled={archiveOffset + ARCHIVE_PAGE_SIZE >= archiveTotal}
                      className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-40"
                    >
                      Next →
                    </button>
                    <span className="text-xs text-slate-400 px-2 py-2">
                      {archiveOffset + 1}–{Math.min(archiveOffset + ARCHIVE_PAGE_SIZE, archiveTotal)} / {archiveTotal}
                    </span>
                  </>
                )}
                {sourceTab !== 'local' && sourceTab !== 'archive' && (
                  <button
                    onClick={() => loadRandomLichessPuzzle()}
                    className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300"
                  >
                    {sourceTab === 'daily' ? 'Refresh' : 'Get Another →'}
                  </button>
                )}
              </div>
            </div>

            {/* Filters (only for local puzzles) */}
            {sourceTab === 'local' && (
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
                  {activePuzzleList.length} puzzle{activePuzzleList.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* About this puzzle (Lichess credit) */}
            {sourceTab !== 'local' && puzzle.source === 'lichess' && (
              <div className="glass-panel rounded-3xl p-5">
                <h3 className="font-bold text-blue-300">About this puzzle</h3>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  This puzzle is from <strong>Lichess.org</strong>, the free, open-source chess platform. Trained by {((puzzle as any).plays || 0).toLocaleString()} players.
                </p>
                <a
                  href={(puzzle as any).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition"
                >
                  View on Lichess →
                </a>
              </div>
            )}

            {/* Teaching point (local puzzles) */}
            {!solved && !failed && sourceTab === 'local' && (
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
        </div>
      )}
    </section>
  );
}
