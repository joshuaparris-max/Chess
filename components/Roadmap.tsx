'use client';

import { useEffect, useState } from 'react';
import { roadmapStages } from '@/lib/trainingData';
import { loadLearningProgress } from '@/lib/learningProgress';
import { adultPuzzles } from '@/lib/puzzles/adultPuzzles';

const ADULT_PUZZLE_PROGRESS_KEY = 'gm-adult-puzzle-progress-v1';

function countSolvedPuzzles(): number {
  try {
    const raw = localStorage.getItem(ADULT_PUZZLE_PROGRESS_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw) as Record<string, { attempts?: number; solved?: number }>;
    return Object.values(data).filter((r) => (r?.solved ?? 0) > 0).length;
  } catch {
    return 0;
  }
}

export default function Roadmap() {
  const [lessonsDone, setLessonsDone] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLessonsDone(loadLearningProgress().lessonsDone.length);
    setPuzzlesSolved(countSolvedPuzzles());
    setHydrated(true);
  }, []);

  // Progress points blend lessons and solved puzzles so the path responds to real activity.
  const progressPoints = lessonsDone + Math.floor(puzzlesSolved / 5);
  const recommendedStage = Math.min(roadmapStages.length - 1, Math.floor(progressPoints / 2));
  const totalPuzzles = adultPuzzles.length;

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5">
        <h2 className="text-2xl font-bold">Beginner to advanced roadmap</h2>
        <p className="mt-2 max-w-4xl text-slate-300">This is a practical training path, not a promise of a title or rating. The alpha includes local play, puzzles, lessons, watch cards, and milestone tracking. Later versions can add accounts, spaced repetition, interactive game review, rating estimates, and coach-style reports.</p>
        <p className="mt-3 rounded-2xl border border-teal-400/30 bg-teal-400/10 p-3 text-sm text-teal-100">
          Recommended now: Stage {recommendedStage + 1}. You have completed {lessonsDone} lesson{lessonsDone === 1 ? '' : 's'} and solved {puzzlesSolved} puzzle{puzzlesSolved === 1 ? '' : 's'}.
        </p>
      </div>

      {/* Your progress — local, private, stored in this browser only */}
      <div className="glass-panel rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-teal-200">Your progress</h3>
          <span className="text-xs text-slate-500">Saved on this device</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-slate-200">Lessons completed</p>
            <p className="mt-1 text-2xl font-black text-teal-300">{hydrated ? lessonsDone : '—'}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-slate-200">Puzzles solved</p>
            <p className="mt-1 text-2xl font-black text-teal-300">
              {hydrated ? puzzlesSolved : '—'}
              <span className="ml-1 text-sm font-semibold text-slate-500">/ {totalPuzzles}</span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
              <div
                className="h-full rounded-full bg-teal-400 transition-all"
                style={{ width: `${totalPuzzles ? Math.min(100, (puzzlesSolved / totalPuzzles) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Solve puzzles and complete lessons to advance the recommended stage. Every five solved puzzles is worth one step.
        </p>
      </div>

      <div className="space-y-4">
        {roadmapStages.map((stage, index) => {
          const reached = index <= recommendedStage;
          return (
            <article key={stage.band} className={`glass-panel rounded-3xl p-5 ${index === recommendedStage ? 'ring-2 ring-teal-300' : ''}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">Stage {index + 1} · {stage.band} Elo</p>
                  <h3 className="mt-1 text-xl font-bold">{stage.title}</h3>
                  <p className="mt-2 text-slate-300">{stage.focus}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {hydrated && reached && index !== recommendedStage && (
                    <span className="rounded-full border border-teal-400/40 bg-teal-400/10 px-3 py-1 text-sm font-bold text-teal-200">✓ Reached</span>
                  )}
                  <span className="rounded-full bg-teal-300 px-3 py-1 text-sm font-bold text-slate-950">{stage.band}</span>
                  {index === recommendedStage && <span className="rounded-full border border-teal-300 px-3 py-1 text-sm font-bold text-teal-100">Recommended</span>}
                </div>
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
          );
        })}
      </div>
    </section>
  );
}
