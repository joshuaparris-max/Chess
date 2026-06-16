import { describe, expect, it } from 'vitest';
import { Chess, type Color, type Square } from 'chess.js';
import { FAMILY_PUZZLES } from '@/lib/familyPuzzles';
import { endgameDrills } from '@/lib/endgames/drills';
import { puzzles as lessonPuzzles } from '@/lib/trainingData';
import { chapters } from '@/lib/story/chapters';

type PresetPosition = {
  id: string;
  fen: string;
  moves?: string[];
  move?: string;
};

function findKing(game: Chess, color: Color): Square | undefined {
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece?.type === 'k' && piece.color === color) {
        return piece.square;
      }
    }
  }

  return undefined;
}

function expectReachableSideToMovePosition(position: PresetPosition) {
  const game = new Chess(position.fen);
  const sideToMove = game.turn();
  const waitingSide = sideToMove === 'w' ? 'b' : 'w';
  const waitingKing = findKing(game, waitingSide);

  expect(waitingKing, position.id).toBeDefined();
  expect(game.isAttacked(waitingKing!, sideToMove), position.id).toBe(false);
}

function playUci(game: Chess, uci: string) {
  try {
    return game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
  } catch {
    return null;
  }
}

describe('preset chess positions', () => {
  const positions: PresetPosition[] = [
    ...FAMILY_PUZZLES.map((puzzle) => ({
      id: puzzle.id,
      fen: puzzle.fen,
      move: `${puzzle.from}${puzzle.to}${puzzle.isPromotion ? 'q' : ''}`,
    })),
    ...lessonPuzzles.map((puzzle) => ({
      id: puzzle.id,
      fen: puzzle.fen,
      moves: puzzle.solution,
    })),
    ...chapters.map((chapter) => ({
      id: `story-${chapter.id}`,
      fen: chapter.fen,
      move: `${chapter.solutionMove.from}${chapter.solutionMove.to}`,
    })),
    ...endgameDrills.map((drill) => ({
      id: drill.id,
      fen: drill.fen,
      moves: drill.solution,
    })),
  ];

  it('does not start with the non-moving king already in check', () => {
    positions.forEach(expectReachableSideToMovePosition);
  });

  it('has legal first moves from every preset', () => {
    positions.forEach((position) => {
      const game = new Chess(position.fen);
      const firstMove = position.move ?? position.moves?.[0];

      expect(firstMove, position.id).toBeDefined();
      expect(playUci(game, firstMove!), position.id).not.toBeNull();
    });
  });
});
