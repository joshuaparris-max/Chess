'use client';

import { loadLocalGames } from '@/lib/gameArchive';
import {
  PUZZLE_ATTEMPT_HISTORY_KEY,
  normalisePuzzleAttemptHistory,
} from '@/lib/puzzles/attemptHistory';

export type WeeklyStats = {
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  winRate: number | null;
  stickersTotal: number;
  newStickers: string[];
  rangeStartIso: string;
  rangeEndIso: string;
  hasTimestampedData: boolean;
};

function within7Days(iso: string, now: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return now - t <= 7 * 24 * 60 * 60 * 1000 && t <= now;
}

function isPlayerWin(result: string, playerColor: 'w' | 'b'): boolean {
  // result strings vary ("White wins", "1-0", "Checkmate — White wins", etc.)
  const r = result.toLowerCase();
  if (playerColor === 'w') return r.includes('white wins') || r.includes('1-0');
  return r.includes('black wins') || r.includes('0-1');
}

export function getWeeklyStats(now = Date.now()): WeeklyStats {
  const rangeEnd = new Date(now);
  const rangeStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

  let games: ReturnType<typeof loadLocalGames> = [];
  try {
    games = loadLocalGames();
  } catch {
    games = [];
  }
  const weekGames = games.filter((g) => within7Days(g.createdAtIso, now));
  const gamesPlayed = weekGames.length;
  const gamesWon = weekGames.filter((g) => isPlayerWin(g.result ?? '', g.playerColor)).length;

  let puzzlesSolved = 0;
  let hasPuzzleTimestamps = false;
  try {
    const raw = window.localStorage.getItem(PUZZLE_ATTEMPT_HISTORY_KEY);
    const history = normalisePuzzleAttemptHistory(raw ? JSON.parse(raw) : []);
    hasPuzzleTimestamps = history.length > 0;
    const solvedThisWeek = new Set<string>();
    history.forEach((entry) => {
      if (entry.outcome === 'solved' && within7Days(entry.timestampIso, now)) {
        solvedThisWeek.add(entry.puzzleId);
      }
    });
    puzzlesSolved = solvedThisWeek.size;
  } catch {
    puzzlesSolved = 0;
  }

  let stickersTotal = 0;
  try {
    const raw = window.localStorage.getItem('earnedStickers');
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) stickersTotal = list.length;
  } catch {
    stickersTotal = 0;
  }

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : null;

  return {
    gamesPlayed,
    gamesWon,
    puzzlesSolved,
    winRate,
    stickersTotal,
    newStickers: [],
    rangeStartIso: rangeStart.toISOString(),
    rangeEndIso: rangeEnd.toISOString(),
    hasTimestampedData: games.length > 0 || hasPuzzleTimestamps,
  };
}
