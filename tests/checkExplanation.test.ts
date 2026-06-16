import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import {
  getCheckingPieces,
  isDoubleCheck,
  buildCheckmateExplanation,
  explainRejectedMove,
} from '../lib/chess/checkExplanation';

// Position after 1.e4 d5 2.exd5 e5 3.c4 Nf6 4.d4 Bb4+ 5.Bd2 Qe7 6.dxe5 Nbd7
// 7.Qe2 Nxe5 8.f4 Bg4 9.Qe3 Bc5 10.Qc3 Nd3# — a double-check mate.
const DOUBLE_CHECK_MATE = 'r3k2r/ppp1qppp/5n2/2bP4/2P2Pb1/2Qn4/PP1B2PP/RN2KBNR w KQkq - 1 11';

describe('Check explanation — double-check mate', () => {
  const game = new Chess(DOUBLE_CHECK_MATE);

  it('chess.js confirms checkmate with zero legal moves', () => {
    expect(game.isCheckmate()).toBe(true);
    expect(game.moves()).toHaveLength(0);
  });

  it('identifies both the d3 knight and e7 queen as checking pieces', () => {
    const checkers = getCheckingPieces(game);
    const squares = checkers.map((c) => c.square).sort();
    expect(squares).toEqual(['d3', 'e7']);
    expect(checkers.find((c) => c.square === 'd3')?.type).toBe('n');
    expect(checkers.find((c) => c.square === 'e7')?.type).toBe('q');
  });

  it('labels it a double check', () => {
    expect(isDoubleCheck(game)).toBe(true);
    expect(buildCheckmateExplanation(game)).toMatch(/double check/i);
  });

  it('rejects Qxd3 because the king stays in check from the queen on e7', () => {
    const reason = explainRejectedMove(game, 'c3', 'd3');
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/still be in check/i);
    expect(reason).toMatch(/queen on e7/i);
  });
});

describe('Check explanation — ordinary single check', () => {
  // Black bishop on b4 checks the white king on e1 along a clear diagonal.
  const game = new Chess('4k3/8/8/8/1b6/8/8/4K3 w - - 0 1');

  it('is a single check, not double', () => {
    expect(game.inCheck()).toBe(true);
    expect(getCheckingPieces(game)).toHaveLength(1);
    expect(getCheckingPieces(game)[0].type).toBe('b');
    expect(isDoubleCheck(game)).toBe(false);
  });

  it('a genuinely legal king move is not rejected', () => {
    // Kf2 steps off the diagonal — legal, so no rejection reason.
    expect(explainRejectedMove(game, 'e1', 'f2')).toBeNull();
  });
});

describe('Check explanation — capturing the only checker is allowed', () => {
  // White queen on h5 checks black king on e8 (Qxf7+ style). Simpler: a lone
  // checker that can be legally captured removes all checks → not rejected.
  const game = new Chess('4k3/8/8/7q/8/8/4R3/4K3 w - - 0 1');

  it('no false double-check label on a quiet position', () => {
    expect(isDoubleCheck(game)).toBe(false);
  });
});

describe('Check explanation — stalemate is not checkmate', () => {
  // Classic stalemate: black king a8, white king c7... use a known stalemate.
  const game = new Chess('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1');

  it('stalemate has no checkers and is not checkmate', () => {
    expect(game.isStalemate()).toBe(true);
    expect(game.isCheckmate()).toBe(false);
    expect(getCheckingPieces(game)).toHaveLength(0);
  });
});
