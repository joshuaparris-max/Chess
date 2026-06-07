'use client';

import { useEffect, useMemo, useState } from 'react';
import PlayTrainer from '@/components/PlayTrainer';
import PuzzleTrainer from '@/components/PuzzleTrainer';
import LearnPath from '@/components/LearnPath';
import WatchRoom from '@/components/WatchRoom';
import Roadmap from '@/components/Roadmap';
import type { AppMode } from '@/lib/types';

const modes: { id: AppMode; label: string; tagline: string }[] = [
  { id: 'play', label: 'Play', tagline: 'Train against adaptive bots' },
  { id: 'puzzles', label: 'Puzzles', tagline: 'Build pattern recognition' },
  { id: 'learn', label: 'Learn', tagline: 'Micro-lessons from elite traits' },
  { id: 'watch', label: 'Watch', tagline: 'Model-game ideas' },
  { id: 'roadmap', label: 'Roadmap', tagline: 'Beginner to mastery path' },
];

function modeContent(mode: AppMode) {
  switch (mode) {
    case 'play':
      return <PlayTrainer />;
    case 'puzzles':
      return <PuzzleTrainer />;
    case 'learn':
      return <LearnPath />;
    case 'watch':
      return <WatchRoom />;
    case 'roadmap':
      return <Roadmap />;
  }
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>('play');
  const [studyStreak, setStudyStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(20);

  useEffect(() => {
    const savedStreak = window.localStorage.getItem('gm-alpha-streak');
    const savedGoal = window.localStorage.getItem('gm-alpha-goal');
    if (savedStreak) setStudyStreak(Number(savedStreak));
    if (savedGoal) setDailyGoal(Number(savedGoal));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('gm-alpha-streak', String(studyStreak));
    window.localStorage.setItem('gm-alpha-goal', String(dailyGoal));
  }, [studyStreak, dailyGoal]);

  const active = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="glass-panel rounded-[2rem] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-200">Alpha first slice</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Grandmaster Path</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A Chess.com-style training app foundation: play bots, solve puzzles, learn in tiny modules, study elite-player patterns, and follow a beginner-to-master roadmap.</p>
          </div>
          <div className="grid min-w-72 gap-3 rounded-3xl bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300">Study streak</span>
              <span className="text-2xl font-black text-teal-200">{studyStreak}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-slate-300" htmlFor="daily-goal">Daily goal</label>
              <select id="daily-goal" value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                <option value={10}>10 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
              </select>
            </div>
            <button onClick={() => setStudyStreak((value) => value + 1)} className="rounded-xl bg-yellow-200 px-4 py-2 font-bold text-slate-950 hover:bg-yellow-100">Mark today trained</button>
          </div>
        </div>
      </header>

      <nav className="my-5 grid gap-3 md:grid-cols-5" aria-label="Training modes">
        {modes.map((item) => (
          <button key={item.id} onClick={() => setMode(item.id)} className={`rounded-3xl border p-4 text-left transition ${mode === item.id ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-slate-600/50 bg-slate-900/70 text-slate-100 hover:border-teal-200/70 hover:bg-slate-800'}`}>
            <span className="block text-lg font-black">{item.label}</span>
            <span className={`mt-1 block text-sm ${mode === item.id ? 'text-slate-800' : 'text-slate-400'}`}>{item.tagline}</span>
          </button>
        ))}
      </nav>

      <div className="mb-5 rounded-3xl border border-slate-600/40 bg-slate-950/50 p-4">
        <p className="text-sm text-slate-300"><span className="font-bold text-yellow-200">Current room:</span> {active.label} — {active.tagline}</p>
      </div>

      {modeContent(mode)}

      <footer className="py-8 text-center text-sm text-slate-500">
        Built for Vercel. Alpha engine is a local minimax trainer; Stockfish NNUE, accounts, cloud saves and multiplayer are planned next slices.
      </footer>
    </main>
  );
}
