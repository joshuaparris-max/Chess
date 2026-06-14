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

export function validateGameData(moves: unknown, moveCount: unknown): ValidationResult {
  if (!Array.isArray(moves) || !moves.every(move => typeof move === 'string')) {
    return { valid: false, error: 'Invalid moves.' };
  }
  if (!Number.isInteger(moveCount) || (moveCount as number) < 0) {
    return { valid: false, error: 'Invalid move count.' };
  }
  if (moves.length > MAX_MOVES) {
    return { valid: false, error: `Game is too long (max ${MAX_MOVES} half-moves).` };
  }
  if ((moveCount as number) > MAX_MOVES) {
    return { valid: false, error: `Move count exceeds limit.` };
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
