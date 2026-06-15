'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';

export type ModelGame = { title: string; player: string; pgn: string; lesson: string };

export default function ModelGameViewer({ model }: { model: ModelGame }) {
  const moves = useMemo(() => {
    const game = new Chess();
    game.loadPgn(model.pgn);
    return game.history();
  }, [model.pgn]);
  const [ply, setPly] = useState(0);
  const game = useMemo(() => {
    const next = new Chess();
    moves.slice(0, ply).forEach((move) => next.move(move));
    return next;
  }, [moves, ply]);

  return <article className="glass-panel rounded-3xl p-5">
    <p className="text-sm font-bold uppercase tracking-widest text-yellow-200">{model.player}</p>
    <h3 className="mt-1 text-xl font-bold">{model.title}</h3>
    <p className="mt-2 text-sm text-slate-300">{model.lesson}</p>
    <div className="mt-4 max-w-md"><ChessBoard game={game} selectedSquare={null} legalTargets={[]} lastMove={null} disabled onSquareClick={() => {}} /></div>
    <div className="mt-4 flex items-center gap-3">
      <button disabled={ply === 0} onClick={() => setPly((value) => value - 1)} className="min-h-[44px] flex-1 rounded-xl border border-slate-600 disabled:opacity-40">Previous</button>
      <span className="text-sm text-slate-300">{ply}/{moves.length}</span>
      <button disabled={ply === moves.length} onClick={() => setPly((value) => value + 1)} className="min-h-[44px] flex-1 rounded-xl bg-teal-400 font-bold text-slate-950 disabled:opacity-40">Next move</button>
    </div>
  </article>;
}
