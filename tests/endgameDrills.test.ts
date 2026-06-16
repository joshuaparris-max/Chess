import { describe, expect, it } from 'vitest';
import {
  endgameDrills,
  normaliseEndgameProgress,
  recordEndgameAttempt,
  tryEndgameMove,
} from '@/lib/endgames/drills';
import { Chess, type Color, type Square } from 'chess.js';

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

describe('endgame drills', () => {
  it('starts from legal drill positions where the waiting king is not already in check', () => {
    endgameDrills.forEach((drill) => {
      const game = new Chess(drill.fen);
      const sideToMove = game.turn();
      const waitingSide = sideToMove === 'w' ? 'b' : 'w';
      const waitingKing = findKing(game, waitingSide);

      expect(waitingKing, drill.id).toBeDefined();
      expect(game.isAttacked(waitingKing!, sideToMove), drill.id).toBe(false);
    });
  });

  it('has legal intended first moves for every drill', () => {
    endgameDrills.forEach((drill) => {
      const move = drill.solution[0];
      const result = tryEndgameMove(drill, drill.fen, 0, move.slice(0, 2), move.slice(2, 4));
      expect(result.status, drill.id).toBe('correct');
    });
  });

  it('rejects legal moves that miss the drill idea', () => {
    const drill = endgameDrills.find((item) => item.id === 'king-box');
    expect(drill).toBeDefined();
    const result = tryEndgameMove(drill!, drill!.fen, 0, 'g2', 'a2');
    expect(result.status).toBe('incorrect');
  });

  it('rejects illegal moves without changing drill state', () => {
    const drill = endgameDrills[0];
    const result = tryEndgameMove(drill, drill.fen, 0, 'g2', 'g1');
    expect(result.status).toBe('illegal');
  });

  it('normalises corrupt progress safely', () => {
    const progress = normaliseEndgameProgress({
      completedIds: ['king-box', 'king-box', 42],
      attemptsById: { 'king-box': 2.7, broken: -1 },
    });
    expect(progress.completedIds).toEqual(['king-box']);
    expect(progress.attemptsById['king-box']).toBe(2);
    expect(progress.attemptsById.broken).toBe(0);
  });

  it('records attempts without duplicating completed drills', () => {
    const first = recordEndgameAttempt({ completedIds: [], attemptsById: {} }, 'king-box', true);
    const second = recordEndgameAttempt(first, 'king-box', true);
    expect(second.completedIds).toEqual(['king-box']);
    expect(second.attemptsById['king-box']).toBe(2);
  });
});
