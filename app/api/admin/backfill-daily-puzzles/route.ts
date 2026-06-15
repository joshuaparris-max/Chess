import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabaseAdmin';
import { getSydneyDateString } from '@/lib/dates';
import { getRandomLichessPuzzle, getDailyLichessPuzzle } from '@/lib/lichessClient';

/**
 * POST /api/admin/backfill-daily-puzzles
 *
 * Backfill the daily_puzzles archive for a date range.
 * Requires CRON_SECRET bearer token for authentication.
 *
 * Request body:
 * {
 *   "startDate": "2026-06-08",  // Sydney date format YYYY-MM-DD
 *   "endDate": "2026-06-15"     // Sydney date format YYYY-MM-DD
 * }
 *
 * Constraints:
 * - Max 31 dates per request
 * - Never overwrites existing puzzles
 * - Skips dates that already have puzzles
 * - Respects Lichess rate limits
 * - Sequential processing (no parallelism)
 */

interface BackfillResult {
  date: string;
  status: 'inserted' | 'skipped' | 'failed';
  puzzleId?: string;
  reason?: string;
}

interface BackfillResponse {
  requested: number;
  inserted: number;
  alreadyPresent: number;
  failed: number;
  results: BackfillResult[];
}

const MAX_ATTEMPTS = 12; // Reuse from cron logic
const MIN_RATING = 1600;
const MIN_PLAYS = 100;
const EXCLUDED_THEMES = ['opening'];

function datesBetween(startStr: string, endStr: string): string[] {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const dates: string[] = [];

  while (start <= end) {
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    start.setDate(start.getDate() + 1);
  }

  return dates;
}

function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

async function puzzleExistsForDate(supabase: any, sydneyDate: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('daily_puzzles')
    .select('id', { count: 'exact' })
    .eq('puzzle_date', sydneyDate)
    .limit(1);

  if (error) {
    console.error(`Failed to check existing puzzle for ${sydneyDate}:`, error);
    return false;
  }

  return (data?.length || 0) > 0;
}

async function attemptInsertPuzzle(
  supabase: any,
  sydneyDate: string,
  isToday: boolean,
): Promise<{ success: boolean; puzzleId?: string; reason: string }> {
  // Try up to MAX_ATTEMPTS to find a valid puzzle
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // For today's date, try daily puzzle first; otherwise use random
      let puzzle;
      let source: 'lichess-daily' | 'lichess-random-backfill';

      if (isToday) {
        try {
          const daily = await getDailyLichessPuzzle();
          if (daily) {
            puzzle = daily;
            source = 'lichess-daily';
          } else {
            puzzle = await getRandomLichessPuzzle();
            source = 'lichess-random-backfill';
          }
        } catch {
          puzzle = await getRandomLichessPuzzle();
          source = 'lichess-random-backfill';
        }
      } else {
        puzzle = await getRandomLichessPuzzle();
        source = 'lichess-random-backfill';
      }

      if (!puzzle) {
        return { success: false, reason: 'Failed to fetch Lichess puzzle' };
      }

      // Apply quality filters
      if (puzzle.rating < MIN_RATING) {
        console.log(
          `[Backfill ${sydneyDate} Attempt ${attempt}] Rejected: rating ${puzzle.rating} < ${MIN_RATING} (ID: ${puzzle.lichessId})`,
        );
        continue;
      }

      if (puzzle.plays < MIN_PLAYS) {
        console.log(
          `[Backfill ${sydneyDate} Attempt ${attempt}] Rejected: plays ${puzzle.plays} < ${MIN_PLAYS} (ID: ${puzzle.lichessId})`,
        );
        continue;
      }

      const hasExcludedTheme = puzzle.themes.some(t => EXCLUDED_THEMES.includes(t));
      if (hasExcludedTheme) {
        console.log(
          `[Backfill ${sydneyDate} Attempt ${attempt}] Rejected: excluded theme (ID: ${puzzle.lichessId})`,
        );
        continue;
      }

      // Check for duplicate by lichess_id
      const { data: existing, error: dupError } = await supabase
        .from('daily_puzzles')
        .select('id')
        .eq('lichess_id', puzzle.lichessId)
        .limit(1);

      if (dupError) {
        console.error(`[Backfill ${sydneyDate}] Error checking duplicate:`, dupError);
        continue;
      }

      if (existing?.length) {
        console.log(
          `[Backfill ${sydneyDate} Attempt ${attempt}] Rejected: duplicate lichess_id (ID: ${puzzle.lichessId})`,
        );
        continue;
      }

      // Insert the puzzle
      const { error: insertError } = await supabase.from('daily_puzzles').insert({
        lichess_id: puzzle.lichessId,
        puzzle_date: sydneyDate,
        fen: puzzle.fen,
        side_to_move: puzzle.sideToMove,
        solution: puzzle.solution,
        rating: puzzle.rating,
        plays: puzzle.plays,
        themes: puzzle.themes,
        url: puzzle.url,
        imported_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(`[Backfill ${sydneyDate}] Insert failed:`, insertError);
        continue;
      }

      console.log(
        `[Backfill ${sydneyDate}] Success: inserted ${puzzle.lichessId} from ${source} on attempt ${attempt}`,
      );
      return { success: true, puzzleId: puzzle.lichessId, reason: 'Inserted' };
    } catch (error) {
      console.error(`[Backfill ${sydneyDate} Attempt ${attempt}] Exception:`, error);
      continue;
    }

    // Rate limiting: small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { success: false, reason: `Exhausted ${MAX_ATTEMPTS} attempts; no valid puzzle found` };
}

export async function POST(request: NextRequest) {
  try {
    // ─── Authentication ───────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 });
    }

    // ─── Request validation ───────────────────────────────────────────────
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 },
      );
    }

    if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format (use YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'endDate must be >= startDate' }, { status: 400 });
    }

    const datesToFill = datesBetween(startDate, endDate);

    if (datesToFill.length > 31) {
      return NextResponse.json(
        { error: 'Date range exceeds maximum of 31 dates' },
        { status: 400 },
      );
    }

    // ─── Database setup ───────────────────────────────────────────────────
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 },
      );
    }

    // ─── Backfill loop (sequential, respecting rate limits) ───────────────
    const results: BackfillResult[] = [];
    let inserted = 0;
    let alreadyPresent = 0;
    let failed = 0;

    // Get current Sydney date to determine if we're processing today
    const todaySydney = getSydneyDateString();

    for (const sydneyDate of datesToFill) {
      // Check if puzzle already exists
      const exists = await puzzleExistsForDate(supabase, sydneyDate);

      if (exists) {
        results.push({ date: sydneyDate, status: 'skipped', reason: 'Already present' });
        alreadyPresent++;
        continue;
      }

      // Attempt to insert puzzle for this date
      const isToday = sydneyDate === todaySydney;
      const result = await attemptInsertPuzzle(supabase, sydneyDate, isToday);

      if (result.success) {
        results.push({
          date: sydneyDate,
          status: 'inserted',
          puzzleId: result.puzzleId,
        });
        inserted++;
      } else {
        results.push({
          date: sydneyDate,
          status: 'failed',
          reason: result.reason,
        });
        failed++;
      }

      // Respect Lichess rate limits: small delay between dates
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // ─── Response ─────────────────────────────────────────────────────────
    const response: BackfillResponse = {
      requested: datesToFill.length,
      inserted,
      alreadyPresent,
      failed,
      results,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in /api/admin/backfill-daily-puzzles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
