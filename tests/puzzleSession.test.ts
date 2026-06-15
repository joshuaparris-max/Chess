import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import {
  createSession,
  puzzleReducer,
  isPlayerTurn,
  PUZZLE_CONTROLS_CLASS,
  type PuzzleLike,
} from '../lib/puzzles/session';

const START = new Chess().fen();

// A simple multi-move puzzle on the opening position:
// player e4, opponent e5, player Nf3.  (Legal sequence; lets us exercise opponent replies.)
const localPuzzle: PuzzleLike = {
  id: 'local-1',
  fen: START,
  sideToMove: 'w',
  solution: ['e2e4', 'e7e5', 'g1f3'],
};

const dailyPuzzle: PuzzleLike = { id: 'lichess-daily', fen: START, sideToMove: 'w', solution: ['e2e4', 'e7e5', 'g1f3'] };
const archivePuzzle: PuzzleLike = { id: 'lichess-archive', fen: START, sideToMove: 'w', solution: ['e2e4'] };
const randomPuzzleA: PuzzleLike = { id: 'lichess-rand-a', fen: START, sideToMove: 'w', solution: ['e2e4'] };
const randomPuzzleB: PuzzleLike = { id: 'lichess-rand-b', fen: START, sideToMove: 'w', solution: ['d2d4'] };

const wrong = (s: ReturnType<typeof createSession>) => puzzleReducer(s, { type: 'ATTEMPT', from: 'd2', to: 'd4' });
const correctFirst = (s: ReturnType<typeof createSession>) => puzzleReducer(s, { type: 'ATTEMPT', from: 'e2', to: 'e4' });

describe('puzzle session — retry behaviour', () => {
  it('1. rejects a wrong but legal move', () => {
    const s = wrong(createSession(localPuzzle));
    expect(s.feedback).toBe('incorrect');
    expect(s.status).toBe('active');
  });

  it('2. undoes the wrong move — board stays at the starting FEN', () => {
    const s = wrong(createSession(localPuzzle));
    expect(s.fen).toBe(START);
    expect(s.step).toBe(0);
  });

  it('3. keeps the same puzzle loaded after a wrong move', () => {
    const before = createSession(localPuzzle);
    const after = wrong(before);
    expect(after.puzzleId).toBe(before.puzzleId);
    expect(after.solution).toEqual(before.solution);
  });

  it('4. lets the user retry and then solve correctly', () => {
    let s = createSession(localPuzzle);
    s = wrong(s);               // miss
    expect(s.status).toBe('active');
    s = correctFirst(s);        // e4
    expect(s.feedback).toBe('continue');
    s = puzzleReducer(s, { type: 'OPPONENT_REPLY' });  // e5
    s = puzzleReducer(s, { type: 'ATTEMPT', from: 'g1', to: 'f3' }); // Nf3
    expect(s.status).toBe('solved');
    expect(s.feedback).toBe('solved');
  });

  it('5. increments the attempt count on each wrong move', () => {
    let s = createSession(localPuzzle);
    expect(s.attempts).toBe(0);
    s = wrong(s);
    expect(s.attempts).toBe(1);
    s = wrong(s);
    expect(s.attempts).toBe(2);
  });

  it('6. does not play an opponent reply after a wrong move', () => {
    const s = wrong(createSession(localPuzzle));
    expect(s.awaitingReply).toBe(false);
    // an OPPONENT_REPLY dispatch must be a no-op while not awaiting
    const after = puzzleReducer(s, { type: 'OPPONENT_REPLY' });
    expect(after.fen).toBe(START);
    expect(after.step).toBe(0);
  });

  it('7. RESET restores the starting FEN, step 0, unsolved, no hints', () => {
    let s = createSession(localPuzzle);
    s = correctFirst(s);
    s = puzzleReducer(s, { type: 'SET_HINT', level: 3 });
    s = puzzleReducer(s, { type: 'RESET' });
    expect(s.fen).toBe(START);
    expect(s.step).toBe(0);
    expect(s.status).toBe('active');
    expect(s.awaitingReply).toBe(false);
    expect(s.hintLevel).toBe(0);
    expect(s.feedback).toBe('idle');
  });

  it('8. daily puzzle does not change after a failure', () => {
    const before = createSession(dailyPuzzle);
    const after = wrong(before);
    expect(after.puzzleId).toBe('lichess-daily');
    expect(after.solution).toEqual(dailyPuzzle.solution);
    expect(after.fen).toBe(before.fen);
  });

  it('9. archive puzzle does not change after a failure', () => {
    const before = createSession(archivePuzzle);
    const after = wrong(before);
    expect(after.puzzleId).toBe('lichess-archive');
    expect(after.fen).toBe(before.fen);
  });

  it('10. a random puzzle only changes when a new one is explicitly loaded', () => {
    let s = createSession(randomPuzzleA);
    s = wrong(s);                                   // failure: unchanged
    expect(s.puzzleId).toBe('lichess-rand-a');
    s = puzzleReducer(s, { type: 'RESET' });        // reset: unchanged
    expect(s.puzzleId).toBe('lichess-rand-a');
    s = puzzleReducer(s, { type: 'LOAD', puzzle: randomPuzzleB }); // "Get another puzzle"
    expect(s.puzzleId).toBe('lichess-rand-b');
  });

  it('11. hints remain available after a mistake', () => {
    let s = wrong(createSession(localPuzzle));
    expect(s.status).toBe('active');               // hints render whenever status is active
    s = puzzleReducer(s, { type: 'SET_HINT', level: 2 });
    expect(s.hintLevel).toBe(2);
  });

  it('12. loading a new puzzle (tab switch) clears failure state', () => {
    let s = createSession(localPuzzle);
    s = wrong(s);
    s = puzzleReducer(s, { type: 'SET_HINT', level: 3 });
    s = puzzleReducer(s, { type: 'LOAD', puzzle: dailyPuzzle });
    expect(s.feedback).toBe('idle');
    expect(s.attempts).toBe(0);
    expect(s.status).toBe('active');
    expect(s.awaitingReply).toBe(false);
    expect(s.hintLevel).toBe(0);
  });

  it('13. controls layout stacks on mobile and has no fixed widths (no overflow)', () => {
    expect(PUZZLE_CONTROLS_CLASS).toContain('grid-cols-1'); // single column on small screens
    expect(PUZZLE_CONTROLS_CLASS).toMatch(/sm:flex/);       // row only from sm: up
    expect(PUZZLE_CONTROLS_CLASS).not.toMatch(/\bw-\[/);    // no hardcoded pixel widths
    expect(PUZZLE_CONTROLS_CLASS).not.toMatch(/\bw-\d/);    // no fixed tailwind widths
  });

  it('illegal moves are rejected without counting as an attempt', () => {
    const s = puzzleReducer(createSession(localPuzzle), { type: 'ATTEMPT', from: 'e2', to: 'e5' });
    expect(s.feedback).toBe('illegal');
    expect(s.attempts).toBe(0);
    expect(s.fen).toBe(START);
  });

  it('ignores input while awaiting the opponent reply', () => {
    let s = correctFirst(createSession(localPuzzle)); // awaitingReply = true
    expect(isPlayerTurn(s)).toBe(false);
    const blocked = puzzleReducer(s, { type: 'ATTEMPT', from: 'g1', to: 'f3' });
    expect(blocked.step).toBe(s.step); // unchanged
  });
});
