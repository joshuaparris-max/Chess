'use client';

import { useEffect, useState } from 'react';
import { clearLocalGames, exportGameArchiveJson, loadLocalGames, type LocalGameRecord } from '@/lib/gameArchive';

export default function GameArchive({ onLoad }: { onLoad: (pgn: string) => void }) {
  const [games, setGames] = useState<LocalGameRecord[]>([]);
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setGames(loadLocalGames());
    refresh();
    window.addEventListener('gmp-local-games-change', refresh);
    return () => window.removeEventListener('gmp-local-games-change', refresh);
  }, []);

  const exportPgn = (game: LocalGameRecord) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([game.pgn], { type: 'application/x-chess-pgn' }));
    link.download = `${game.id}.pgn`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportAll = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([exportGameArchiveJson(games)], { type: 'application/json' }));
    link.download = 'grandmaster-path-game-archive.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-teal-200">Local game archive</h3>
          <p className="text-xs text-slate-400">The latest 20 completed games stay on this device.</p>
        </div>
        {games.length > 0 && <div className="flex gap-2">
          <button onClick={exportAll} className="rounded-xl border border-teal-400/40 px-3 py-2 text-xs text-teal-100">Export JSON</button>
          <button onClick={() => { if (window.confirm('Clear all locally saved games?')) clearLocalGames(); }} className="rounded-xl border border-red-400/30 px-3 py-2 text-xs text-red-200">Clear</button>
        </div>}
      </div>
      <div className="mt-3 space-y-2">
        {games.map((game) => (
          <article key={game.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-sm font-bold text-white">{game.result} · {game.moves.length} moves</p>
            <p className="text-xs text-slate-400">{new Date(game.createdAtIso).toLocaleString()} · played as {game.playerColor === 'w' ? 'White' : 'Black'}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => onLoad(game.pgn)} className="rounded-lg bg-teal-400 px-3 py-2 text-xs font-bold text-slate-950">Load</button>
              <button onClick={() => exportPgn(game)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200">Export PGN</button>
              {game.reviewSummary && <button onClick={() => setOpenReviewId(openReviewId === game.id ? null : game.id)} className="rounded-lg border border-yellow-300/50 px-3 py-2 text-xs text-yellow-100">{openReviewId === game.id ? 'Hide review' : 'View review'}</button>}
            </div>
            {game.reviewSummary && openReviewId === game.id && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-xs leading-5 text-slate-200">{game.reviewSummary}</p>}
          </article>
        ))}
        {games.length === 0 && <p className="text-sm text-slate-400">Finish a game to save it here.</p>}
      </div>
    </div>
  );
}
