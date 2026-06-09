import { Chess } from 'chess.js';
import type { GameData } from './gameReviewTypes';

type VerboseMove = ReturnType<Chess['history']>[number] & {
  san?: string;
  lan?: string;
  piece?: string;
  promotion?: string;
  color?: string;
};

const pieceNames: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

function colorName(color?: string) {
  return color === 'w' ? 'White' : color === 'b' ? 'Black' : 'unknown';
}

function pieceName(piece?: string) {
  return piece ? pieceNames[piece] || piece : 'piece';
}

function replayGame(gameData: GameData) {
  const chess = new Chess();
  let appliedMoves = 0;

  if (gameData.moves?.length) {
    for (const move of gameData.moves) {
      try {
        chess.move(move);
        appliedMoves += 1;
      } catch {
        break;
      }
    }
  } else if (gameData.finalFEN) {
    chess.load(gameData.finalFEN);
  }

  return { chess, appliedMoves };
}

export function buildGameSpecificFacts(gameData: GameData) {
  const { chess, appliedMoves } = replayGame(gameData);
  const history = chess.history({ verbose: true }) as VerboseMove[];
  const lastMove = history[history.length - 1];
  const finalMove = lastMove?.san || gameData.finalMove || gameData.moves?.[gameData.moves.length - 1] || 'unknown';
  const sideToMove = chess.turn();
  const sideToMoveName = colorName(sideToMove);
  const winner = chess.isCheckmate() ? (sideToMove === 'w' ? 'Black' : 'White') : gameData.winner || 'none';
  const movedPiece = pieceName(lastMove?.piece);
  const promotedPiece = lastMove?.promotion ? pieceName(lastMove.promotion) : '';
  const finalMoveIsPromotion = Boolean(lastMove?.promotion || /=/.test(finalMove));

  let mainTheme = 'converting the final position into a clear result';
  if (chess.isCheckmate() && finalMoveIsPromotion) {
    mainTheme = `promotion checkmate: ${finalMove} promoted a pawn${promotedPiece ? ` to a ${promotedPiece}` : ''} and ended the game`;
  } else if (chess.isCheckmate()) {
    mainTheme = `checkmate: ${finalMove} used the ${movedPiece} to end the game`;
  } else if (chess.isDraw()) {
    mainTheme = 'the game ended in a draw, so the main lesson is avoiding lost winning chances';
  }

  const checkmateFact = chess.isCheckmate()
    ? [
        'Confirmed by chess.js: The game ended by checkmate.',
        `Final move: ${finalMove}.`,
        `Winner: ${winner}.`,
        `The side to move after the final move is ${sideToMoveName}, so ${sideToMoveName} is checkmated.`,
        `The ${sideToMoveName} king is under attack and has no legal move.`,
        'In checkmate, the defender cannot move the king to safety, capture the attacking piece, or block the attack.',
      ].join(' ')
    : '';

  const factBlock = [
    'Game-specific facts from chess.js:',
    `Applied legal moves: ${appliedMoves}.`,
    `Final move: ${finalMove}.`,
    `Final moved piece: ${movedPiece}.`,
    finalMoveIsPromotion ? `Promotion: yes${promotedPiece ? `, to a ${promotedPiece}` : ''}.` : 'Promotion: no.',
    `Main winning theme: ${mainTheme}.`,
    checkmateFact,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    factBlock,
    checkmateFact,
    finalMove,
    mainTheme,
  };
}

export function isCheckmateQuestion(question: string) {
  return /\b(why|how|what).*(checkmate|mate|won|win)\b/i.test(question) || /\b(checkmate|mate)\b/i.test(question);
}

export function isImprovementQuestion(question: string) {
  return /\b(improve|better|practice|work on|mistake|advice|specifically)\b/i.test(question);
}
