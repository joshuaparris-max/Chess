export type PuzzleAttemptOutcome = 'miss' | 'solved' | 'shown';

export type PuzzleAttemptSource = 'local' | 'daily' | 'random' | 'archive';

export type PuzzleAttemptHistoryEntry = {
  id: string;
  puzzleId: string;
  source: PuzzleAttemptSource;
  outcome: PuzzleAttemptOutcome;
  step: number;
  attemptedMove?: string;
  expectedMove?: string;
  timestampIso: string;
};

export const PUZZLE_ATTEMPT_HISTORY_KEY = 'gm-puzzle-attempt-history-v1';

const MAX_ATTEMPT_HISTORY = 500;

function normaliseEntry(value: unknown): PuzzleAttemptHistoryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<PuzzleAttemptHistoryEntry>;
  if (
    typeof raw.id !== 'string'
    || typeof raw.puzzleId !== 'string'
    || typeof raw.source !== 'string'
    || typeof raw.outcome !== 'string'
    || typeof raw.timestampIso !== 'string'
  ) {
    return null;
  }

  return {
    id: raw.id,
    puzzleId: raw.puzzleId,
    source: raw.source as PuzzleAttemptSource,
    outcome: raw.outcome as PuzzleAttemptOutcome,
    step: Math.max(0, Number(raw.step) || 0),
    ...(typeof raw.attemptedMove === 'string' ? { attemptedMove: raw.attemptedMove } : {}),
    ...(typeof raw.expectedMove === 'string' ? { expectedMove: raw.expectedMove } : {}),
    timestampIso: raw.timestampIso,
  };
}

export function normalisePuzzleAttemptHistory(value: unknown): PuzzleAttemptHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const normalised = normaliseEntry(entry);
    return normalised ? [normalised] : [];
  });
}

export function appendPuzzleAttemptHistory(
  history: PuzzleAttemptHistoryEntry[],
  entry: Omit<PuzzleAttemptHistoryEntry, 'id' | 'timestampIso'>,
  now = new Date(),
): PuzzleAttemptHistoryEntry[] {
  const timestampIso = now.toISOString();
  const nextEntry: PuzzleAttemptHistoryEntry = {
    ...entry,
    id: `${entry.puzzleId}-${timestampIso}-${history.length}`,
    timestampIso,
  };
  return [...history, nextEntry].slice(-MAX_ATTEMPT_HISTORY);
}

