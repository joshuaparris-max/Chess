/**
 * Lichess Puzzle API Client
 * Fetches chess puzzles from the free Lichess API
 * https://lichess.org/api
 */

export interface LichessPuzzleResponse {
  game: {
    id: string;
    pgn: string;
    clock: string;
  };
  puzzle: {
    id: string;
    rating: number;
    plays: number;
    solution: string[];
    themes: string[];
    initialPly: number;
  };
}

export interface LichessPuzzle {
  lichessId: string;
  fen: string;
  solution: string[];
  rating: number;
  plays: number;
  themes: string[];
  source: 'lichess';
}

const LICHESS_API_BASE = 'https://lichess.org/api';

/**
 * Map Lichess themes to our internal theme types
 */
function mapLichessThemesToOurThemes(
  lichessThemes: string[]
): string[] {
  const themeMap: Record<string, string> = {
    mateIn1: 'mateIn1',
    mateIn2: 'mateIn2',
    mateIn3: 'mateIn3',
    mateIn4: 'mateIn3',
    mateIn5: 'mateIn3',
    fork: 'fork',
    pin: 'pin',
    skewer: 'skewer',
    discoveredAttack: 'discoveredAttack',
    hangingPiece: 'hangingPiece',
    deflection: 'deflection',
    interference: 'interference',
    sacrifice: 'sacrifice',
    promotion: 'promotion',
    endgame: 'endgame',
    opening: 'opening',
    backRankMate: 'backRankMate',
  };

  return lichessThemes
    .map((t) => themeMap[t] || null)
    .filter((t): t is string => t !== null);
}

/**
 * Fetch FEN from a Lichess puzzle ID
 * This requires the puzzle endpoint which returns the full puzzle data
 */
export async function getLichessPuzzleById(
  puzzleId: string
): Promise<LichessPuzzle | null> {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/puzzle/${puzzleId}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error(`Failed to fetch puzzle ${puzzleId}:`, response.status);
      return null;
    }

    const data = (await response.json()) as LichessPuzzleResponse;

    // Extract FEN from the PGN response
    // For now, we'll use a placeholder - Lichess API might not return FEN directly
    // You may need to parse the PGN or use an alternative endpoint
    return {
      lichessId: data.puzzle.id,
      fen: '', // Will need to extract from context
      solution: data.puzzle.solution,
      rating: data.puzzle.rating,
      plays: data.puzzle.plays,
      themes: mapLichessThemesToOurThemes(data.puzzle.themes),
      source: 'lichess',
    };
  } catch (error) {
    console.error(`Error fetching Lichess puzzle ${puzzleId}:`, error);
    return null;
  }
}

/**
 * Fetch a random puzzle from Lichess
 * Supports filtering by theme, difficulty, and color
 */
export async function getRandomLichessPuzzle(options?: {
  angle?: string; // 'fork', 'pin', 'mate', 'endgame', 'mix'
  difficulty?: string; // 'easiest', 'easier', 'normal', 'harder', 'hardest'
  color?: string; // 'white', 'black'
}): Promise<LichessPuzzle | null> {
  try {
    const params = new URLSearchParams();
    if (options?.angle) params.append('angle', options.angle);
    if (options?.difficulty) params.append('difficulty', options.difficulty);
    if (options?.color) params.append('color', options.color);

    const url = `${LICHESS_API_BASE}/puzzle/next${params.size ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch random Lichess puzzle:', response.status);
      return null;
    }

    const data = (await response.json()) as LichessPuzzleResponse;

    return {
      lichessId: data.puzzle.id,
      fen: '', // Lichess API doesn't return FEN directly; parse from PGN if needed
      solution: data.puzzle.solution,
      rating: data.puzzle.rating,
      plays: data.puzzle.plays,
      themes: mapLichessThemesToOurThemes(data.puzzle.themes),
      source: 'lichess',
    };
  } catch (error) {
    console.error('Error fetching random Lichess puzzle:', error);
    return null;
  }
}

/**
 * Fetch today's daily puzzle from Lichess
 */
export async function getDailyLichessPuzzle(): Promise<LichessPuzzle | null> {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/puzzle/daily`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch daily Lichess puzzle:', response.status);
      return null;
    }

    const data = (await response.json()) as LichessPuzzleResponse;

    return {
      lichessId: data.puzzle.id,
      fen: '', // Lichess API doesn't return FEN directly
      solution: data.puzzle.solution,
      rating: data.puzzle.rating,
      plays: data.puzzle.plays,
      themes: mapLichessThemesToOurThemes(data.puzzle.themes),
      source: 'lichess',
    };
  } catch (error) {
    console.error('Error fetching daily Lichess puzzle:', error);
    return null;
  }
}

/**
 * Fetch multiple puzzles in a batch
 */
export async function getBatchLichessPuzzles(
  count: number = 1,
  options?: {
    angle?: string;
    difficulty?: string;
  }
): Promise<LichessPuzzle[]> {
  try {
    const params = new URLSearchParams();
    params.append('nb', Math.min(count, 50).toString()); // Max 50 per batch
    if (options?.angle) params.append('angle', options.angle);
    if (options?.difficulty) params.append('difficulty', options.difficulty);

    const response = await fetch(`${LICHESS_API_BASE}/puzzle/batch/mix?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch batch Lichess puzzles:', response.status);
      return [];
    }

    const data = await response.json();

    // The batch endpoint returns an array of puzzles
    if (!Array.isArray(data.puzzles)) {
      return [];
    }

    return data.puzzles.map((p: any) => ({
      lichessId: p.puzzle.id,
      fen: '', // Will need to extract from context
      solution: p.puzzle.solution,
      rating: p.puzzle.rating,
      plays: p.puzzle.plays,
      themes: mapLichessThemesToOurThemes(p.puzzle.themes),
      source: 'lichess',
    }));
  } catch (error) {
    console.error('Error fetching batch Lichess puzzles:', error);
    return [];
  }
}
