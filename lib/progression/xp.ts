export type PlayerLevel = {
  name: string;
  symbol: string;
  minXp: number;
};

export type PlayerProgress = {
  xp: number;
  level: string;
  gamesPlayed: number;
  puzzlesSolved: number;
};

export type XpHistoryEntry = {
  amount: number;
  reason: string;
  timestamp: string;
};

export const LEVELS: PlayerLevel[] = [
  { name: 'Pawn', symbol: '♟', minXp: 0 },
  { name: 'Knight', symbol: '♞', minXp: 100 },
  { name: 'Bishop', symbol: '♝', minXp: 300 },
  { name: 'Rook', symbol: '♜', minXp: 700 },
  { name: 'Queen', symbol: '♛', minXp: 1500 },
  { name: 'Grandmaster', symbol: '⭐', minXp: 3000 },
];

export const PLAYER_PROGRESS_KEY = 'playerProgress';
export const XP_HISTORY_KEY = 'xpHistory';
export const XP_AWARDED_EVENT = 'gm-xp-awarded';

const EMPTY_PROGRESS: PlayerProgress = {
  xp: 0,
  level: 'Pawn',
  gamesPlayed: 0,
  puzzlesSolved: 0,
};

export function getLevel(xp: number): PlayerLevel {
  return LEVELS.reduce((best, level) => (xp >= level.minXp ? level : best), LEVELS[0]);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
}

function saveProgress(progress: PlayerProgress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(progress));
}

export function getStoredProgress(): PlayerProgress {
  const raw = readJson<Partial<PlayerProgress>>(PLAYER_PROGRESS_KEY, {});
  const xp = Math.max(0, Number(raw.xp) || 0);
  return {
    xp,
    level: getLevel(xp).name,
    gamesPlayed: Math.max(0, Number(raw.gamesPlayed) || 0),
    puzzlesSolved: Math.max(0, Number(raw.puzzlesSolved) || 0),
  };
}

export function getPlayerProgress() {
  const progress = getStoredProgress();
  const level = getLevel(progress.xp);
  const currentIndex = LEVELS.findIndex((item) => item.name === level.name);
  const nextLevel = LEVELS[currentIndex + 1];
  const nextLevelXp = nextLevel?.minXp ?? level.minXp;
  const span = nextLevel ? nextLevel.minXp - level.minXp : 1;
  const progressPercent = nextLevel ? Math.round(((progress.xp - level.minXp) / span) * 100) : 100;

  return {
    xp: progress.xp,
    level: level.name,
    symbol: level.symbol,
    nextLevelXp,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
  };
}

export function awardXP(amount: number, reason: string): void {
  if (typeof window === 'undefined' || amount <= 0) return;
  const before = getStoredProgress();
  const beforeLevel = getLevel(before.xp);
  const afterXp = before.xp + amount;
  const afterLevel = getLevel(afterXp);
  const next = { ...before, xp: afterXp, level: afterLevel.name };
  saveProgress(next);

  const history = readJson<XpHistoryEntry[]>(XP_HISTORY_KEY, []);
  const entry = { amount, reason, timestamp: new Date().toISOString() };
  window.localStorage.setItem(XP_HISTORY_KEY, JSON.stringify([...history, entry].slice(-50)));
  window.dispatchEvent(new CustomEvent(XP_AWARDED_EVENT, {
    detail: {
      amount,
      reason,
      totalXp: afterXp,
      level: afterLevel,
      previousLevel: beforeLevel.name !== afterLevel.name ? beforeLevel : null,
    },
  }));
}

export function recordPuzzleSolved(firstTry: boolean) {
  const progress = getStoredProgress();
  saveProgress({ ...progress, puzzlesSolved: progress.puzzlesSolved + 1 });
  awardXP(firstTry ? 15 : 10, firstTry ? 'Puzzle solved first try' : 'Puzzle solved');
}

export function recordGameCompleted(playerWon: boolean) {
  const progress = getStoredProgress();
  saveProgress({ ...progress, gamesPlayed: progress.gamesPlayed + 1 });
  awardXP(playerWon ? 25 : 10, playerWon ? 'Game won vs bot' : 'Game completed');
}

