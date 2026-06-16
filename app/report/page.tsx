'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getWeeklyStats, type WeeklyStats } from '@/lib/stats/weeklyStats';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 text-center shadow-sm ${accent ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className={`text-4xl font-black ${accent ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
    </div>
  );
}

export default function ReportPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    setStats(getWeeklyStats());
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 text-slate-900 print:py-0">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-md sm:p-8 print:border-0 print:shadow-none">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href="/" className="text-sm font-semibold text-emerald-700 hover:underline">
            ← Back to app
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500"
          >
            🖨️ Print
          </button>
        </div>

        <header className="mt-4 text-center">
          <h1 className="text-3xl font-black text-slate-800">📊 Weekly Report Card</h1>
          {stats && (
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {formatDate(stats.rangeStartIso)} – {formatDate(stats.rangeEndIso)}
            </p>
          )}
        </header>

        {!stats ? (
          <p className="mt-8 text-center text-slate-500">Loading…</p>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-4">
              <StatCard label="Games Played" value={String(stats.gamesPlayed)} />
              <StatCard label="Puzzles Solved" value={String(stats.puzzlesSolved)} />
              <StatCard label="Win Rate" value={stats.winRate === null ? '—' : `${stats.winRate}%`} accent />
              <StatCard label="Stickers Collected" value={String(stats.stickersTotal)} accent />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-800">Highlights ✨</h2>
              <p className="mt-2 text-slate-600">
                {stats.gamesWon > 0
                  ? `${stats.gamesWon} game${stats.gamesWon === 1 ? '' : 's'} won this week — wonderful effort!`
                  : 'Every game played builds skill. Keep going!'}
              </p>
              {!stats.hasTimestampedData && (
                <p className="mt-2 text-xs text-slate-400">
                  Stats are tracked from today onwards as games and puzzles are completed.
                </p>
              )}
            </section>

            <p className="mt-6 text-center text-lg font-black text-emerald-700">Keep going! 🌟</p>
          </>
        )}
      </div>
    </main>
  );
}
