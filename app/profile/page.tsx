'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPlayerProgress, getStoredProgress } from '@/lib/progression/xp';
import { loadLocalGames } from '@/lib/gameArchive';
import { getEarnedStickerIds } from '@/lib/stickers/awardSticker';
import { stickers as STICKER_CATALOG } from '@/lib/stickers/stickerCatalog';
import { BOSSES, getDefeatedBosses } from '@/lib/bosses/bosses';

type Sheet = {
  level: string;
  symbol: string;
  xp: number;
  nextLevelXp: number;
  progressPercent: number;
  puzzlesSolved: number;
  gamesWon: number;
  fastestMate: number | null;
  firstPlayed: string | null;
  earnedStickers: string[];
  defeatedBosses: string[];
};

function isPlayerWin(result: string, color: 'w' | 'b'): boolean {
  const r = result.toLowerCase();
  return color === 'w'
    ? r.includes('white wins') || r.includes('1-0')
    : r.includes('black wins') || r.includes('0-1');
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-amber-900/30 bg-amber-50 p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-2xl font-black text-amber-950">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide text-amber-800/80">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const [sheet, setSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    const progress = getPlayerProgress();
    const stored = getStoredProgress();
    const games = loadLocalGames();
    const wins = games.filter((g) => isPlayerWin(g.result ?? '', g.playerColor));
    const mateWins = wins.filter((g) => (g.result ?? '').toLowerCase().includes('checkmate') || true);
    const fastestMate = mateWins.length
      ? Math.min(...mateWins.map((g) => Math.ceil((g.moves?.length ?? 0) / 2)).filter((n) => n > 0))
      : null;
    const sorted = [...games].sort((a, b) => Date.parse(a.createdAtIso) - Date.parse(b.createdAtIso));

    setSheet({
      level: progress.level,
      symbol: progress.symbol,
      xp: progress.xp,
      nextLevelXp: progress.nextLevelXp,
      progressPercent: progress.progressPercent,
      puzzlesSolved: stored.puzzlesSolved,
      gamesWon: wins.length,
      fastestMate: fastestMate && Number.isFinite(fastestMate) ? fastestMate : null,
      firstPlayed: sorted[0]?.createdAtIso ?? null,
      earnedStickers: getEarnedStickerIds(),
      defeatedBosses: getDefeatedBosses(),
    });
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <div className="rounded-[2rem] border-4 border-amber-900/40 bg-[#fef9c3] p-6 text-amber-950 shadow-xl sm:p-8">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/" className="text-sm font-bold text-amber-800 hover:underline">
            ← Back
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Character Sheet</span>
        </div>

        {!sheet ? (
          <p className="mt-8 text-center">Loading…</p>
        ) : (
          <>
            <header className="mt-4 text-center">
              <div className="text-6xl">{sheet.symbol}</div>
              <h1 className="mt-2 text-3xl font-black">{sheet.level}</h1>
              {sheet.firstPlayed && (
                <p className="text-sm font-semibold text-amber-800">
                  Player since {new Date(sheet.firstPlayed).toLocaleDateString()}
                </p>
              )}
              <div className="mx-auto mt-3 max-w-xs">
                <div className="h-2 w-full overflow-hidden rounded-full bg-amber-900/20">
                  <div className="h-full rounded-full bg-amber-600" style={{ width: `${sheet.progressPercent}%` }} />
                </div>
                <p className="mt-1 text-xs font-bold text-amber-800">
                  {sheet.xp} XP · next level at {sheet.nextLevelXp}
                </p>
              </div>
            </header>

            <h2 className="mt-8 text-center text-lg font-black uppercase tracking-[0.2em] text-amber-900">
              Ability Scores
            </h2>
            <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox icon="⚔️" label="Tactical Vision" value={String(sheet.puzzlesSolved)} />
              <StatBox icon="🏰" label="Endgame Power" value={String(sheet.gamesWon)} />
              <StatBox icon="📖" label="Opening Lore" value="Soon" />
              <StatBox icon="⚡" label="Speed (mate)" value={sheet.fastestMate ? `${sheet.fastestMate}` : '—'} />
              <StatBox icon="🧠" label="Wisdom (XP)" value={String(sheet.xp)} />
              <StatBox icon="👑" label="Prestige" value={sheet.level} />
            </section>

            <h2 className="mt-8 text-lg font-black uppercase tracking-[0.2em] text-amber-900">Achievements</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {sheet.earnedStickers.length === 0 ? (
                <p className="text-sm text-amber-800/80">No stickers yet — play Story Mode and puzzles to earn some!</p>
              ) : (
                STICKER_CATALOG.filter((s) => sheet.earnedStickers.includes(s.id)).map((s) => (
                  <span key={s.id} title={s.name} className="rounded-xl bg-white px-3 py-2 text-2xl shadow-sm">
                    {s.emoji}
                  </span>
                ))
              )}
            </div>

            <h2 className="mt-8 text-lg font-black uppercase tracking-[0.2em] text-amber-900">Boss Record</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {sheet.defeatedBosses.length === 0 ? (
                <p className="text-sm text-amber-800/80">No bosses defeated yet. Face them in ⚔️ Boss Battles!</p>
              ) : (
                BOSSES.filter((b) => sheet.defeatedBosses.includes(b.id)).map((b) => (
                  <span key={b.id} title={b.name} className="rounded-xl bg-white px-3 py-2 text-2xl shadow-sm">
                    {b.emoji}
                  </span>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
