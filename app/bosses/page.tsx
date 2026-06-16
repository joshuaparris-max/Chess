'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BOSSES, getDefeatedBosses } from '@/lib/bosses/bosses';

export default function BossesPage() {
  const [defeated, setDefeated] = useState<string[]>([]);

  useEffect(() => {
    setDefeated(getDefeatedBosses());
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-rose-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">⚔️ Boss Battles</h1>
        <span className="text-sm text-slate-400">
          {defeated.length}/{BOSSES.length} beaten
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {BOSSES.map((boss) => {
          const beaten = defeated.includes(boss.id);
          return (
            <article
              key={boss.id}
              className="flex flex-col rounded-3xl border border-slate-700 bg-slate-900/70 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-5xl">{boss.emoji}</span>
                <div>
                  <h2 className="text-lg font-black">{boss.name}</h2>
                  <p className="text-xs text-rose-300">{'💀'.repeat(boss.difficulty)}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-300">{boss.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                {beaten ? (
                  <span className="text-sm font-bold text-emerald-300">✅ Defeated · {boss.rewardLabel}</span>
                ) : (
                  <span className="text-xs text-slate-400">Reward: {boss.rewardLabel}</span>
                )}
                <Link
                  href={`/bosses/${boss.id}`}
                  className="rounded-full bg-rose-500 px-5 py-2 text-sm font-black text-white hover:bg-rose-400"
                >
                  {beaten ? 'Rematch' : '⚔️ Challenge'}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
