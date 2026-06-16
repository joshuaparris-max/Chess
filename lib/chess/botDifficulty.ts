import { Chess, type Move } from 'chess.js';
import type { BotLevel } from '../types';

// Central bot difficulty configuration + a weakening layer.
//
// Root problem: Stockfish "Skill Level 0" is still ~1100-1350 Elo and always
// plays its single best move, so "Trainer Level 1" found clean tactics/mates.
// This module wraps the engine's chosen move and, for low levels, frequently
// substitutes a plausible weaker move and lets the bot overlook short mates —
// without ever making an illegal move. chess.js stays the rules authority.

export type BotStyle = 'gentle' | 'standard';
export const BOT_STYLE_KEY = 'gm-bot-style';

export type BotDifficultyProfile = {
  id: string;
  /** Probability of playing a plausible non-engine move instead of the best. */
  randomMoveChance: number;
  /** If the best move is an immediate mate, chance the bot actually plays it. */
  tacticalConversionChance: number;
  /** When true, the bot can overlook short tactics (low levels only). */
  mercyEnabled: boolean;
};

// Keyed by bot level id (see lib/trainingData.ts). Ordered weakest -> strongest.
const PROFILES: Record<string, BotDifficultyProfile> = {
  'street-400': { id: 'street-400', randomMoveChance: 0.55, tacticalConversionChance: 0.15, mercyEnabled: true },
  'learner-800': { id: 'learner-800', randomMoveChance: 0.35, tacticalConversionChance: 0.4, mercyEnabled: true },
  'club-1200': { id: 'club-1200', randomMoveChance: 0.16, tacticalConversionChance: 0.75, mercyEnabled: false },
  'expert-2000': { id: 'expert-2000', randomMoveChance: 0.05, tacticalConversionChance: 1, mercyEnabled: false },
};

const STRONG_PROFILE: BotDifficultyProfile = {
  id: 'strong',
  randomMoveChance: 0,
  tacticalConversionChance: 1,
  mercyEnabled: false,
};

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

export function getDifficultyProfile(level: BotLevel, style: BotStyle = 'standard'): BotDifficultyProfile {
  const base = PROFILES[level.id] ?? STRONG_PROFILE;
  if (style === 'gentle' && base.mercyEnabled !== undefined) {
    // Gentle nudges low/mid levels to miss more; the strongest levels are
    // already deterministic and stay that way.
    if (base.randomMoveChance > 0) {
      return {
        ...base,
        randomMoveChance: Math.min(0.8, base.randomMoveChance + 0.15),
        tacticalConversionChance: Math.max(0.1, base.tacticalConversionChance - 0.15),
        mercyEnabled: true,
      };
    }
  }
  return base;
}

function uci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

function isMateMove(fen: string, move: Move): boolean {
  const probe = new Chess(fen);
  try {
    probe.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' });
  } catch {
    return false;
  }
  return probe.isCheckmate();
}

/** True if, after `move`, the moved piece sits where a strictly cheaper enemy
 * piece can capture it — a crude "don't hang material for free" filter so the
 * weakened bot avoids absurd self-sacrifices while still making human errors. */
function hangsMovedPiece(fen: string, move: Move): boolean {
  const probe = new Chess(fen);
  let made: Move | null = null;
  try {
    made = probe.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' });
  } catch {
    return false;
  }
  if (!made) return false;
  const movedValue = PIECE_VALUES[made.promotion ?? made.piece] ?? 0;
  return probe
    .moves({ verbose: true })
    .some((reply) => reply.to === made!.to && (PIECE_VALUES[reply.piece] ?? 0) < movedValue);
}

function pickPlausible(fen: string, moves: Move[], rng: () => number): Move {
  const safe = moves.filter((m) => !hangsMovedPiece(fen, m));
  const pool = safe.length > 0 ? safe : moves;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Given the engine's preferred move (UCI), return the move the (possibly
 * weakened) bot actually plays. Always legal. Deterministic for a given `rng`.
 */
export function chooseWeakenedMove(
  fen: string,
  level: BotLevel,
  engineBestUci: string | null,
  opts: { rng?: () => number; style?: BotStyle } = {},
): string | null {
  const rng = opts.rng ?? Math.random;
  const profile = getDifficultyProfile(level, opts.style ?? 'standard');
  const game = new Chess(fen);
  const legal = game.moves({ verbose: true }) as Move[];
  if (legal.length === 0) return null;
  if (legal.length === 1) return uci(legal[0]); // only move — always played, even if mate

  const bestMove = legal.find((m) => uci(m) === engineBestUci) ?? legal[0];

  // Mercy: sometimes overlook an immediate mate at low levels.
  if (profile.mercyEnabled && isMateMove(fen, bestMove)) {
    if (rng() > profile.tacticalConversionChance) {
      const nonMating = legal.filter((m) => !isMateMove(fen, m));
      if (nonMating.length > 0) return uci(pickPlausible(fen, nonMating, rng));
    }
  }

  // Frequently play a plausible non-best move at low levels.
  if (rng() < profile.randomMoveChance) {
    return uci(pickPlausible(fen, legal, rng));
  }

  return uci(bestMove);
}

/** Small seeded PRNG so tests can reproduce decisions. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getBotStyle(): BotStyle {
  if (typeof window === 'undefined') return 'gentle';
  try {
    return window.localStorage.getItem(BOT_STYLE_KEY) === 'standard' ? 'standard' : 'gentle';
  } catch {
    return 'gentle';
  }
}
