import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { botLevels } from '../lib/trainingData';
import { chooseWeakenedMove, seededRng } from '../lib/chess/botDifficulty';
import type { BotLevel } from '../lib/types';

const L1 = botLevels.find((b) => b.id === 'street-400') as BotLevel; // Trainer Level 1
const L4 = botLevels.find((b) => b.id === 'expert-2000') as BotLevel; // strong

// Quiet opening position (1.e4) — Black to move, clear "best" stand-in: c7c5.
const QUIET = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
// Back-rank mate in one: White to move, Ra1-a8#.
const MATE_IN_ONE = '7k/5ppp/8/8/8/8/8/R6K w - - 0 1';
// Exactly one legal move: white king a1 in check from Ra2 (Ra3 defends a2) -> Kb1 only.
const ONLY_MOVE = '7k/8/8/8/8/r7/r7/K7 w - - 0 1';

function legalSet(fen: string): Set<string> {
  const g = new Chess(fen);
  return new Set(g.moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion ?? ''}`));
}

describe('Bot difficulty weakening', () => {
  it('only ever returns legal moves (all levels, many seeds)', () => {
    for (const level of [L1, L4]) {
      const legal = legalSet(QUIET);
      for (let seed = 0; seed < 40; seed += 1) {
        const move = chooseWeakenedMove(QUIET, level, 'c7c5', { rng: seededRng(seed) });
        expect(move).not.toBeNull();
        expect(legal.has(move as string)).toBe(true);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const a = chooseWeakenedMove(QUIET, L1, 'c7c5', { rng: seededRng(123) });
    const b = chooseWeakenedMove(QUIET, L1, 'c7c5', { rng: seededRng(123) });
    expect(a).toBe(b);
  });

  it('Level 1 does not always play the engine top move', () => {
    let differed = 0;
    for (let seed = 0; seed < 60; seed += 1) {
      const move = chooseWeakenedMove(QUIET, L1, 'c7c5', { rng: seededRng(seed), style: 'standard' });
      if (move !== 'c7c5') differed += 1;
    }
    expect(differed).toBeGreaterThan(0);
  });

  it('Level 1 produces varied moves across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed += 1) {
      seen.add(chooseWeakenedMove(QUIET, L1, 'c7c5', { rng: seededRng(seed) }) as string);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('higher level plays the engine top move more often than Level 1', () => {
    const topRate = (level: BotLevel) => {
      let top = 0;
      for (let seed = 0; seed < 80; seed += 1) {
        if (chooseWeakenedMove(QUIET, level, 'c7c5', { rng: seededRng(seed), style: 'standard' }) === 'c7c5') top += 1;
      }
      return top / 80;
    };
    expect(topRate(L4)).toBeGreaterThan(topRate(L1));
  });

  it('Level 1 sometimes overlooks a mate in one (mercy)', () => {
    let mate = 0;
    for (let seed = 0; seed < 80; seed += 1) {
      if (chooseWeakenedMove(MATE_IN_ONE, L1, 'a1a8', { rng: seededRng(seed), style: 'gentle' }) === 'a1a8') mate += 1;
    }
    expect(mate).toBeLessThan(80); // not every time
  });

  it('a strong level still finds the mate in one most of the time', () => {
    let mate = 0;
    for (let seed = 0; seed < 80; seed += 1) {
      if (chooseWeakenedMove(MATE_IN_ONE, L4, 'a1a8', { rng: seededRng(seed), style: 'standard' }) === 'a1a8') mate += 1;
    }
    expect(mate).toBeGreaterThan(60);
  });

  it('always plays the only legal move, even at Level 1 (no suppressing forced mate)', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      // Pass a wrong engineBest to prove the only-move guard wins.
      expect(chooseWeakenedMove(ONLY_MOVE, L1, 'zzzz', { rng: seededRng(seed) })).toBe('a1b1');
    }
  });

  it('confirms the only-move fixture truly has one legal move', () => {
    expect(new Chess(ONLY_MOVE).moves()).toHaveLength(1);
  });
});
