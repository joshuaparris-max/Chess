import { Chess, type Square } from 'chess.js';

export function tryPuzzleMove(fen: string, expected: string, from: Square, to: Square) {
  const game = new Chess(fen);
  const beforeFen = game.fen();
  try {
    const move = game.move({ from, to, promotion: 'q' });
    if (!move) return { status: 'illegal' as const, fen: beforeFen, shouldReply: false };
    const attempted = `${from}${to}`;
    if (![attempted, `${attempted}q`, `${attempted}n`].includes(expected)) {
      return { status: 'incorrect' as const, fen: beforeFen, shouldReply: false };
    }
    return { status: 'correct' as const, fen: game.fen(), move, shouldReply: true };
  } catch {
    return { status: 'illegal' as const, fen: beforeFen, shouldReply: false };
  }
}
