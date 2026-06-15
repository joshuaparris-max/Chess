import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getDailyLichessPuzzle, getRandomLichessPuzzle } from '@/lib/lichessClient';
import { getAdminSupabaseClient } from '@/lib/supabaseAdmin';
import { getSydneyDateString } from '@/lib/dates';

/**
 * GET /api/cron/daily-puzzle
 *
 * Scheduled Vercel Cron job that runs daily at UTC 12:00 to:
 * 1. Fetch candidate puzzles (tries multiple)
 * 2. Validate quality thresholds
 * 3. Check for duplicates
 * 4. Insert one high-quality puzzle into Supabase daily_puzzles table
 * 5. Log all attempts in daily_puzzle_imports table
 *
 * Uses Sydney timezone for puzzle_date to ensure consistency across day boundaries.
 * Protected by Vercel Cron secret in Authorization header.
 *
 * Schedule: 0 12 * * * (UTC 12:00 = 10 PM or 11 PM Sydney, depending on DST)
 */

const CRON_SECRET = process.env.CRON_SECRET;

// Quality thresholds for accepted puzzles
const QUALITY_RULES = {
  minRating: 1600,
  minPlays: 100,
  excludedThemes: ['opening'], // Don't want opening theory in archive
  maxAttempts: 12, // Try up to 12 different puzzles before giving up
};

interface AttemptLog {
  lichessId: string;
  reason: string;
  responseTimeMs: number;
}

interface ImportResult {
  success: boolean;
  puzzleId?: string;
  sydneyDate?: string;
  reason?: string;
  attempts?: AttemptLog[];
  totalResponseTimeMs?: number;
}

/**
 * Try to find and import one high-quality puzzle.
 * Returns early with existing puzzle if one already imported for Sydney date.
 */
