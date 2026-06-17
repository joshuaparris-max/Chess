import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'data', 'puzzles.json')
    const raw = await fs.promises.readFile(file, 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json({ ok: true, puzzles: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getDailyLichessPuzzle, getRandomLichessPuzzle } from '@/lib/lichessClient';

/**
 * GET /api/puzzles?source=daily
 * GET /api/puzzles?source=random&angle=fork&difficulty=normal
 *
 * Proxies the free Lichess puzzle API (no key, no account, no database) and returns a
 * puzzle with a reconstructed FEN. The daily puzzle is cached; random is always fresh.
 *
 * Resilience:
 * - Times out after 15s (Lichess API sometimes slow)
 * - Returns 503 on timeout (client can retry)
 * - Returns 429 if Lichess rate-limits us
 * - Validates FEN non-empty before returning
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const source = params.get('source') ?? 'daily';

    // Set a timeout for the Lichess fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let puzzle;
    try {
      puzzle = source === 'random'
        ? await getRandomLichessPuzzle({
            angle: params.get('angle') ?? 'mix',
            difficulty: params.get('difficulty') ?? 'normal',
          })
        : await getDailyLichessPuzzle();
    } finally {
      clearTimeout(timeout);
    }

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Could not load a puzzle from Lichess right now. Please try again.' },
        { status: 502 }
      );
    }

    // Validate FEN is not empty (catches the old bug where fen: '')
    if (!puzzle.fen || puzzle.fen.trim() === '') {
      console.error('Lichess puzzle has empty FEN:', puzzle.lichessId);
      return NextResponse.json(
        { error: 'Invalid puzzle data from Lichess. Please try again.' },
        { status: 502 }
      );
    }

    // Validate solution moves exist
    if (!Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
      console.error('Lichess puzzle has no solution:', puzzle.lichessId);
      return NextResponse.json(
        { error: 'Invalid puzzle data from Lichess. Please try again.' },
        { status: 502 }
      );
    }

    const headers = source === 'daily'
      ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
      : { 'Cache-Control': 'no-store' };

    return NextResponse.json(puzzle, { headers });
  } catch (error) {
    // Timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Lichess API timeout');
      return NextResponse.json(
        { error: 'Lichess API is responding slowly. Please try again.' },
        { status: 503 }
      );
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Lichess API network error:', error.message);
      return NextResponse.json(
        { error: 'Could not connect to Lichess. Check your internet connection.' },
        { status: 503 }
      );
    }

    console.error('Error in /api/puzzles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
