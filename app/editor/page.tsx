'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';

type Piece = { color: 'w' | 'b'; type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p' };
type Board = Record<string, Piece>;

const FILES = 'abcdefgh';
const GLYPH: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};
const PALETTE: Piece[] = (['k', 'q', 'r', 'b', 'n', 'p'] as const).flatMap((type) => [
  { color: 'w', type } as Piece,
  { color: 'b', type } as Piece,
]);

function startingBoard(): Board {
  return new Chess()
    .board()
    .flat()
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .reduce<Board>((acc, cell) => {
      acc[cell.square] = { color: cell.color, type: cell.type };
      return acc;
    }, {});
}

function toFen(board: Board, turn: 'w' | 'b'): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f += 1) {
      const piece = board[`${FILES[f]}${rank}`];
      if (!piece) {
        empty += 1;
      } else {
        if (empty > 0) {
          row += String(empty);
          empty = 0;
        }
        row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

export default function EditorPage() {
  const [board, setBoard] = useState<Board>(startingBoard);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [brush, setBrush] = useState<Piece | 'erase'>(PALETTE[0]);
  const [copied, setCopied] = useState(false);

  const fen = useMemo(() => toFen(board, turn), [board, turn]);

  const validity = useMemo(() => {
    try {
      const g = new Chess(fen);
      return {
        valid: true as const,
        turnLabel: g.turn() === 'w' ? 'White' : 'Black',
        inCheck: g.inCheck(),
        legalMoves: g.moves().length,
        over: g.isGameOver(),
      };
    } catch (error) {
      return { valid: false as const, message: error instanceof Error ? error.message : 'Invalid position' };
    }
  }, [fen]);

  const place = (square: string) => {
    setBoard((prev) => {
      const next = { ...prev };
      if (brush === 'erase') delete next[square];
      else next[square] = brush;
      return next;
    });
    setCopied(false);
  };

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-amber-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">🧩 Board Editor</h1>
        <span className="text-sm text-slate-400">Set up any position</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <div>
          <div className="grid grid-cols-8 overflow-hidden rounded-2xl border border-slate-700" style={{ width: 'min(88vw, 384px)' }}>
            {Array.from({ length: 8 }).flatMap((_, rowIndex) =>
              Array.from({ length: 8 }).map((__, fileIndex) => {
                const rank = 8 - rowIndex;
                const square = `${FILES[fileIndex]}${rank}`;
                const piece = board[square];
                const light = (rowIndex + fileIndex) % 2 === 0;
                return (
                  <button
                    key={square}
                    onClick={() => place(square)}
                    aria-label={`${square}${piece ? ` ${piece.color}${piece.type}` : ' empty'}`}
                    className="flex aspect-square items-center justify-center text-3xl"
                    style={{ backgroundColor: light ? '#eee6cf' : '#6f8f72', color: piece?.color === 'w' ? '#fff' : '#111' }}
                  >
                    {piece ? GLYPH[`${piece.color}${piece.type}`] : ''}
                  </button>
                );
              }),
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setBoard(startingBoard()); setCopied(false); }} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">
              Starting position
            </button>
            <button onClick={() => { setBoard({}); setCopied(false); }} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">
              Clear board
            </button>
            <button onClick={() => setTurn((t) => (t === 'w' ? 'b' : 'w'))} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">
              {turn === 'w' ? 'White' : 'Black'} to move
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Piece palette</p>
          <div className="mt-2 grid grid-cols-6 gap-1">
            {PALETTE.map((p) => {
              const key = `${p.color}${p.type}`;
              const active = brush !== 'erase' && brush.color === p.color && brush.type === p.type;
              return (
                <button
                  key={key}
                  onClick={() => setBrush(p)}
                  aria-label={`Select ${key}`}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-2xl ${active ? 'border-amber-400 bg-amber-400/20' : 'border-slate-700 bg-slate-900'}`}
                  style={{ color: p.color === 'w' ? '#fff' : '#cbd5e1' }}
                >
                  {GLYPH[key]}
                </button>
              );
            })}
            <button
              onClick={() => setBrush('erase')}
              aria-label="Eraser"
              className={`col-span-6 mt-1 rounded-lg border py-2 text-sm font-bold ${brush === 'erase' ? 'border-amber-400 bg-amber-400/20' : 'border-slate-700 bg-slate-900'}`}
            >
              🧽 Eraser
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Pick a piece, then tap squares to place it. Use the eraser to remove pieces.</p>

          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-sm font-bold text-slate-200">FEN</p>
            <code className="mt-1 block break-all rounded-lg bg-slate-950 p-2 text-xs text-emerald-200">{fen}</code>
            <button onClick={copyFen} className="mt-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-300">
              {copied ? 'Copied ✓' : 'Copy FEN'}
            </button>
            <div className="mt-3 text-sm">
              {validity.valid ? (
                <p className="text-emerald-300">
                  ✓ Legal position · {validity.turnLabel} to move · {validity.legalMoves} legal moves
                  {validity.inCheck ? ' · in check' : ''}
                  {validity.over ? ' · game over' : ''}
                </p>
              ) : (
                <p className="text-rose-300">⚠ {validity.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
