import { describe, expect, it } from 'vitest';
import { normaliseFamilyProgress } from '@/lib/familyProgress';

describe('family progress normalization', () => {
  it('deduplicates known activities and clamps puzzle stars', () => {
    expect(normaliseFamilyProgress({
      adventuresDone: ['knight', 'knight', 'unknown'],
      lessonsDone: ['pieces', 'bad'],
      puzzleStars: { fp01: 99, fp04: 1.8, bad: 2 },
    })).toEqual({
      adventuresDone: ['knight'],
      lessonsDone: ['pieces'],
      puzzleStars: { fp01: 3, fp04: 1 },
    });
  });

  it('returns safe empty progress for malformed values', () => {
    expect(normaliseFamilyProgress('bad')).toEqual({ adventuresDone: [], lessonsDone: [], puzzleStars: {} });
  });
});
