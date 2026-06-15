export type ClockColor = 'w' | 'b';

export type ClockState = {
  whiteBaseMs: number;
  blackBaseMs: number;
  activeColor: ClockColor | null;
  turnStartedAtMs: number | null;
  incrementMs: number;
};

export function createClock(baseMs: number, incrementMs = 0): ClockState {
  return { whiteBaseMs: baseMs, blackBaseMs: baseMs, activeColor: null, turnStartedAtMs: null, incrementMs };
}

export function startClock(clock: ClockState, color: ClockColor, now: number): ClockState {
  return { ...clock, activeColor: color, turnStartedAtMs: now };
}

export function getRemainingMs(clock: ClockState, color: ClockColor, now: number): number {
  const base = color === 'w' ? clock.whiteBaseMs : clock.blackBaseMs;
  if (clock.activeColor !== color || clock.turnStartedAtMs === null) return base;
  return Math.max(0, base - (now - clock.turnStartedAtMs));
}

export function commitClockMove(clock: ClockState, mover: ClockColor, now: number): ClockState {
  const remaining = getRemainingMs(clock, mover, now) + clock.incrementMs;
  return {
    ...clock,
    whiteBaseMs: mover === 'w' ? remaining : clock.whiteBaseMs,
    blackBaseMs: mover === 'b' ? remaining : clock.blackBaseMs,
    activeColor: mover === 'w' ? 'b' : 'w',
    turnStartedAtMs: now,
  };
}

export function stopClock(clock: ClockState, now: number): ClockState {
  if (!clock.activeColor) return clock;
  const remaining = getRemainingMs(clock, clock.activeColor, now);
  return {
    ...clock,
    whiteBaseMs: clock.activeColor === 'w' ? remaining : clock.whiteBaseMs,
    blackBaseMs: clock.activeColor === 'b' ? remaining : clock.blackBaseMs,
    activeColor: null,
    turnStartedAtMs: null,
  };
}
