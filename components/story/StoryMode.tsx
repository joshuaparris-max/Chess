'use client';

import { chapters } from '@/lib/story/chapters';

export default function StoryMode() {
  return (
    <section className="rounded-[2rem] border border-pink-200/40 bg-pink-50 p-6 text-slate-900">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-700">Princess Story</p>
      <h2 className="mt-2 text-3xl font-black">Choose a chapter</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {chapters.map((chapter) => (
          <article key={chapter.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-4xl">{chapter.emoji}</div>
            <h3 className="mt-3 font-black">{chapter.title}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">{chapter.instruction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

