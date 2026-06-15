import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { tryPuzzleMove } from '../lib/puzzles/attempt';

const fen = new Chess().fen();

describe('puzzle attempts', () => {
  it('rejects and undoes a wrong legal move without an opponent reply', () => {
    expect(tryPuzzleMove(fen, 'e2e4', 'd2', 'd4')).toMatchObject({
      status: 'incorrect', fen, shouldReply: false,
    });
  });

  it('allows a correct retry from the unchanged position', () => {
    const wrong = tryPuzzleMove(fen, 'e2e4', 'd2', 'd4');
    expect(tryPuzzleMove(wrong.fen, 'e2e4', 'e2', 'e4').status).toBe('correct');
  });

  it('keeps illegal moves at the starting FEN', () => {
    expect(tryPuzzleMove(fen, 'e2e4', 'e2', 'e5')).toMatchObject({
      status: 'illegal', fen, shouldReply: false,
    });
  });
});
