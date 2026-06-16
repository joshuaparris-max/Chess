'use client';

import { useEffect, useMemo, useState } from 'react';
import { stickers } from '@/lib/stickers/stickerCatalog';
import { getEarnedStickerIds } from '@/lib/stickers/awardSticker';

export default function StickerBook() {
  const [earnedIds, setEarnedIds] = useState<string[]>([]);

  useEffect(() => {
    setEarnedIds(getEarnedStickerIds());
  }, []);

  const earned = useMemo(() => new Set(earnedIds), [earnedIds]);

  return (
    <section className="rounded-[2rem] border border-pink-200/40 bg-gradient-to-br from-pink-100 via-fuchsia-100 to-violet-100 p-4 text-slate-900 shadow-2xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-700">Sticker Book</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Collected treasures</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-violet-900/75">
            {earnedIds.length} / {stickers.length} stickers collected
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-fuchsia-800 shadow-sm">
          Keep playing to fill every page.
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stickers.map((sticker) => {
          const isEarned = earned.has(sticker.id);
          return (
            <article
              key={sticker.id}
              className={`min-h-40 rounded-2xl border p-4 text-center shadow-sm ${
                isEarned
                  ? 'border-fuchsia-200 bg-white'
                  : 'border-slate-300 bg-white/55 text-slate-500'
              }`}
            >
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl ${
                isEarned ? 'bg-pink-100' : 'bg-slate-200 text-3xl font-black'
              }`}>
                {isEarned ? sticker.emoji : '?'}
              </div>
              <h3 className="mt-3 text-base font-black">{isEarned ? sticker.name : 'Mystery sticker'}</h3>
              <p className={`mt-1 text-xs font-semibold leading-5 ${isEarned ? 'text-fuchsia-700' : 'text-slate-500'}`}>
                {isEarned ? 'Unlocked!' : sticker.hint}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

