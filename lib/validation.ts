/**
 * Validation helpers for game-review API requests.
 * Protects against oversized payloads and helps maintain reasonable API usage.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_MOVES = 300; // half-moves
const MAX_QUESTION_LENGTH = 1000;
const MAX_MOVE_STRING_LENGTH = 10000; // total moves as string
const MAX_JSON_SIZE = 100000; // bytes

const VALID_PLAYER_COLORS = ['white', 'black'] as const;
const VALID_GAME_RESULTS = ['win', 'loss', 'draw', 'stalemate', 'resignation', 'checkmate'] as const;
const VALID_OPPONENT_TYPES = ['bot', 'human'] as const;

export function validateGameData(gameData: unknown): ValidationResult {
  if (!gameData || typeof gameData !== 'object') {
    return { valid: false, error: 'Invalid game data.' };
  }

  const data = gameData as Record<string, unknown>;
  const moves = data.moves;
  const moveCount = data.moveCount;
  const playerColor = data.playerColor;
  const result = data.result;
  const opponentType = data.opponentType;
  const botLevel = data.botLevel;
  const finalFEN = data.finalFEN;
  const finalMove = data.finalMove;
  const isCheckmate = data.isCheckmate;
  const winner = data.winner;
  const sideToMoveAfterGame = data.sideToMoveAfterGame;
  const endBy = data.endBy;

  if (!Array.isArray(moves) || !moves.every(move => typeof move === 'string')) {
    return { valid: false, error: 'Invalid moves.' };
  }
  if (typeof moveCount !== 'number' || !Number.isInteger(moveCount) || moveCount < 0) {
    return { valid: false, error: 'Invalid move count.' };
  }
  if (moves.length > MAX_MOVES) {
    return { valid: false, error: `Game is too long (max ${MAX_MOVES} half-moves).` };
  }
  if (moveCount > MAX_MOVES) {
    return { valid: false, error: `Move count exceeds limit.` };
  }
  if (moveCount !== moves.length) {
    return { valid: false, error: 'Move count does not match number of moves.' };
  }
  if (!VALID_PLAYER_COLORS.includes(playerColor as any)) {
    return { valid: false, error: 'Invalid player color.' };
  }
  if (!VALID_GAME_RESULTS.includes(result as any)) {
    return { valid: false, error: 'Invalid game result.' };
  }
  if (opponentType !== undefined && !VALID_OPPONENT_TYPES.includes(opponentType as any)) {
    return { valid: false, error: 'Invalid opponent type.' };
  }
  if (botLevel !== undefined && typeof botLevel !== 'number') {
    return { valid: false, error: 'Invalid bot level.' };
  }
  if (finalFEN !== undefined && typeof finalFEN !== 'string') {
    return { valid: false, error: 'Invalid final FEN.' };
  }
  if (finalMove !== undefined && typeof finalMove !== 'string') {
    return { valid: false, error: 'Invalid final move.' };
  }
  if (isCheckmate !== undefined && typeof isCheckmate !== 'boolean') {
    return { valid: false, error: 'Invalid isCheckmate value.' };
  }
  if (winner !== undefined && winner !== null && winner !== 'white' && winner !== 'black') {
    return { valid: false, error: 'Invalid winner.' };
  }
  if (sideToMoveAfterGame !== undefined && sideToMoveAfterGame !== 'white' && sideToMoveAfterGame !== 'black') {
    return { valid: false, error: 'Invalid side to move after game.' };
  }
  if (endBy !== undefined && typeof endBy !== 'string') {
    return { valid: false, error: 'Invalid end method.' };
  }

  const movesStr = moves.join(' ');
  if (movesStr.length > MAX_MOVE_STRING_LENGTH) {
    return { valid: false, error: 'Game data is too large.' };
  }
  return { valid: true };
}

export function validateQuestion(question: unknown): ValidationResult {
  if (!question || typeof question !== 'string') {
    return { valid: false, error: 'Please ask a question.' };
  }
  if (question.trim().length === 0) {
    return { valid: false, error: 'Please ask a question.' };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question is too long (max ${MAX_QUESTION_LENGTH} characters).` };
  }
  return { valid: true };
}

export function validateRequestSize(data: unknown): ValidationResult {
  try {
    const jsonStr = JSON.stringify(data);
    if (!jsonStr || jsonStr.length > MAX_JSON_SIZE) {
      return { valid: false, error: 'Request is too large.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid request.' };
  }
}
