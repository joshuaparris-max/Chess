import { describe, expect, it } from 'vitest';
import { normaliseLearningProgress } from '@/lib/learningProgress';

describe('learning progress', () => {
  it('deduplicates lesson completion and preserves puzzle history', () => {
    expect(normaliseLearningProgress({ lessonsDone: ['one', 'one'], puzzleAttempts: { p1: { attempts: 2, solved: 1, lastAttemptIso: 'x' } } })).toEqual({
      lessonsDone: ['one'],
      puzzleAttempts: { p1: { attempts: 2, solved: 1, lastAttemptIso: 'x' } },
    });
  });
});
