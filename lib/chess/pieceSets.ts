// Option metadata for the piece-style picker. The full render data (SVG paths,
// CSS classes) lives in components/ChessBoard.tsx; this is just the list shown
// in the Settings menu so it can stay in sync without importing the board.
export const PIECE_SET_OPTIONS = [
  { id: 'classic', label: 'Classic' },
  { id: 'inverted', label: 'Inverted' },
  { id: 'modern', label: 'Modern' },
  { id: 'outline', label: 'Outline' },
  { id: 'letters', label: 'Letters' },
  { id: 'fairy', label: 'Fairy 🧚' },
] as const;

export const PIECE_SET_KEY = 'gm-piece-set';
export const PIECE_SET_CHANGE_EVENT = 'gm-piece-set-change';

export function getPieceSet(): string {
  if (typeof window === 'undefined') return 'classic';
  try {
    return window.localStorage.getItem(PIECE_SET_KEY) || 'classic';
  } catch {
    return 'classic';
  }
}

export function setPieceSet(id: string) {
  try {
    window.localStorage.setItem(PIECE_SET_KEY, id);
    window.dispatchEvent(new CustomEvent(PIECE_SET_CHANGE_EVENT, { detail: id }));
  } catch {
    // ignore
  }
}
