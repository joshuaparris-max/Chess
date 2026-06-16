'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { OPENINGS } from '@/lib/openings';

type Step = { fen: string; from: string; to: string; san: string };

function buildLine(moves: string[]): Step[] {
  const game = new Chess();
  const steps: Step[] = [];
  for (const san of moves) {
    try {
      const mv = game.move(san);
      if (!mv) break;
      steps.push({ fen: game.fen(), from: mv.from, to: mv.to, san: mv.san });
    } catch {
      break;
    }
  }
  return steps;
}

export default function OpeningsPage() {
  const [selected, setSelected] = useState(0);
  const [ply, setPly] = useState(0);

  const opening = OPENINGS[selected];
  const steps = useMemo(() => buildLine(opening.moves), [opening]);

  const game = useMemo(() => {
    const g = new Chess();
    if (ply > 0 && steps[ply - 1]) g.load(steps[ply - 1].fen);
    return g;
  }, [steps, ply]);

  const lastMove = ply > 0 && steps[ply - 1] ? { from: steps[ply - 1].from, to: steps[ply - 1].to } : null;

  const pick = (index: number) => {
    setSelected(index);
    setPly(0);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-sky-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">📖 Opening Explorer</h1>
        <span className="text-sm text-slate-400">{OPENINGS.length} openings</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          {OPENINGS.map((o, i) => (
            <button
              key={o.name}
              onClick={() => pick(i)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                i === selected
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-900/60 hover:border-sky-300/60'
              }`}
            >
              <p className="font-black text-white">{o.name}</p>
              <p className="text-sm text-slate-300">{o.idea}</p>
              <p className="mt-1 text-xs font-mono text-slate-400">{o.moves.join(' ')}</p>
            </button>
          ))}
        </div>

        <div>
          <ChessBoard
            game={game}
            selectedSquare={null}
            legalTargets={[]}
            lastMove={lastMove}
            disabled
            onSquareClick={() => {}}
          />
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setPly(0)}
              disabled={ply === 0}
              className="rounded-xl border border-slate-600 px-3 py-2 text-sm disabled:opacity-40"
            >
              ⏮ Start
            </button>
            <button
              onClick={() => setPly((p) => Math.max(0, p - 1))}
              disabled={ply === 0}
              className="rounded-xl border border-slate-600 px-3 py-2 text-sm disabled:opacity-40"
            >
              ◀ Back
            </button>
            <span className="min-w-20 text-center text-sm font-bold text-slate-300">
              Move {ply} / {steps.length}
            </span>
            <button
              onClick={() => setPly((p) => Math.min(steps.length, p + 1))}
              disabled={ply >= steps.length}
              className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-slate-950 disabled:opacity-40"
            >
              Next ▶
            </button>
          </div>
          <p className="mt-3 text-center text-sm text-slate-300">
            {ply === 0
              ? 'Press Next to walk through the opening moves.'
              : `${ply}. ${steps[ply - 1]?.san} — ${opening.idea}`}
          </p>
        </div>
      </div>
    </main>
  );
}
