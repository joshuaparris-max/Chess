import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';

describe('critical chess rules', () => {
  it('handles kingside castling', () => {
    const game = new Chess();
    ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'O-O'].forEach((move) => game.move(move));
    expect(game.get('g1')?.type).toBe('k');
    expect(game.get('f1')?.type).toBe('r');
  });

  it('handles en passant', () => {
    const game = new Chess();
    ['e4', 'a6', 'e5', 'd5', 'exd6'].forEach((move) => game.move(move));
    expect(game.get('d6')?.type).toBe('p');
    expect(game.get('d5')).toBeUndefined();
  });

  it('supports underpromotion', () => {
    const game = new Chess('8/P7/8/8/8/8/7k/5K2 w - - 0 1');
    game.move({ from: 'a7', to: 'a8', promotion: 'n' });
    expect(game.get('a8')?.type).toBe('n');
  });

  it('detects threefold repetition', () => {
    const game = new Chess();
    ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'].forEach((move) => game.move(move));
    expect(game.isThreefoldRepetition()).toBe(true);
  });
});
