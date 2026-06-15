import { NextRequest, NextResponse } from 'next/server';
import { getRandomLichessPuzzle, getDailyLichessPuzzle } from '@/lib/lichessClient';
import { getSupabaseClient } from '@/lib/supabaseClient';

/**
 * GET /api/puzzles/daily
 * Fetches today's Lichess puzzle and stores it in Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'daily'; // 'daily' or 'random'

    let puzzle;

    if (source === 'daily') {
      puzzle = await getDailyLichessPuzzle();
    } else {
      const angle = searchParams.get('angle') || 'mix';
      const difficulty = searchParams.get('difficulty') || 'normal';
      puzzle = await getRandomLichessPuzzle({ angle, difficulty });
    }

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Failed to fetch puzzle from Lichess' },
        { status: 500 }
      );
    }

    // Optionally store in Supabase
    const storeInDb = searchParams.get('store') === 'true';
    if (storeInDb) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Make sure the table exists or create it dynamically
        const { error } = await supabase
          .from('lichess_puzzles')
          .upsert(
            {
              lichess_id: puzzle.lichessId,
              rating: puzzle.rating,
              plays: puzzle.plays,
              themes: puzzle.themes,
              solution: puzzle.solution,
              source: puzzle.source,
              added_at: new Date().toISOString(),
            },
            { onConflict: 'lichess_id' }
          );

        if (error) {
          console.error('Error storing puzzle in Supabase:', error);
          // Don't fail the request if storage fails
        }
      }
    }

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Error in /api/puzzles/daily:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