async function importDailyPuzzle(): Promise<ImportResult> {
  const overallStartTime = Date.now();
  const sydneyDate = getSydneyDateString();

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      sydneyDate,
      reason: 'Supabase admin client not configured. Check SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  // Check if a puzzle already exists for today (idempotency)
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('daily_puzzles')
      .select('lichess_id')
      .eq('puzzle_date', sydneyDate)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows (expected); any other error is real
      console.error('Error checking for existing puzzle:', fetchError);
      return {
        success: false,
        sydneyDate,
        reason: `Database error: ${fetchError.message}`,
      };
    }

    if (existing) {
      // Idempotent success: puzzle already imported for this date
      return {
        success: true,
        sydneyDate,
        puzzleId: existing.lichess_id,
        reason: 'Puzzle already imported for this date (idempotent)',
      };
    }
  } catch (error) {
    console.error('Unexpected error checking existing puzzle:', error);
    return {
      success: false,
      sydneyDate,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Try multiple candidates
  const attempts: AttemptLog[] = [];

  for (let attempt = 1; attempt <= QUALITY_RULES.maxAttempts; attempt++) {
    const attemptStartTime = Date.now();

    try {
      // Fetch a candidate puzzle (use random so we get variety)
      const puzzle = await getRandomLichessPuzzle({
        angle: 'mix',
        difficulty: 'normal',
      });

      const responseTimeMs = Date.now() - attemptStartTime;

      if (!puzzle) {
        attempts.push({
          lichessId: '(fetch failed)',
          reason: 'Failed to fetch puzzle from Lichess',
          responseTimeMs,
        });
        continue;
      }

      // Apply quality filters
      if (puzzle.rating < QUALITY_RULES.minRating) {
        attempts.push({
          lichessId: puzzle.lichessId,
          reason: `Rating too low (${puzzle.rating} < ${QUALITY_RULES.minRating})`,
          responseTimeMs,
        });
        continue;
      }

      if (puzzle.plays < QUALITY_RULES.minPlays) {
        attempts.push({
          lichessId: puzzle.lichessId,
          reason: `Play count too low (${puzzle.plays} < ${QUALITY_RULES.minPlays})`,
          responseTimeMs,
        });
        continue;
      }

      const excludedTheme = puzzle.themes.find(t => QUALITY_RULES.excludedThemes.includes(t));
      if (excludedTheme) {
        attempts.push({
          lichessId: puzzle.lichessId,
          reason: `Excluded theme: ${excludedTheme}`,
          responseTimeMs,
        });
        continue;
      }

      // Check for duplicate (by lichess_id)
      const { data: duplicate } = await supabase
        .from('daily_puzzles')
        .select('id')
        .eq('lichess_id', puzzle.lichessId)
        .maybeSingle();

      if (duplicate) {
        attempts.push({
          lichessId: puzzle.lichessId,
          reason: 'Duplicate: already imported before',
          responseTimeMs,
        });
        continue;
      }

      // This candidate passed all checks! Insert it.
      const { error: insertError } = await supabase
        .from('daily_puzzles')
        .insert({
          lichess_id: puzzle.lichessId,
          source_puzzle_id: puzzle.lichessId,
          puzzle_date: sydneyDate,
          fen: puzzle.fen,
          side_to_move: puzzle.sideToMove,
          solution: puzzle.solution,
          rating: puzzle.rating,
          plays: puzzle.plays,
          themes: puzzle.themes,
          url: puzzle.url,
        });

      if (insertError) {
        // Unique constraint violation or other DB error
        if (insertError.code === '23505') {
          // Unique constraint on puzzle_date
          attempts.push({
            lichessId: puzzle.lichessId,
            reason: 'Unique constraint: puzzle already exists for this date',
            responseTimeMs,
          });
          continue;
        }
        throw insertError;
      }

      // Success!
      return {
        success: true,
        sydneyDate,
        puzzleId: puzzle.lichessId,
        attempts,
        totalResponseTimeMs: Date.now() - overallStartTime,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      attempts.push({
        lichessId: '(error)',
        reason: msg,
        responseTimeMs: Date.now() - attemptStartTime,
      });
      // Continue trying other candidates
    }
  }

  // Exhausted all attempts
  return {
    success: false,
    sydneyDate,
    reason: `No acceptable puzzle found after ${QUALITY_RULES.maxAttempts} attempts`,
    attempts,
    totalResponseTimeMs: Date.now() - overallStartTime,
  };
}

/**
 * Log the import attempt to the imports table.
 */
async function logImportAttempts(
  sydneyDate: string,
  result: ImportResult,
  attemptNumber: number,
): Promise<void> {
  const supabase = getAdminSupabaseClient();
  if (!supabase || !result.attempts) return;

  try {
    const rows = result.attempts.map((attempt, index) => ({
      import_date: sydneyDate,
      lichess_puzzle_id: attempt.lichessId === '(fetch failed)' || attempt.lichessId === '(error)' ? null : attempt.lichessId,
      success: false,
      reason: attempt.reason,
      response_time_ms: attempt.responseTimeMs,
      attempt_number: index + 1,
    }));

    // Add final success/failure row
    rows.push({
      import_date: sydneyDate,
      lichess_puzzle_id: result.puzzleId || null,
      success: result.success,
      reason: result.success ? 'Success' : (result.reason || 'Unknown failure'),
      response_time_ms: result.totalResponseTimeMs || 0,
      attempt_number: attemptNumber,
    });

    await supabase.from('daily_puzzle_imports').insert(rows);
  } catch (error) {
    console.error('Failed to log import attempts:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verify Vercel Cron authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${CRON_SECRET}`;

  if (!CRON_SECRET) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 },
    );
  }

  if (authHeader !== expectedAuth) {
    console.warn('Unauthorized cron request (invalid or missing secret)');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const result = await importDailyPuzzle();

    // Log the import attempt
    const attemptNumber = 1; // Future: could increment on retries
    await logImportAttempts(result.sydneyDate || getSydneyDateString(), result, attemptNumber);

    if (result.success) {
      console.log(
        `✅ Daily puzzle imported (Sydney ${result.sydneyDate}): ${result.puzzleId} (${result.totalResponseTimeMs}ms)`,
      );
      return NextResponse.json(
        {
          success: true,
          puzzleId: result.puzzleId,
          sydneyDate: result.sydneyDate,
          totalResponseTimeMs: result.totalResponseTimeMs,
          attemptCount: result.attempts?.length || 0,
        },
        { status: 200 },
      );
    }

    console.warn(
      `⚠️ Daily puzzle import failed (Sydney ${result.sydneyDate}): ${result.reason}`,
    );
    return NextResponse.json(
      {
        success: false,
        reason: result.reason,
        sydneyDate: result.sydneyDate,
        attemptCount: result.attempts?.length || 0,
        totalResponseTimeMs: result.totalResponseTimeMs,
      },
      { status: 202 }, // 202 Accepted: job ran, but didn't find a puzzle
    );
  } catch (error) {
    console.error('Cron route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

