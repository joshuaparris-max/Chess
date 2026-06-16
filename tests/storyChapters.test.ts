import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { chapters } from '../lib/story/chapters';

describe('Story Mode chapters', () => {
  it('has three chapters with sequential ids', () => {
    expect(chapters.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('every chapter solution is a legal move from its FEN', () => {
    for (const chapter of chapters) {
      const game = new Chess(chapter.fen);
      const legal = game
        .moves({ verbose: true })
        .some((m) => m.from === chapter.solutionMove.from && m.to === chapter.solutionMove.to);
      expect(legal, `Chapter ${chapter.id} solution ${chapter.solutionMove.from}-${chapter.solutionMove.to} must be legal`).toBe(true);
    }
  });

  it('the final chapter solution delivers a real checkmate', () => {
    const finale = chapters[chapters.length - 1];
    const game = new Chess(finale.fen);
    game.move({ from: finale.solutionMove.from, to: finale.solutionMove.to, promotion: 'q' });
    expect(game.isCheckmate()).toBe(true);
  });

  it('never asks the player to capture a king', () => {
    for (const chapter of chapters) {
      const game = new Chess(chapter.fen);
      const target = game.get(chapter.solutionMove.to as Parameters<typeof game.get>[0]);
      expect(target?.type, `Chapter ${chapter.id} should not target a king`).not.toBe('k');
    }
  });
});
