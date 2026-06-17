import { NextResponse } from 'next/server';
import type { GameData, ReviewRequest, ReviewResponse } from '../../../lib/gameReviewTypes';
import { buildCoachPrompt } from '../../../lib/gameReviewPrompts';
import { buildGameSpecificFacts } from '../../../lib/gameReviewFacts';
import { validateGameData, validateRequestSize } from '../../../lib/validation';
import { getClientIP, checkRateLimit } from '../../../lib/rateLimiter';
import { resilientFetch } from '../../../lib/groqResilience';

function normalizeAssistantText(content: string) {
  return content
    .replace(/\*\*/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/detail=true/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function hasRequiredReviewLabels(text: string) {
  return /(^|\n)Result:\s*.+/i.test(text) && /(^|\n)Final move:\s*.+/i.test(text) && /(^|\n)Main theme:\s*.+/i.test(text);
}

function buildFallbackReview(gameData: GameData, gameFacts: ReturnType<typeof buildGameSpecificFacts>) {
  const resultText =
    gameData.result === 'win' ? 'You won' :
    gameData.result === 'loss' ? 'You lost' :
    gameData.result === 'draw' || gameData.result === 'stalemate' ? 'The game was a draw' :
    `Result: ${gameData.result}`;

  const finalMove = gameFacts.finalMove || gameData.finalMove || (Array.isArray(gameData.moves) ? gameData.moves[gameData.moves.length - 1] : 'unknown') || 'unknown';
  const mainTheme = gameFacts.mainTheme || 'converting the final position into a clear result';

  const didWell =
    gameData.result === 'win'
      ? `You finished the game with ${finalMove}.`
      : gameData.result === 'loss'
      ? 'You kept fighting to the end and can learn from the final position.'
      : 'You reached a balanced result and can refine your final plans.';

  const improve =
    gameData.result === 'win'
      ? 'Practice spotting the finishing move sooner.'
      : gameData.result === 'loss'
      ? 'Watch the opponent’s threats and keep your king safe.'
      : 'Practice final position technique and basic endgame decisions.';

  const nextPractice =
    gameData.result === 'win'
      ? 'Practice similar basic tactics and mate patterns.'
      : gameData.result === 'loss'
      ? 'Practice simple tactics and safe king play.'
      : 'Practice endgame and drawing technique.';

  return `Result: ${resultText}.
Final move: ${finalMove}.
Main theme: ${mainTheme}.
Did well: ${didWell}
Improve: ${improve}
Next practice: ${nextPractice}`;
}

async function callGroq(messages: any[], key: string, model: string) {
  const res = await resilientFetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  return res;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'The AI coach is busy. Try again in a moment.' }, { status: 429 });
    }

    let body: Partial<ReviewRequest>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    if (!body.gameData) {
      return NextResponse.json({ error: 'Invalid game data.' }, { status: 400 });
    }

    // Validate request payload
    const gameValidation = validateGameData(body.gameData);
    if (!gameValidation.valid) {
      return NextResponse.json({ error: gameValidation.error }, { status: 400 });
    }

    const sizeValidation = validateRequestSize(body);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const keysRaw = process.env.GROQ_API_KEYS || '';
    const model = process.env.GROQ_MODEL;
    if (!keysRaw || !model) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }

    const keys = keysRaw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }

    const isDetailMode = !!body.detail;

    const gameFacts = buildGameSpecificFacts(body.gameData);
    const { system, user } = buildCoachPrompt(body.gameData, isDetailMode);
    const systemGuard =
      'Do not invent facts or contradict the supplied chess.js game result. Keep this review grounded in the provided game facts only, and answer questions directly if the user asks one.';
    const userContent = `${user}\n\n${gameFacts.factBlock}\n\nPrompt rule: Use the confirmed chess.js game result as ground truth. Do not contradict it. Quick Review must mention the final move and main winning theme.`;
    const messages = [
      { role: 'system' as const, content: `${systemGuard}\n\n${system}` },
      { role: 'user' as const, content: userContent },
    ];

    // Try keys in order
    let lastError: any = null;
    for (let i = 0; i < keys.length; i++) {
      try {
        const res = await callGroq(messages, keys[i], model);
        if (res.status === 401 || res.status === 429) {
          lastError = { status: res.status, index: i };
          console.log(`Groq key index ${i} failed with status ${res.status}; trying next key.`);
          continue; // try next key
        }
        if (!res.ok) {
          const txt = await res.text();
          lastError = { status: res.status, text: txt, index: i };
          console.log(`Groq key index ${i} failed with status ${res.status}`);
          continue;
        }

        const json = await res.json();
        // Extract text from OpenAI-compatible response
        let content = json?.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          console.log(`Groq key index ${i} returned unexpected response shape`);
          lastError = { status: 500, text: 'Unexpected response shape' };
          continue;
        }

        // Basic sanitization: strip Markdown markers and accidental debug tokens.
        content = normalizeAssistantText(content);

        if (isDetailMode) {
          const detailText = content.slice(0, 10000).trim();
          const response: ReviewResponse = { detail: detailText };
          return NextResponse.json(response);
        }

        const short = content.length > 1200 ? content.slice(0, 1200).trim() : content;
        const summary = hasRequiredReviewLabels(short)
          ? short
          : buildFallbackReview(body.gameData as GameData, gameFacts);

        const response: ReviewResponse = { summary };
        return NextResponse.json(response);
      } catch (e) {
        lastError = e;
        console.log(`Groq key index ${i} threw error:`, e instanceof Error ? e.message : e);
        continue;
      }
    }

    // If we reach here, all keys failed
    console.error('All Groq keys failed. Last error:', lastError);
    return NextResponse.json({ error: 'The AI coach is busy. Try again in a moment.' }, { status: 503 });
  } catch (e) {
    console.error('Game review error', e);
    return NextResponse.json({ error: 'The AI review could not load, but your game was saved locally for this session.' }, { status: 500 });
  }
}
