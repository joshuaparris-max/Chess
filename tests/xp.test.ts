import { describe, expect, it } from 'vitest';
import { getLevel, LEVELS } from '../lib/progression/xp';

describe('XP levels', () => {
  it('returns the highest unlocked level for an XP total', () => {
    expect(getLevel(0).name).toBe('Pawn');
    expect(getLevel(99).name).toBe('Pawn');
    expect(getLevel(100).name).toBe('Knight');
    expect(getLevel(300).name).toBe('Bishop');
    expect(getLevel(700).name).toBe('Rook');
    expect(getLevel(1500).name).toBe('Queen');
    expect(getLevel(3000).name).toBe('Grandmaster');
  });

  it('keeps levels ordered by XP threshold', () => {
    const thresholds = LEVELS.map((level) => level.minXp);
    expect(thresholds).toEqual([...thresholds].sort((a, b) => a - b));
  });
});

