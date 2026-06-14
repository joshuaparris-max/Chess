'use client';

import { useState } from 'react';
import { useLocalProgress } from '@/lib/familyProgress';
import FamilyPlay from './FamilyPlay';
import FamilyAdventures from './family/FamilyAdventures';
import FamilyPuzzles from './family/FamilyPuzzles';
import FamilyLessons from './family/FamilyLessons';
import FamilyProgressView from './family/FamilyProgressView';

type Tab = 'play' | 'adventures' | 'puzzles' | 'lessons' | 'progress';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'play',       label: 'Play Together', icon: '♟' },
  { id: 'adventures', label: 'Adventures',    icon: '⭐' },
  { id: 'puzzles',    label: 'Puzzles',       icon: '🧩' },
  { id: 'lessons',    label: 'Lessons',       icon: '📖' },
  { id: 'progress',   label: 'Progress',      icon: '🏆' },
];

export default function FamilyHub() {
  const [tab, setTab] = useState<Tab>('play');
  const { progress } = useLocalProgress();

  const adventuresDone = progress.adventuresDone.length;
  const lessonsDone    = progress.lessonsDone.length;
  const puzzleStars    = Object.values(progress.puzzleStars).reduce((s, v) => s + v, 0);

  function badge(t: Tab) {
    if (t === 'adventures' && adventuresDone > 0) return `${adventuresDone}/4`;
    if (t === 'lessons'    && lessonsDone    > 0) return `${lessonsDone}/5`;
    if (t === 'puzzles'    && puzzleStars    > 0) return `${puzzleStars}⭐`;
    return null;
  }

  return (
    <section className="mx-auto max-w-2xl">
      {/* Top nav */}
      <div className="mb-5 rounded-3xl border border-slate-600/40 bg-slate-900/60 p-2">
        <nav aria-label="Family chess sections" className="grid grid-cols-5 gap-1">
          {TABS.map(t => {
            const b = badge(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-center transition active:scale-95 ${
                  tab === t.id
                    ? 'bg-teal-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-lg" aria-hidden="true">{t.icon}</span>
                <span className="text-[9px] font-bold leading-none sm:text-[11px]">{t.label}</span>
                {b && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-yellow-300 px-1 text-[8px] font-black text-slate-900 leading-[18px] text-center">
                    {b}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'play'       && <FamilyPlay />}
      {tab === 'adventures' && <FamilyAdventures />}
      {tab === 'puzzles'    && <FamilyPuzzles />}
      {tab === 'lessons'    && <FamilyLessons />}
      {tab === 'progress'   && <FamilyProgressView />}
    </section>
  );
}
