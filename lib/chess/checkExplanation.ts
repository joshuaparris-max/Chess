import { Chess } from 'chess.js';

// Explains checks and checkmates using a board-attack scan, so the coach can say
// *why* a position is mate (e.g. double check) and *why* a move is illegal.
// chess.js remains the source of truth for the game result; this only describes
// what it already determined.

export type CheckingPiece = { type: string; square: string; color: 'w' | 'b' };
type Color = 'w' | 'b';
type Piece = { type: string; color: Color };
type Grid = Record<string, Piece>;

const FILES = 'abcdefgh';
const PIECE_NAMES: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

function fileRank(square: string): [number, number] {
  return [FILES.indexOf(square[0]), Number(square[1]) - 1];
}

function squareName(file: number, rank: number): string {
  return `${FILES[file]}${rank + 1}`;
}

function buildGrid(game: Chess): Grid {
  const grid: Grid = {};
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell) grid[cell.square] = { type: cell.type, color: cell.color };
    }
  }
  return grid;
}

function findKing(grid: Grid, color: Color): string | null {
  for (const [square, piece] of Object.entries(grid)) {
    if (piece.type === 'k' && piece.color === color) return square;
  }
  return null;
}

/** All pieces of `byColor` that attack `target` on the given board grid. */
function attackersOf(grid: Grid, target: string, byColor: Color): CheckingPiece[] {
  const [tf, tr] = fileRank(target);
  const result: CheckingPiece[] = [];

  for (const [square, piece] of Object.entries(grid)) {
    if (piece.color !== byColor) continue;
    const [pf, pr] = fileRank(square);
    const df = tf - pf;
    const dr = tr - pr;
    if (df === 0 && dr === 0) continue;

    let attacks = false;
    if (piece.type === 'n') {
      attacks = (Math.abs(df) === 1 && Math.abs(dr) === 2) || (Math.abs(df) === 2 && Math.abs(dr) === 1);
    } else if (piece.type === 'k') {
      attacks = Math.max(Math.abs(df), Math.abs(dr)) === 1;
    } else if (piece.type === 'p') {
      const dir = piece.color === 'w' ? 1 : -1;
      attacks = dr === dir && Math.abs(df) === 1;
    } else {
      const diagonal = Math.abs(df) === Math.abs(dr);
      const orthogonal = (df === 0) !== (dr === 0);
      const lineOk =
        (piece.type === 'b' && diagonal) ||
        (piece.type === 'r' && orthogonal) ||
        (piece.type === 'q' && (diagonal || orthogonal));
      if (lineOk) {
        const stepF = Math.sign(df);
        const stepR = Math.sign(dr);
        let cf = pf + stepF;
        let cr = pr + stepR;
        let blocked = false;
        while (cf !== tf || cr !== tr) {
          if (grid[squareName(cf, cr)]) {
            blocked = true;
            break;
          }
          cf += stepF;
          cr += stepR;
        }
        attacks = !blocked;
      }
    }

    if (attacks) result.push({ type: piece.type, square, color: piece.color });
  }

  return result;
}

/** Pieces currently checking the side-to-move's king. */
export function getCheckingPieces(game: Chess): CheckingPiece[] {
  const grid = buildGrid(game);
  const turn = game.turn() as Color;
  const kingSquare = findKing(grid, turn);
  if (!kingSquare) return [];
  return attackersOf(grid, kingSquare, turn === 'w' ? 'b' : 'w');
}

export function isDoubleCheck(game: Chess): boolean {
  return getCheckingPieces(game).length >= 2;
}

function listCheckers(checkers: CheckingPiece[]): string {
  return checkers.map((c) => `${PIECE_NAMES[c.type]} on ${c.square}`).join(' and the ');
}

/**
 * A beginner-friendly explanation of why the current position is checkmate.
 * Assumes game.isCheckmate() is already true (verify with chess.js first).
 */
export function buildCheckmateExplanation(game: Chess): string {
  const checkers = getCheckingPieces(game);
  const grid = buildGrid(game);
  const turn = game.turn() as Color;
  const kingSquare = findKing(grid, turn) ?? 'its square';

  if (checkers.length >= 2) {
    return `Double check — the ${listCheckers(checkers)} are both attacking the king on ${kingSquare}. In a double check you cannot stop both attackers by blocking or capturing, so the king must move — and here it has no safe square. Checkmate.`;
  }
  if (checkers.length === 1) {
    const c = checkers[0];
    return `The ${PIECE_NAMES[c.type]} on ${c.square} attacks the king on ${kingSquare}, and there is no way to capture it, block the check, or move the king to safety. Checkmate.`;
  }
  return 'Checkmate — the king is attacked and has no legal escape.';
}

function roughSan(piece: Piece, capture: boolean, to: string): string {
  const letter = piece.type === 'p' ? (capture ? `${to[0]}` : '') : piece.type.toUpperCase();
  return `${letter}${capture ? 'x' : ''}${to}`;
}

/**
 * If the move from->to is illegal because it leaves the mover's king in check,
 * return a specific explanation naming the attacker that still gives check.
 * Returns null when the move is actually legal.
 */
export function explainRejectedMove(game: Chess, from: string, to: string): string | null {
  const probe = new Chess(game.fen());
  try {
    if (probe.move({ from, to, promotion: 'q' })) return null; // legal — nothing to explain
  } catch {
    // illegal — fall through and explain
  }

  const grid = buildGrid(game);
  const moving = grid[from];
  const mover = game.turn() as Color;
  if (!moving || moving.color !== mover) return 'That move is not legal here.';

  // Apply the move on a hypothetical grid (allowing the otherwise-illegal move).
  const captured = Boolean(grid[to]);
  const hypothetical: Grid = { ...grid };
  delete hypothetical[from];
  hypothetical[to] = moving;

  const kingSquare = moving.type === 'k' ? to : findKing(hypothetical, mover);
  if (!kingSquare) return 'That move is not legal here.';

  const remaining = attackersOf(hypothetical, kingSquare, mover === 'w' ? 'b' : 'w');
  if (remaining.length === 0) return 'That move is not legal here.';

  const san = roughSan(moving, captured, to);
  const c = remaining[0];
  return `${san} cannot be played because your king would still be in check from the ${PIECE_NAMES[c.type]} on ${c.square}.`;
}
