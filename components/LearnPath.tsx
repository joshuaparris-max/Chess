'use client';

import { useEffect, useState } from 'react';
import { lessons, researchPillars } from '@/lib/trainingData';
import { loadLearningProgress, saveLearningProgress, type LearningProgress } from '@/lib/learningProgress';
import ReadAloudButton from './family/ReadAloudButton';

// Per-step drill completion, stored locally on this device only.
const DRILLS_KEY = 'gm-lesson-drills-v1';

function loadDrills(): Record<string, number[]> {
  try { return JSON.parse(localStorage.getItem(DRILLS_KEY) || '{}'); } catch { return {}; }
}
function saveDrills(value: Record<string, number[]>) {
  try { localStorage.setItem(DRILLS_KEY, JSON.stringify(value)); } catch { /* ignore */ }
}

export default function LearnPath() {
  const [progress, setProgress] = useState<LearningProgress>({ lessonsDone: [], puzzleAttempts: {} });
  const [drills, setDrills] = useState<Record<string, number[]>>({});

  useEffect(() => {
    setProgress(loadLearningProgress());
    setDrills(loadDrills());
  }, []);

  const toggleLesson = (id: string) => {
    const lessonsDone = progress.lessonsDone.includes(id)
      ? progress.lessonsDone.filter((item) => item !== id)
      : [...progress.lessonsDone, id];
    const next = { ...progress, lessonsDone };
    setProgress(next);
    saveLearningProgress(next);
  };

  const toggleStep = (lessonId: string, index: number) => {
    setDrills((prev) => {
      const current = new Set(prev[lessonId] ?? []);
      if (current.has(index)) current.delete(index);
      else current.add(index);
      const next = { ...prev, [lessonId]: [...current].sort((a, b) => a - b) };
      saveDrills(next);
      return next;
    });
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {lessons.map((lesson) => {
          const doneSteps = drills[lesson.id] ?? [];
          const totalSteps = lesson.drill.length;
          const allStepsDone = totalSteps > 0 && doneSteps.length >= totalSteps;
          const completed = progress.lessonsDone.includes(lesson.id);
          return (
            <article key={lesson.id} className="glass-panel rounded-3xl p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">{lesson.level} · {lesson.minutes} min</p>
                  <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
                  <p className="mt-2 text-slate-300">{lesson.summary}</p>
                </div>
                <span className="rounded-full border border-teal-300/40 px-3 py-1 text-sm text-teal-100">{lesson.pillar}</span>
                <ReadAloudButton
                  label="Read lesson aloud"
                  text={`${lesson.title}. ${lesson.summary}. Why it matters: ${lesson.whyItMatters}. Drill: ${lesson.drill.join('. ')}`}
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/60 p-4">
                  <h3 className="font-bold text-teal-200">Why it matters</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{lesson.whyItMatters}</p>
                  <p className="mt-3 text-sm text-yellow-100">{lesson.playerLink}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-teal-200">Alpha drill</h3>
                    <span className="text-xs font-semibold text-slate-400">{doneSteps.length}/{totalSteps} done</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {lesson.drill.map((item, i) => {
                      const done = doneSteps.includes(i);
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            onClick={() => toggleStep(lesson.id, i)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm leading-6 transition active:scale-[0.99] ${
                              done
                                ? 'border-teal-400/40 bg-teal-400/10 text-teal-50'
                                : 'border-slate-600/50 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                                done ? 'border-teal-300 bg-teal-400 text-slate-950' : 'border-slate-500 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span>{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {allStepsDone && !completed && (
                <p role="status" className="mt-4 rounded-xl border border-teal-400/30 bg-teal-400/10 p-3 text-sm font-semibold text-teal-100">
                  Nice — every drill step is done. Mark the lesson complete to track it on your roadmap.
                </p>
              )}

              <button
                onClick={() => toggleLesson(lesson.id)}
                className={`mt-4 min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-slate-950 transition ${
                  completed ? 'bg-teal-400' : allStepsDone ? 'bg-teal-300 ring-2 ring-teal-200' : 'bg-teal-400'
                }`}
              >
                {completed ? 'Completed ✓' : 'Mark lesson complete'}
              </button>
            </article>
          );
        })}
      </div>

      <aside className="glass-panel h-fit rounded-3xl p-5">
        <h2 className="text-xl font-bold">Research pillars built in</h2>
        <div className="mt-4 space-y-3">
          {researchPillars.map((pillar) => (
            <div key={pillar.name} className="rounded-2xl border border-slate-600/50 bg-slate-950/50 p-4">
              <h3 className="font-bold text-yellow-200">{pillar.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{pillar.finding}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
