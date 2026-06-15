/**
 * Pure puzzle-session state machine, shared by every puzzle source
 * (Local, Daily/Lichess, Random/Lichess, Archive).
 *
 * It guarantees the training-friendly retry behaviour:
 *  - a wrong (but legal) move is rejected, the board is left exactly as it was,
 *    the attempt count increments, and NO opponent reply is played;
 *  - the same puzzle stays loaded — only an explicit LOAD/RESET changes it;
 *  - hints/reveal stay available after a mistake (status stays "active");
 *  - RESET returns to the starting FEN, step 0, unsolved, no selection/hints.
 *
 * Keeping this logic pure (no React, no DOM, no I/O) makes it unit-testable
 * and keeps the component a thin shell around it.
 */

import { Chess, type Square } from 'chess.js';
import { tryPuzzleMove } from './attempt';

export type PuzzleFeedback = 'idle' | 'illegal' | 'incorrect' | 'continue' | 'solved';

export interface PuzzleLike {
  id: string;
  fen: string;
  sideToMove: 'w' | 'b';
  solution: string[]; // even index = player move, odd index = opponent reply (UCI)
}

export interface PuzzleSession {
  puzzleId: string;
  startFen: string;
  fen: string;
  solution: string[];
  sideToMove: 'w' | 'b';
  step: number;
  status: 'active' | 'solved';
  attempts: number; // wrong attempts in this session
  feedback: PuzzleFeedback;
  awaitingReply: boolean;
  hintLevel: 0 | 1 | 2 | 3;
  lastMove: { from: string; to: string } | null;
}

export type PuzzleAction =
  | { type: 'LOAD'; puzzle: PuzzleLike }
  | { type: 'ATTEMPT'; from: string; to: string }
  | { type: 'OPPONENT_REPLY' }
  | { type: 'RESET' }
  | { type: 'SET_HINT'; level: 0 | 1 | 2 | 3 };

export function createSession(puzzle: PuzzleLike): PuzzleSession {
  return {
    puzzleId: puzzle.id,
    startFen: puzzle.fen,
    fen: puzzle.fen,
    solution: puzzle.solution,
    sideToMove: puzzle.sideToMove,
    step: 0,
    status: 'active',
    attempts: 0,
    feedback: 'idle',
    awaitingReply: false,
    hintLevel: 0,
    lastMove: null,
  };
}

/** True when it is the player's turn to move (even step, not waiting on the opponent). */
export function isPlayerTurn(s: PuzzleSession): boolean {
  return s.status === 'active' && !s.awaitingReply && s.step % 2 === 0;
}

function uciToMove(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci.length === 5 ? { promotion: uci[4] } : {}) };
}

export function puzzleReducer(state: PuzzleSession, action: PuzzleAction): PuzzleSession {
  switch (action.type) {
    case 'LOAD':
      return createSession(action.puzzle);

    case 'RESET':
      return {
        ...state,
        fen: state.startFen,
        step: 0,
        status: 'active',
        feedback: 'idle',
        awaitingReply: false,
        hintLevel: 0,
        lastMove: null,
        // attempts is a cumulative training stat; it is intentionally preserved.
      };

    case 'SET_HINT':
      return { ...state, hintLevel: action.level };

    case 'ATTEMPT': {
      // Never accept input when solved, mid opponent-reply, or out of turn.
      if (state.status === 'solved' || state.awaitingReply || state.step % 2 !== 0) return state;

      const expected = state.solution[state.step];
      const result = tryPuzzleMove(state.fen, expected, action.from as Square, action.to as Square);

      if (result.status === 'illegal') {
        // Board unchanged; not counted as a puzzle attempt.
        return { ...state, feedback: 'illegal' };
      }
      if (result.status === 'incorrect') {
        // Wrong but legal: reject, leave the board exactly as it was, count the attempt,
        // do NOT advance, do NOT play an opponent reply, do NOT mark solved.
        return { ...state, attempts: state.attempts + 1, feedback: 'incorrect' };
      }

      // Correct
      const nextStep = state.step + 1;
      const done = nextStep >= state.solution.length;
      return {
        ...state,
        fen: result.fen,
        lastMove: { from: result.move.from, to: result.move.to },
        step: nextStep,
        status: done ? 'solved' : 'active',
        awaitingReply: !done, // an opponent reply follows unless the line is finished
        feedback: done ? 'solved' : 'continue',
      };
    }

    case 'OPPONENT_REPLY': {
      if (!state.awaitingReply || state.step >= state.solution.length) return state;
      const replyUci = state.solution[state.step];
      const chess = new Chess(state.fen);
      let move;
      try {
        move = chess.move(uciToMove(replyUci));
      } catch {
        move = null;
      }
      if (!move) return { ...state, awaitingReply: false };

      const nextStep = state.step + 1;
      const done = nextStep >= state.solution.length;
      return {
        ...state,
        fen: chess.fen(),
        lastMove: { from: move.from, to: move.to },
        step: nextStep,
        status: done ? 'solved' : 'active',
        awaitingReply: false,
        feedback: done ? 'solved' : 'continue',
      };
    }

    default:
      return state;
  }
}

/**
 * Responsive class for the puzzle controls row. Stacks (single column) on small
 * screens and only becomes a wrapping flex row from `sm:` up, which — together with
 * the `min-w-0` board column — prevents horizontal overflow at 360–390px widths.
 */
export const PUZZLE_CONTROLS_CLASS = 'mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap';
