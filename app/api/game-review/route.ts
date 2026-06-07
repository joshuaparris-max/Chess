import { NextResponse } from 'next/server';
import type { ReviewRequest, ReviewResponse } from '../../../lib/gameReviewTypes';
import { buildCoachPrompt } from '../../../lib/gameReviewPrompts';

async function callGroq(promptBody: any, key: string, model: string) {
  const res = await fetch(`https://api.groq.ai/v1/models/${model}/outputs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(promptBody),
  });
  return res;
}

export async function POST(req: Request) {
  try {
    const body: ReviewRequest = await req.json();
    const keysRaw = process.env.GROQ_API_KEYS || '';
    const model = process.env.GROQ_MODEL;
    if (!keysRaw || !model) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }

    const keys = keysRaw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'AI review is not set up yet. Add a Groq API key to enable post-game coaching.' }, { status: 400 });
    }

    const { system, user } = buildCoachPrompt(body.gameData, !!body.detail);
    const promptBody = { input: [{ role: 'system', content: system }, { role: 'user', content: user }] };

    // try keys in order
    let lastError: any = null;
    for (let i = 0; i < keys.length; i++) {
      try {
        const res = await callGroq(promptBody, keys[i], model);
        if (res.status === 401 || res.status === 429) {
          lastError = { status: res.status, index: i };
          continue; // try next key
        }
        if (!res.ok) {
          const txt = await res.text();
          lastError = { status: res.status, text: txt, index: i };
          continue;
        }

        const json = await res.json();
        // Groq shape may vary. Try to extract text in a safe manner.
        const text = (json?.outputs?.[0]?.content) || (json?.output?.[0]?.content) || JSON.stringify(json);

        const response: ReviewResponse = { summary: text.toString().slice(0, 10000) };
        return NextResponse.json(response);
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    // If we reach here, all keys failed
    console.error('Groq request failed', lastError);
    return NextResponse.json({ error: 'The AI coach is busy. Try again in a moment.' }, { status: 503 });
  } catch (e) {
    console.error('Game review error', e);
    return NextResponse.json({ error: 'The AI review could not load.' }, { status: 500 });
  }
}
