import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { buildGameSpecificFacts } from '../lib/gameReviewFacts';
import { validateGameData } from '../lib/validation';

describe('Game review facts', () => {
  it('extracts checkmate facts and a final move from a completed game', () => {
    const game = new Chess();
    const moves = ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'];
    moves.forEach((move) => game.move(move));

    const review = buildGameSpecificFacts({
      playerColor: 'white',
      opponentType: 'bot',
      result: 'win',
      moves,
      finalFEN: game.fen(),
      finalMove: 'Qxf7#',
      isCheckmate: true,
      winner: 'white',
      sideToMoveAfterGame: 'black',
      moveCount: moves.length,
      botLevel: 1200,
      endBy: 'checkmate',
    });

    expect(review.finalMove).toBe('Qxf7#');
    expect(review.mainTheme).toMatch(/checkmate/i);
    expect(review.factBlock).toContain('Confirmed by chess.js: The game ended by checkmate.');
    expect(review.factBlock).toContain('Final move: Qxf7#.');
  });

  it('falls back to finalFEN when moves fail to replay and still builds facts', () => {
    const game = new Chess('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3');
    const review = buildGameSpecificFacts({
      playerColor: 'white',
      opponentType: 'bot',
      result: 'draw',
      moves: ['e4', 'e5', 'Bc4', 'Nc6', 'Nf3', 'invalid-move'],
      finalFEN: game.fen(),
      moveCount: 6,
    });

    expect(review.finalMove).toBe('unknown');
    expect(review.factBlock).toContain('Game end method: draw.');
  });
});

describe('Game data validation', () => {
  it('rejects mismatched move count values', () => {
    const data = {
      playerColor: 'white',
      result: 'win',
      moves: ['e4', 'e5'],
      moveCount: 3,
      opponentType: 'bot',
    };

    const result = validateGameData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Move count does not match number of moves.');
  });

  it('accepts a valid game data object', () => {
    const data = {
      playerColor: 'black',
      result: 'loss',
      moves: ['d4', 'd5', 'c4'],
      moveCount: 3,
      opponentType: 'bot',
      botLevel: 800,
      finalFEN: 'rnbqkbnr/ppp2ppp/8/3pp3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 3',
      finalMove: 'c4',
      isCheckmate: false,
      winner: 'white',
      sideToMoveAfterGame: 'white',
      endBy: 'draw',
    };

    const result = validateGameData(data);
    expect(result.valid).toBe(true);
  });
});
