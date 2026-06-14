'use client';

import { useMemo } from 'react';

type Props = {
  emoji?: string;
  heading: string;
  body: string;
  boardPrompt?: string;
  onPlayAgain: () => void;
  playAgainLabel?: string;
};

export default function CelebrationOverlay({
  emoji = '🎉',
  heading,
  body,
  boardPrompt,
  onPlayAgain,
  playAgainLabel = 'Play again',
}: Props) {
  // Deterministic positions — no Math.random (breaks SSR resume)
  const stars = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: (i * 37 + 11) % 100,
      y: (i * 53 + 7) % 100,
      delay: ((i * 15) % 100) / 100,
      dur: 0.9 + (i % 3) * 0.35,
      size: 14 + (i % 4) * 7,
    })),
  []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border-2 border-yellow-300/60 bg-slate-950/95 p-8 text-center shadow-2xl"
    >
      {/* Stars — hidden when prefers-reduced-motion */}
      <div aria-hidden="true" className="motion-safe:block motion-reduce:hidden">
        {stars.map(s => (
          <span
            key={s.id}
            className="pointer-events-none absolute select-none animate-bounce text-yellow-300 opacity-75"
            style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
          >
            ⭐
          </span>
        ))}
      </div>

      <div className="relative z-10">
        <p className="text-5xl" aria-hidden="true">{emoji}</p>
        <h3 className="mt-3 text-2xl font-black text-yellow-200">{heading}</h3>
        <p className="mt-2 text-lg text-slate-100">{body}</p>
        {boardPrompt && (
          <p className="mt-4 rounded-2xl border border-teal-300/40 bg-teal-950/40 p-4 text-base font-bold text-teal-100">
            {boardPrompt}
          </p>
        )}
        <button
          onClick={onPlayAgain}
          className="mt-6 min-h-[52px] w-full rounded-2xl bg-teal-400 px-6 py-3 text-lg font-black text-slate-950 hover:bg-teal-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          {playAgainLabel}
        </button>
      </div>
    </div>
  );
}
