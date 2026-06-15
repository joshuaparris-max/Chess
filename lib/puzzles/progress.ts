export type PuzzleRecord = {
  attempts: number;
  solved: number;
  lastAttemptIso?: string;
  lastSolvedDate?: string;
  reviewLevel?: number;
  nextReviewDate?: string;
};

export type PuzzleProgress = Record<string, PuzzleRecord>;

const REVIEW_DAYS = [1, 3, 7, 14, 30];

export function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function normalisePuzzleProgress(value: unknown): PuzzleProgress {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([id, raw]) => {
    if (!raw || typeof raw !== 'object') return [];
    const record = raw as Partial<PuzzleRecord>;
    return [[id, {
      attempts: Math.max(0, Number(record.attempts) || 0),
      solved: Math.max(0, Number(record.solved) || 0),
      ...(typeof record.lastAttemptIso === 'string' ? { lastAttemptIso: record.lastAttemptIso } : {}),
      ...(typeof record.lastSolvedDate === 'string' ? { lastSolvedDate: record.lastSolvedDate } : {}),
      ...(typeof record.reviewLevel === 'number' ? { reviewLevel: Math.max(0, record.reviewLevel) } : {}),
      ...(typeof record.nextReviewDate === 'string' ? { nextReviewDate: record.nextReviewDate } : {}),
    } satisfies PuzzleRecord]];
  }));
}

export function recordPuzzleMiss(progress: PuzzleProgress, puzzleId: string, now = new Date()): PuzzleProgress {
  const record = progress[puzzleId] ?? { attempts: 0, solved: 0 };
  return {
    ...progress,
    [puzzleId]: {
      ...record,
      attempts: record.attempts + 1,
      lastAttemptIso: now.toISOString(),
      reviewLevel: 0,
      nextReviewDate: dateKey(now),
    },
  };
}

export function recordPuzzleSolve(progress: PuzzleProgress, puzzleId: string, now = new Date()): PuzzleProgress {
  const record = progress[puzzleId] ?? { attempts: 0, solved: 0 };
  const reviewLevel = Math.min((record.reviewLevel ?? 0) + 1, REVIEW_DAYS.length);
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + REVIEW_DAYS[Math.max(0, reviewLevel - 1)]);
  return {
    ...progress,
    [puzzleId]: {
      ...record,
      attempts: record.attempts + 1,
      solved: record.solved + 1,
      lastAttemptIso: now.toISOString(),
      lastSolvedDate: dateKey(now),
      reviewLevel,
      nextReviewDate: dateKey(next),
    },
  };
}

export function duePuzzleIds(progress: PuzzleProgress, today = dateKey()): string[] {
  return Object.entries(progress)
    .filter(([, record]) => record.nextReviewDate && record.nextReviewDate <= today)
    .sort((a, b) => (a[1].nextReviewDate ?? '').localeCompare(b[1].nextReviewDate ?? ''))
    .map(([id]) => id);
}

export function puzzleSolveStreak(progress: PuzzleProgress, today = new Date()): number {
  const solvedDates = new Set(Object.values(progress).map((record) => record.lastSolvedDate).filter(Boolean));
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  while (solvedDates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
