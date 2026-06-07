import { GameData } from './gameReviewTypes';

function friendlyResultText(result: string) {
  if (result === 'win' || result === 'checkmate') return 'You won';
  if (result === 'loss') return 'You lost';
  if (result === 'draw' || result === 'stalemate') return 'The game was a draw';
  return `Result: ${result}`;
}

export function buildCoachPrompt(gameData: GameData, detail = false) {
  const system = `You are a calm, friendly, beginner chess coach. You are NOT White or Black. The user played White and the bot played Black. Refer to the human as "you" and the opponent as "the bot". Keep explanations simple, encouraging, and practical. Avoid technical jargon.

Return plain text only. Do not use Markdown headings, bold, tables, code blocks, or raw markers like "detail=true". Do not reveal raw FEN or PGN. If you mention any notation, explain it briefly in one short sentence.

Important: The user may ask questions about the game. Answer questions directly and concisely; do not repeat the full review when answering a specific question such as "Why was that checkmate?".`;

  const movesPreview = gameData.moves.slice(0, 200).join(' ');
  const finalMove = gameData.moves[gameData.moves.length - 1] || '';
  const endBy = gameData.endBy || '';

  const user = `Game context:
Player color: ${gameData.playerColor}
${friendlyResultText(gameData.result)}.
Number of moves: ${gameData.moveCount}.
Bot level: ${gameData.botLevel ?? 'unknown'}.
End method: ${endBy}.
Final move: ${finalMove}.
Final FEN provided: ${gameData.finalFEN ? 'yes' : 'no'}.

Move list (short): ${movesPreview}

Instructions: Provide a very short Quick Review (4–6 lines) with these small labeled sections: Result, Why you won/lost (one clear line), Best moment (one line), One thing to improve (one line), Next practice (one line). Do NOT include move-by-move detail in the Quick Review.

If detail mode is requested, produce a separate "Key moments" section (not more than 8–12 numbered items) highlighting critical turns, mistakes, and turning points. Each key moment should be 1–2 short sentences and include the move number or SAN. Keep language suitable for beginners.

When answering a direct user question (for example "Why was that checkmate?"), explain the final position: name the attacking piece, say why the king has no legal escape, explain that it cannot capture the attacker, block, or interpose, and use beginner language. Do not repeat the full review. Return plain text only.`;

  return { system, user };
}
