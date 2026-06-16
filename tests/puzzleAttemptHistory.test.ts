import { describe, expect, it } from 'vitest';
import {
  appendPuzzleAttemptHistory,
  normalisePuzzleAttemptHistory,
  type PuzzleAttemptHistoryEntry,
} from '../lib/puzzles/attemptHistory';

describe('puzzle attempt history', () => {
  it('keeps a timestamped record for each miss and solve', () => {
    const miss = appendPuzzleAttemptHistory([], {
      puzzleId: 'fork-1',
      source: 'local',
      outcome: 'miss',
      step: 0,
      attemptedMove: 'd2d4',
      expectedMove: 'e2e4',
    }, new Date('2026-06-16T01:00:00Z'));

    const solved = appendPuzzleAttemptHistory(miss, {
      puzzleId: 'fork-1',
      source: 'local',
      outcome: 'solved',
      step: 1,
      attemptedMove: 'e2e4',
      expectedMove: 'e2e4',
    }, new Date('2026-06-16T01:01:00Z'));

    expect(solved).toHaveLength(2);
    expect(solved[0]).toMatchObject({
      puzzleId: 'fork-1',
      outcome: 'miss',
      attemptedMove: 'd2d4',
      timestampIso: '2026-06-16T01:00:00.000Z',
    });
    expect(solved[1]).toMatchObject({ outcome: 'solved', step: 1 });
  });

  it('drops invalid legacy rows while reading history', () => {
    const valid: PuzzleAttemptHistoryEntry = {
      id: 'p1-1',
      puzzleId: 'p1',
      source: 'daily',
      outcome: 'miss',
      step: 0,
      timestampIso: '2026-06-16T01:00:00.000Z',
    };

    expect(normalisePuzzleAttemptHistory([valid, null, { puzzleId: 'bad' }])).toEqual([valid]);
  });

  it('caps stored history to the most recent 500 attempts', () => {
    let history: PuzzleAttemptHistoryEntry[] = [];
    for (let i = 0; i < 505; i += 1) {
      history = appendPuzzleAttemptHistory(history, {
        puzzleId: `p${i}`,
        source: 'archive',
        outcome: 'miss',
        step: 0,
      }, new Date(`2026-06-16T01:${String(i % 60).padStart(2, '0')}:00Z`));
    }

    expect(history).toHaveLength(500);
    expect(history[0].puzzleId).toBe('p5');
    expect(history[499].puzzleId).toBe('p504');
  });
});

