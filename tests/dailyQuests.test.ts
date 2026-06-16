import { describe, expect, it } from 'vitest';
import { pickQuestsForDate, QUEST_POOL } from '../lib/quests/dailyQuests';

describe('Daily quests', () => {
  it('picks exactly 3 quests for a date', () => {
    expect(pickQuestsForDate('2026-06-16')).toHaveLength(3);
  });

  it('is deterministic for the same date', () => {
    const a = pickQuestsForDate('2026-06-16').map((q) => q.id);
    const b = pickQuestsForDate('2026-06-16').map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('picks distinct quests from the pool', () => {
    const ids = pickQuestsForDate('2026-06-16').map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(QUEST_POOL.some((q) => q.id === id)).toBe(true));
  });

  it('varies across different dates', () => {
    const days = ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'];
    const signatures = new Set(days.map((d) => pickQuestsForDate(d).map((q) => q.id).join(',')));
    expect(signatures.size).toBeGreaterThan(1);
  });
});
