import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabaseAdmin';

/**
 * GET /api/accumulated-puzzles?limit=20&offset=0&minRating=1600&theme=fork
 *
 * Load accumulated daily puzzles from Supabase.
 * This is a server-side read from the daily_puzzles archive.
 * Uses admin client for unrestricted access.
 *
 * Query parameters (all optional):
 *  - limit: max results (default 20, max 100)
 *  - offset: pagination offset (default 0)
 *  - minRating: filter by minimum rating (default 0)
 *  - maxRating: filter by maximum rating (default 3000)
 *  - theme: filter by theme (single value)
 *  - startDate: filter by start date (YYYY-MM-DD)
 *  - endDate: filter by end date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Accumulated puzzles not available' },
        { status: 503 },
      );
    }

    const params = request.nextUrl.searchParams;
    const limit = Math.min(Number(params.get('limit')) || 20, 100);
    const offset = Number(params.get('offset')) || 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 100 || offset < 0 || !Number.isInteger(offset)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters (limit: 1-100, offset: non-negative integer)' },
        { status: 400 },
      );
    }

    const minRating = Number(params.get('minRating')) || 0;
    const maxRating = Number(params.get('maxRating')) || 3000;
    const theme = params.get('theme');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');

    // Validate rating filters
    if (minRating < 0 || maxRating > 5000 || minRating > maxRating) {
      return NextResponse.json(
        { error: 'Invalid rating filters' },
        { status: 400 },
      );
    }

    // Validate dates
    if ((startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) ||
        (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
      return NextResponse.json(
        { error: 'Invalid date format (use YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('daily_puzzles')
      .select('*', { count: 'exact' })
      .gte('rating', minRating)
      .lte('rating', maxRating)
      .order('puzzle_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Theme filter (exact match on array element)
    if (theme) {
      query = query.contains('themes', [theme]);
    }

    // Date range filters
    if (startDate) {
      query = query.gte('puzzle_date', startDate);
    }
    if (endDate) {
      query = query.lte('puzzle_date', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch accumulated puzzles:', error);
      return NextResponse.json(
        { error: 'Failed to load puzzles from database' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        puzzles: data || [],
        total: count || 0,
        limit,
        offset,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error) {
    console.error('Error in /api/accumulated-puzzles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

