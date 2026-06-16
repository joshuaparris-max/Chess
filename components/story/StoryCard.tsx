'use client';

import type { ReactNode } from 'react';

type StoryCardProps = {
  emoji: string;
  title: string;
  story: string;
  footer?: ReactNode;
  badge?: string;
  locked?: boolean;
};

export default function StoryCard({ emoji, title, story, footer, badge, locked }: StoryCardProps) {
  return (
    <article className="rounded-[2rem] border border-slate-600 bg-gradient-to-br from-slate-950/95 to-slate-900/70 p-6 shadow-[0_30px_80px_-30px_rgba(112,76,245,0.55)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-4xl leading-none">{emoji}</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
        </div>
        {locked ? (
          <span className="rounded-2xl bg-slate-800/90 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">Locked</span>
        ) : badge ? (
          <span className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-emerald-200">{badge}</span>
        ) : null}
      </div>
      <p className="mt-5 text-slate-300 leading-7">{story}</p>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </article>
  );
}
