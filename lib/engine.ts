import { Chess, type Move } from 'chess.js';
import type { BotLevel } from './types';

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const CENTER_SQUARES = new Set(['d4', 'e4', 'd5', 'e5']);
const NEAR_CENTER_SQUARES = new Set(['c3', 'd3', 'e3', 'f3', 'c4', 'f4', 'c5', 'f5', 'c6', 'd6', 'e6', 'f6']);

function terminalScore(game: Chess): number | null {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -100000 : 100000;
  }

  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return 0;
  }

  return null;
}

function squareBonus(square: string, pieceType: string, color: 'w' | 'b'): number {
  let score = 0;
  if (CENTER_SQUARES.has(square)) score += 18;
  if (NEAR_CENTER_SQUARES.has(square)) score += 8;

  const rank = Number(square[1]);
  if (pieceType === 'p') {
    score += color === 'w' ? (rank - 2) * 6 : (7 - rank) * 6;
  }

  if (pieceType === 'n' || pieceType === 'b') {
    if ((color === 'w' && rank > 1) || (color === 'b' && rank < 8)) score += 6;
  }

  return score;
}

function evaluate(game: Chess): number {
  const terminal = terminalScore(game);
  if (terminal !== null) return terminal;

  let score = 0;
  const board = game.board();

  for (let r = 0; r < board.length; r += 1) {
    for (let f = 0; f < board[r].length; f += 1) {
      const piece = board[r][f];
      if (!piece) continue;
      const square = `${'abcdefgh'[f]}${8 - r}`;
      const base = PIECE_VALUES[piece.type];
      const positional = squareBonus(square, piece.type, piece.color);
      score += piece.color === 'w' ? base + positional : -(base + positional);
    }
  }

  const turn = game.turn();
  const mobility = game.moves().length;
  score += turn === 'w' ? mobility * 2 : -mobility * 2;

  if (game.inCheck()) {
    score += turn === 'w' ? -40 : 40;
  }

  return score;
}

function orderedMoves(game: Chess): Move[] {
  const moves = game.moves({ verbose: true }) as Move[];
  return moves.sort((a, b) => {
    const aCapture = a.captured ? PIECE_VALUES[a.captured] : 0;
    const bCapture = b.captured ? PIECE_VALUES[b.captured] : 0;
    const aPromo = a.promotion ? PIECE_VALUES[a.promotion] : 0;
    const bPromo = b.promotion ? PIECE_VALUES[b.promotion] : 0;
    return bCapture + bPromo - (aCapture + aPromo);
  });
}

function search(game: Chess, depth: number, alpha: number, beta: number): number {
  const terminal = terminalScore(game);
  if (terminal !== null) return terminal;
  if (depth <= 0) return evaluate(game);

  const moves = orderedMoves(game);

  if (game.turn() === 'w') {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, search(game, depth - 1, alpha, beta));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    game.move(move);
    best = Math.min(best, search(game, depth - 1, alpha, beta));
    game.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function moveToUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function getBotMove(fen: string, level: BotLevel): string | null {
  const game = new Chess(fen);
  const moves = orderedMoves(game);
  if (moves.length === 0) return null;

  if (level.id === 'street-400' && Math.random() < 0.35) {
    return moveToUci(moves[Math.floor(Math.random() * moves.length)]);
  }

  const scored = moves.map((move) => {
    game.move(move);
    const raw = search(game, level.depth - 1, -Infinity, Infinity);
    game.undo();
    const noise = level.noise === 0 ? 0 : (Math.random() * 2 - 1) * level.noise;
    return { move, score: raw + noise };
  });

  scored.sort((a, b) => (game.turn() === 'w' ? b.score - a.score : a.score - b.score));

  if (Math.random() < level.blunderChance && scored.length > 2) {
    const start = Math.max(1, Math.floor(scored.length * 0.45));
    const end = Math.max(start + 1, Math.floor(scored.length * 0.85));
    const blunderPool = scored.slice(start, end);
    const pick = blunderPool[Math.floor(Math.random() * blunderPool.length)] ?? scored[scored.length - 1];
    return moveToUci(pick.move);
  }

  return moveToUci(scored[0].move);
}

export function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : 'q',
  };
}
