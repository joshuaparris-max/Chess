'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import StoryCard from '@/components/story/StoryCard';
import { chapters, loadStoryProgress, isChapterUnlocked } from '@/lib/story/chapters';

export default function StoryIndexPage() {
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [unlockState, setUnlockState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const progress = loadStoryProgress();
    const nextState = chapters.reduce<Record<number, boolean>>((map, chapter) => {
      map[chapter.id] = isChapterUnlocked(chapter.id, progress.chaptersComplete);
      return map;
    }, {});
    setUnlockState(nextState);
    setProgressLoaded(true);
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-pink-400/20 bg-gradient-to-br from-fuchsia-950/95 to-slate-950/90 p-8 shadow-[0_30px_80px_-30px_rgba(236,72,153,0.5)] text-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-pink-300">Princess Story Mode</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">A fairy tale adventure for Sylvie</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
              Play through three gentle chapters. Rescue the Fairy Queen's crown, clear the enchanted forest, and free the queen with a magical checkmate.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-3xl border border-pink-400/40 bg-pink-500/10 px-5 py-3 text-sm font-semibold text-pink-100 transition hover:bg-pink-500/20"
          >
            Back to home
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <StoryCard
            key={chapter.id}
            emoji={chapter.emoji}
            title={chapter.title}
            story={chapter.story}
            locked={!progressLoaded || !unlockState[chapter.id]}
            footer={
              unlockState[chapter.id] ? (
                <Link
                  href={`/story/${chapter.id}`}
                  className="inline-flex rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300"
                >
                  Play chapter {chapter.id}
                </Link>
              ) : (
                <p className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-400">Complete the previous chapter to unlock.</p>
              )
            }
          />
        ))}
      </div>
    </main>
  );
}
