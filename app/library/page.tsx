'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';

export default function LibraryPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState(false);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setPdfName(file.name);
  };

  const onSquareClick = (square: Square) => {
    const piece = game.get(square);
    const turn = game.turn();
    if (!selected) {
      if (piece?.color === turn) setSelected(square);
      return;
    }
    if (selected === square) {
      setSelected(null);
      return;
    }
    if (piece?.color === turn) {
      setSelected(square);
      return;
    }
    const probe = new Chess(game.fen());
    try {
      const mv = probe.move({ from: selected, to: square, promotion: 'q' });
      if (mv) {
        setGame(probe);
        setLastMove({ from: mv.from, to: mv.to });
      }
    } catch {
      // illegal
    }
    setSelected(null);
  };

  const undo = () => {
    const copy = new Chess(game.fen());
    copy.undo();
    setGame(copy);
    setSelected(null);
    setLastMove(null);
  };

  const reset = () => {
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
    setFenError(false);
  };

  const loadFen = () => {
    try {
      const g = new Chess(fenInput.trim());
      setGame(g);
      setSelected(null);
      setLastMove(null);
      setFenError(false);
    } catch {
      setFenError(true);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">📕 Book Reader</h1>
        <span className="text-sm text-slate-400">Read a PDF beside a board</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-400">
            Open a PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {pdfName && <span className="ml-3 text-sm text-slate-400">{pdfName}</span>}
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            {pdfUrl ? (
              <iframe title="PDF book" src={pdfUrl} className="h-[70vh] w-full" />
            ) : (
              <div className="flex h-[40vh] items-center justify-center p-6 text-center text-slate-400">
                Open a chess PDF from your device to read it here. Files stay on your device — nothing is uploaded.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">Analysis board</p>
          <ChessBoard
            game={game}
            selectedSquare={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            flipped={flipped}
            onSquareClick={onSquareClick}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={undo} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">Undo</button>
            <button onClick={reset} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">Reset</button>
            <button onClick={() => setFlipped((f) => !f)} className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-bold">Flip</button>
          </div>
          <div className="mt-3">
            <label className="text-sm font-bold text-slate-200">Load a position (FEN)</label>
            <div className="mt-1 flex gap-2">
              <input
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="Paste a FEN to set up a diagram…"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <button onClick={loadFen} disabled={!fenInput.trim()} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40">Load</button>
            </div>
            {fenError && <p className="mt-1 text-xs text-rose-300">That FEN isn&apos;t valid.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
