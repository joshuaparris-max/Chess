import { describe, expect, it } from 'vitest';
import { commitClockMove, createClock, getRemainingMs, startClock, stopClock } from '@/lib/clock';

describe('delta-time chess clock', () => {
  it('uses elapsed timestamps rather than interval counts', () => {
    const clock = startClock(createClock(300_000), 'w', 1_000);
    expect(getRemainingMs(clock, 'w', 3_500)).toBe(297_500);
    expect(getRemainingMs(clock, 'b', 3_500)).toBe(300_000);
  });

  it('commits the mover time and starts the opponent clock', () => {
    const clock = startClock(createClock(300_000, 2_000), 'w', 1_000);
    const next = commitClockMove(clock, 'w', 6_000);
    expect(next.whiteBaseMs).toBe(297_000);
    expect(next.activeColor).toBe('b');
    expect(next.turnStartedAtMs).toBe(6_000);
  });

  it('stops without losing inactive-side time', () => {
    const stopped = stopClock(startClock(createClock(60_000), 'b', 10), 1_010);
    expect(stopped.blackBaseMs).toBe(59_000);
    expect(stopped.whiteBaseMs).toBe(60_000);
    expect(stopped.activeColor).toBeNull();
  });
});
