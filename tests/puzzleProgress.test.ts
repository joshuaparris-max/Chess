import { describe, expect, it } from 'vitest';
import { duePuzzleIds, normalisePuzzleProgress, puzzleSolveStreak, recordPuzzleMiss, recordPuzzleSolve } from '../lib/puzzles/progress';

describe('puzzle spaced repetition progress', () => {
  it('migrates legacy attempt and solved totals', () => {
    expect(normalisePuzzleProgress({ p1: { attempts: 3, solved: 1 } }).p1).toMatchObject({ attempts: 3, solved: 1 });
  });

  it('schedules a miss for immediate review', () => {
    const now = new Date('2026-06-15T10:00:00Z');
    const progress = recordPuzzleMiss({}, 'p1', now);
    expect(progress.p1).toMatchObject({ attempts: 1, reviewLevel: 0, nextReviewDate: '2026-06-15' });
    expect(duePuzzleIds(progress, '2026-06-15')).toEqual(['p1']);
  });

  it('increases review spacing after repeated solves', () => {
    const first = recordPuzzleSolve({}, 'p1', new Date('2026-06-15T10:00:00Z'));
    const second = recordPuzzleSolve(first, 'p1', new Date('2026-06-16T10:00:00Z'));
    expect(first.p1.nextReviewDate).toBe('2026-06-16');
    expect(second.p1.nextReviewDate).toBe('2026-06-19');
  });

  it('calculates a consecutive daily solve streak', () => {
    const progress = {
      p1: { attempts: 1, solved: 1, lastSolvedDate: '2026-06-15' },
      p2: { attempts: 1, solved: 1, lastSolvedDate: '2026-06-14' },
      p3: { attempts: 1, solved: 1, lastSolvedDate: '2026-06-13' },
    };
    expect(puzzleSolveStreak(progress, new Date('2026-06-15T23:00:00Z'))).toBe(3);
  });
});
