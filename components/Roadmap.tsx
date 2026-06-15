'use client';

import { useEffect, useState } from 'react';
import { roadmapStages } from '@/lib/trainingData';
import { loadLearningProgress } from '@/lib/learningProgress';

export default function Roadmap() {
  const [lessonsDone, setLessonsDone] = useState(0);
  useEffect(() => setLessonsDone(loadLearningProgress().lessonsDone.length), []);
  const recommendedStage = Math.min(roadmapStages.length - 1, Math.floor(lessonsDone / 2));

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5">
        <h2 className="text-2xl font-bold">Beginner to advanced roadmap</h2>
        <p className="mt-2 max-w-4xl text-slate-300">This is a practical training path, not a promise of a title or rating. The alpha includes local play, puzzles, lessons, watch cards, and milestone tracking. Later versions can add accounts, spaced repetition, interactive game review, rating estimates, and coach-style reports.</p>
        <p className="mt-3 rounded-2xl border border-teal-400/30 bg-teal-400/10 p-3 text-sm text-teal-100">
          Recommended now: Stage {recommendedStage + 1}. You have completed {lessonsDone} lesson{lessonsDone === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="space-y-4">
        {roadmapStages.map((stage, index) => (
          <article key={stage.band} className={`glass-panel rounded-3xl p-5 ${index === recommendedStage ? 'ring-2 ring-teal-300' : ''}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">Stage {index + 1} · {stage.band} Elo</p>
                <h3 className="mt-1 text-xl font-bold">{stage.title}</h3>
                <p className="mt-2 text-slate-300">{stage.focus}</p>
              </div>
              <span className="rounded-full bg-teal-300 px-3 py-1 text-sm font-bold text-slate-950">{stage.band}</span>
              {index === recommendedStage && <span className="rounded-full border border-teal-300 px-3 py-1 text-sm font-bold text-teal-100">Recommended</span>}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <h4 className="font-bold text-teal-200">Unlocks</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {stage.unlocks.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <h4 className="font-bold text-teal-200">Habits</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {stage.habits.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
