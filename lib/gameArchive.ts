export const LOCAL_GAME_ARCHIVE_KEY = 'gmp.localGames.v1';
export const LOCAL_GAME_ARCHIVE_LIMIT = 20;

export type LocalGameRecord = {
  schemaVersion: 1;
  id: string;
  createdAtIso: string;
  playerColor: 'w' | 'b';
  opponentType: 'bot' | 'human';
  result: string;
  pgn: string;
  moves: string[];
  finalFen: string;
  botLevelId?: string;
  reviewSummary?: string;
};

export function normaliseGameArchive(value: unknown): LocalGameRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is LocalGameRecord => Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.pgn === 'string'))
    .slice(0, LOCAL_GAME_ARCHIVE_LIMIT);
}

export function loadLocalGames(): LocalGameRecord[] {
  try {
    return normaliseGameArchive(JSON.parse(localStorage.getItem(LOCAL_GAME_ARCHIVE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

export function saveLocalGame(record: LocalGameRecord): LocalGameRecord[] {
  const next = [record, ...loadLocalGames().filter((game) => game.id !== record.id)].slice(0, LOCAL_GAME_ARCHIVE_LIMIT);
  localStorage.setItem(LOCAL_GAME_ARCHIVE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('gmp-local-games-change', { detail: next }));
  return next;
}

export function attachReviewSummary(games: LocalGameRecord[], pgn: string, reviewSummary: string): LocalGameRecord[] {
  return games.map((game) => game.pgn === pgn ? { ...game, reviewSummary } : game);
}

export function saveLocalGameReview(pgn: string, reviewSummary: string): LocalGameRecord[] {
  const next = attachReviewSummary(loadLocalGames(), pgn, reviewSummary);
  localStorage.setItem(LOCAL_GAME_ARCHIVE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('gmp-local-games-change', { detail: next }));
  return next;
}

export function clearLocalGames() {
  localStorage.removeItem(LOCAL_GAME_ARCHIVE_KEY);
  window.dispatchEvent(new CustomEvent('gmp-local-games-change', { detail: [] }));
}

export function createGameId(pgn: string, createdAtIso: string) {
  let hash = 2166136261;
  for (const char of `${createdAtIso}:${pgn}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `game-${(hash >>> 0).toString(36)}`;
}
