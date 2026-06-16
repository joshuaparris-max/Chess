'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';

type Study = {
  id: string;
  title: string;
  line: string[]; // SAN moves from the standard start
  notes: Record<number, string>; // ply (1-based) -> note
};

const STORAGE_KEY = 'gm-studies';

function loadStudies(): Study[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as Study[]) : [];
  } catch {
    return [];
  }
}

function saveStudies(studies: Study[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
  } catch {
    // ignore
  }
}

function gameAtPly(line: string[], ply: number): Chess {
  const game = new Chess();
  for (let i = 0; i < ply && i < line.length; i += 1) {
    try {
      game.move(line[i]);
    } catch {
      break;
    }
  }
  return game;
}

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [title, setTitle] = useState('');
  const [line, setLine] = useState<string[]>([]);
  const [ply, setPly] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Square | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');

  useEffect(() => {
    setStudies(loadStudies());
  }, []);

  const game = useMemo(() => gameAtPly(line, ply), [line, ply]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const lastMove = useMemo(() => {
    if (ply === 0) return null;
    const g = gameAtPly(line, ply - 1);
    try {
      const mv = g.move(line[ply - 1]);
      return mv ? { from: mv.from, to: mv.to } : null;
    } catch {
      return null;
    }
  }, [line, ply]);

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
        // Making a move at an earlier ply truncates the rest of the line.
        const nextLine = [...line.slice(0, ply), mv.san];
        setLine(nextLine);
        setPly(ply + 1);
      }
    } catch {
      // illegal — ignore
    }
    setSelected(null);
  };

  const resetEditor = () => {
    setTitle('');
    setLine([]);
    setPly(0);
    setNotes({});
    setSelected(null);
    setShareCode('');
  };

  const saveStudy = () => {
    const study: Study = {
      id: `study-${line.join('')}-${Object.keys(notes).length}-${title.length}`,
      title: title.trim() || 'Untitled study',
      line,
      notes,
    };
    const next = [study, ...studies.filter((s) => s.id !== study.id)].slice(0, 50);
    setStudies(next);
    saveStudies(next);
  };

  const openStudy = (study: Study) => {
    setTitle(study.title);
    setLine(study.line);
    setNotes(study.notes ?? {});
    setPly(study.line.length);
    setSelected(null);
    setShareCode('');
  };

  const deleteStudy = (id: string) => {
    const next = studies.filter((s) => s.id !== id);
    setStudies(next);
    saveStudies(next);
  };

  const makeShareCode = () => {
    try {
      const payload = JSON.stringify({ title, line, notes });
      setShareCode(btoa(unescape(encodeURIComponent(payload))));
    } catch {
      setShareCode('');
    }
  };

  const importStudy = () => {
    try {
      const json = decodeURIComponent(escape(atob(importCode.trim())));
      const parsed = JSON.parse(json) as { title?: string; line?: string[]; notes?: Record<number, string> };
      setTitle(parsed.title ?? 'Imported study');
      setLine(Array.isArray(parsed.line) ? parsed.line : []);
      setNotes(parsed.notes ?? {});
      setPly(Array.isArray(parsed.line) ? parsed.line.length : 0);
      setImportCode('');
    } catch {
      // ignore malformed code
    }
  };

  const setNote = useCallback(
    (value: string) => {
      setNotes((prev) => ({ ...prev, [ply]: value }));
    },
    [ply],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-violet-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">📚 Interactive Studies</h1>
        <span className="text-sm text-slate-400">{studies.length} saved</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Study title"
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <ChessBoard
            game={game}
            selectedSquare={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            onSquareClick={onSquareClick}
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setPly(0)} disabled={ply === 0} className="rounded-xl border border-slate-600 px-3 py-2 text-sm disabled:opacity-40">⏮</button>
            <button onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} className="rounded-xl border border-slate-600 px-3 py-2 text-sm disabled:opacity-40">◀</button>
            <span className="min-w-16 text-center text-sm font-bold">{ply} / {line.length}</span>
            <button onClick={() => setPly((p) => Math.min(line.length, p + 1))} disabled={ply >= line.length} className="rounded-xl border border-slate-600 px-3 py-2 text-sm disabled:opacity-40">▶</button>
            <button onClick={resetEditor} className="rounded-xl border border-slate-600 px-3 py-2 text-sm">New</button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">Play moves on the board to build the line. Stepping back and playing a new move replaces the rest.</p>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-200">Note for this position (move {ply})</label>
          <textarea
            value={notes[ply] ?? ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an idea, plan, or reminder for this position…"
            className="mt-1 h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={saveStudy} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-black text-white hover:bg-violet-400">Save study</button>
            <button onClick={makeShareCode} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold">Make share code</button>
          </div>
          {shareCode && (
            <textarea readOnly value={shareCode} className="mt-2 h-16 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-emerald-200" />
          )}

          <div className="mt-3">
            <label className="text-sm font-bold text-slate-200">Import a share code</label>
            <div className="mt-1 flex gap-2">
              <input value={importCode} onChange={(e) => setImportCode(e.target.value)} placeholder="Paste code…" className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button onClick={importStudy} disabled={!importCode.trim()} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold disabled:opacity-40">Import</button>
            </div>
          </div>

          <h2 className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-slate-400">Saved studies</h2>
          <div className="mt-2 space-y-2">
            {studies.length === 0 ? (
              <p className="text-sm text-slate-400">No studies yet. Build a line and press Save.</p>
            ) : (
              studies.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                  <button onClick={() => openStudy(s)} className="text-left">
                    <p className="font-bold text-white">{s.title}</p>
                    <p className="text-xs text-slate-400">{s.line.length} moves · {Object.keys(s.notes ?? {}).length} notes</p>
                  </button>
                  <button onClick={() => deleteStudy(s.id)} aria-label="Delete study" className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-rose-300">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
