import { NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse } from '../../../lib/gameReviewTypes';
import { buildCoachPrompt } from '../../../lib/gameReviewPrompts';
import { validateGameData, validateQuestion, validateRequestSize } from '../../../lib/validation';
import { getClientIP, checkRateLimit } from '../../../lib/rateLimiter';

async function callGroq(messages: any[], key: string, model: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 600,
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

    const body: ChatRequest = await req.json();
    const keysRaw = process.env.GROQ_API_KEYS || '';
    const model = process.env.GROQ_MODEL;
    if (!keysRaw || !model) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }
    const keys = keysRaw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }

    // Validate request payload
    const gameValidation = validateGameData(body.gameData.moves, body.gameData.moveCount);
    if (!gameValidation.valid) {
      return NextResponse.json({ error: gameValidation.error }, { status: 400 });
    }

    const questionValidation = validateQuestion(body.question);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    const sizeValidation = validateRequestSize(body);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const coaches = buildCoachPrompt(body.gameData, false);
    // Instruct the model to answer the user's question directly and succinctly.
    const userPrompt = `${coaches.user}\n\nAnswer instructions: Reply in plain text only. Answer the user's question directly and succinctly. Do not repeat the full review. If the user asks about checkmate, explain the final position: name the attacking piece, why the king has no escape, and why capture/block/interpose are impossible, in beginner terms.\n\nUser question: ${body.question.trim()}`;
    const messages = [
      { role: 'system' as const, content: coaches.system },
      { role: 'user' as const, content: userPrompt },
    ];

    let lastError: any = null;
    for (let i = 0; i < keys.length; i++) {
      try {
        const res = await callGroq(messages, keys[i], model);
        if (res.status === 401 || res.status === 429) {
          lastError = { status: res.status, index: i };
          console.log(`Groq key index ${i} failed with status ${res.status}; trying next key.`);
          continue;
        }
        if (!res.ok) {
          const txt = await res.text();
          lastError = { status: res.status, text: txt, index: i };
          console.log(`Groq key index ${i} failed with status ${res.status}`);
          continue;
        }
        const json = await res.json();
        let content = json?.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          console.log(`Groq key index ${i} returned unexpected response shape`);
          lastError = { status: 500, text: 'Unexpected response shape' };
          continue;
        }
        // Sanitise markdown and debug tokens
        content = content.replace(/\*\*/g, '');
        content = content.replace(/```[\s\S]*?```/g, '');
        content = content.replace(/detail=true/g, '');
        const response: ChatResponse = { answer: content.slice(0, 10000).trim() };
        return NextResponse.json(response);
      } catch (e) {
        lastError = e;
        console.log(`Groq key index ${i} threw error:`, e instanceof Error ? e.message : e);
        continue;
      }
    }
    console.error('All Groq keys failed. Last error:', lastError);
    return NextResponse.json({ error: 'The AI coach is busy. Try again in a moment.' }, { status: 503 });
  } catch (e) {
    console.error('Game review chat error', e);
    return NextResponse.json({ error: 'The AI coach could not understand the response. Please try again.' }, { status: 500 });
  }
}
