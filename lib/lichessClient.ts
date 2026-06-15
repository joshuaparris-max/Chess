/**
 * Lichess Puzzle API client.
 * Free, open, no API key: https://lichess.org/api
 *
 * The Lichess puzzle endpoints return the source game PGN plus `initialPly`, NOT a FEN.
 * The puzzle position is reached by replaying the game up to the puzzle, after which it
 * is the solver's turn and `solution[0]` is the solver's first move. We reconstruct the
 * FEN with chess.js and use an empirical ply-guard so we are never off by one.
 */

import { Chess } from 'chess.js';

export interface LichessPuzzleApiResponse {
  game: { id: string; pgn: string; clock?: string };
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
  sideToMove: 'w' | 'b';
  solution: string[];
  rating: number;
  plays: number;
  themes: string[];
  url: string;
  source: 'lichess';
}

const LICHESS_API_BASE = 'https://lichess.org/api';

// Themes we have human-friendly copy for; others are passed through as-is for display.
const KNOWN_THEMES = new Set([
  'mateIn1', 'mateIn2', 'mateIn3', 'backRankMate', 'fork', 'pin', 'skewer',
  'discoveredAttack', 'hangingPiece', 'deflection', 'interference', 'sacrifice',
  'promotion', 'endgame', 'opening', 'doubleCheck', 'attraction', 'clearance',
  'quietMove', 'zugzwang', 'advancedPawn', 'defensiveMove', 'trappedPiece',
]);

function normaliseThemes(themes: string[]): string[] {
  if (!Array.isArray(themes)) return [];
  // keep known themes first, then any extras, capped for display
  const known = themes.filter((t) => KNOWN_THEMES.has(t));
  const rest = themes.filter((t) => !KNOWN_THEMES.has(t));
  return [...known, ...rest].slice(0, 6);
}

/** Get the game's moves (SAN) from a Lichess PGN, robust to bare move lists. */
function gameSans(pgn: string): string[] {
  try {
    const c = new Chess();
    c.loadPgn(pgn);
    const h = c.history();
    if (h.length) return h;
  } catch {
    /* fall through to manual parse */
  }
  const c2 = new Chess();
  const out: string[] = [];
  for (let tok of pgn.split(/\s+/)) {
    if (!tok) continue;
    tok = tok.replace(/^\d+\.+/, ''); // strip move numbers like "12."
    if (!tok || ['1-0', '0-1', '1/2-1/2', '*'].includes(tok)) continue;
    try {
      const m = c2.move(tok);
      if (m) out.push(m.san);
    } catch {
      /* ignore unparseable token */
    }
  }
  return out;
}

function uciIsLegal(fen: string, uci: string): boolean {
  try {
    const c = new Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci.length === 5 ? { promotion: uci[4] } : {}) });
    return !!m;
  } catch {
    return false;
  }
}

/**
 * Reconstruct the puzzle's starting FEN. Tries the most likely ply count first, then
 * neighbours, picking the one where the first solution move is legal.
 */
function derivePosition(pgn: string, initialPly: number, solution: string[]): { fen: string; sideToMove: 'w' | 'b' } | null {
  if (!solution?.length) return null;
  const sans = gameSans(pgn);
  if (!sans.length) return null;

  for (const plies of [initialPly + 1, initialPly, initialPly + 2, initialPly - 1]) {
    if (plies < 0 || plies > sans.length) continue;
    const g = new Chess();
    let ok = true;
    for (let i = 0; i < plies; i++) {
      try { if (!g.move(sans[i])) { ok = false; break; } } catch { ok = false; break; }
    }
    if (!ok) continue;
    const fen = g.fen();
    if (uciIsLegal(fen, solution[0])) {
      return { fen, sideToMove: g.turn() };
    }
  }
  return null;
}

function toPuzzle(data: LichessPuzzleApiResponse): LichessPuzzle | null {
  if (!data?.puzzle || !data?.game) return null;
  const pos = derivePosition(data.game.pgn, data.puzzle.initialPly, data.puzzle.solution);
  if (!pos) return null;
  return {
    lichessId: data.puzzle.id,
    fen: pos.fen,
    sideToMove: pos.sideToMove,
    solution: data.puzzle.solution,
    rating: data.puzzle.rating,
    plays: data.puzzle.plays,
    themes: normaliseThemes(data.puzzle.themes),
    url: `https://lichess.org/training/${data.puzzle.id}`,
    source: 'lichess',
  };
}

async function fetchPuzzle(path: string, revalidateSeconds: number | false): Promise<LichessPuzzle | null> {
  try {
    const init: RequestInit & { next?: { revalidate: number } } = {
      headers: { Accept: 'application/json' },
    };
    if (revalidateSeconds === false) init.cache = 'no-store';
    else init.next = { revalidate: revalidateSeconds };

    // Add timeout protection (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${LICHESS_API_BASE}${path}`, {
        ...init,
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(`Lichess ${path} responded ${res.status}`);
        return null;
      }

      const data = (await res.json()) as LichessPuzzleApiResponse;
      const puzzle = toPuzzle(data);

      if (!puzzle) {
        console.warn(`Lichess ${path} returned unparseable puzzle`);
        return null;
      }

      return puzzle;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`Lichess ${path} timed out after 15s`);
      } else {
        console.warn(`Error fetching Lichess ${path}: ${error.message}`);
      }
    } else {
      console.warn(`Error fetching Lichess ${path}`);
    }
    return null;
  }
}

/** Today's curated daily puzzle. Cached for an hour to respect Lichess. */
export function getDailyLichessPuzzle(): Promise<LichessPuzzle | null> {
  return fetchPuzzle('/puzzle/daily', 3600);
}

/** A fresh random puzzle, optionally filtered. Never cached. */
export function getRandomLichessPuzzle(options?: { angle?: string; difficulty?: string }): Promise<LichessPuzzle | null> {
  const params = new URLSearchParams();
  if (options?.angle && options.angle !== 'mix') params.append('angle', options.angle);
  if (options?.difficulty && options.difficulty !== 'normal') params.append('difficulty', options.difficulty);
  const qs = params.toString();
  return fetchPuzzle(`/puzzle/next${qs ? `?${qs}` : ''}`, false);
}

/** A specific puzzle by id. */
export function getLichessPuzzleById(id: string): Promise<LichessPuzzle | null> {
  return fetchPuzzle(`/puzzle/${encodeURIComponent(id)}`, 86400);
}
