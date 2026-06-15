import type { Color, PieceSymbol } from 'chess.js';

const SHAPES: Record<PieceSymbol, string> = {
  p: 'M32 13c-6 0-10 5-10 11 0 4 2 7 5 9-5 4-8 10-9 17h28c-1-7-4-13-9-17 3-2 5-5 5-9 0-6-4-11-10-11Z',
  n: 'M18 54h31c-1-8-4-13-10-17l7-11-5-12-16 3-8 10 8 2c-7 4-11 10-12 17l-7 12Zm13-30 7-3-2 7-5-4Z',
  b: 'M32 10c-5 6-9 11-9 17 0 5 3 9 7 11-6 4-9 9-10 16h24c-1-7-4-12-10-16 4-2 7-6 7-11 0-6-4-11-9-17Zm0 9 4 7-4 5-4-5 4-7Z',
  r: 'M17 13h8v7h5v-7h5v7h5v-7h8v14l-5 5 4 22H18l4-22-5-5V13Z',
  q: 'M14 18a4 4 0 1 1 7 2l6 9 3-13a4 4 0 1 1 4 0l3 13 6-9a4 4 0 1 1 4 2l-4 30H21l-4-30a4 4 0 0 1-3-4Z',
  k: 'M29 9h6v8h8v6h-8v7c7 2 11 8 11 15l-3 9H21l-3-9c0-7 4-13 11-15v-7h-8v-6h8V9Z',
};

export default function ChessPiece({ color, type }: { color: Color; type: PieceSymbol }) {
  return <svg aria-hidden="true" className="chess-piece-svg" viewBox="0 0 64 64"><path d={SHAPES[type]} className={color === 'w' ? 'piece-svg-white' : 'piece-svg-black'} /></svg>;
}
