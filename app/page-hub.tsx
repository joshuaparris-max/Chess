'use client';

import { useEffect, useMemo, useState } from 'react';
import PlayTrainer from '@/components/PlayTrainer';
import PuzzleTrainer from '@/components/PuzzleTrainer';
import LearnPath from '@/components/LearnPath';
import WatchRoom from '@/components/WatchRoom';
import Roadmap from '@/components/Roadmap';
import FamilyHub from '@/components/FamilyHub';
import CloudSyncPanel from '@/components/CloudSyncPanel';
import StickerBook from '@/components/StickerBook';
import StoryMode from '@/components/story/StoryMode';
import Resources from '@/components/Resources';
import XpBadge from '@/components/XpBadge';
import QuestLog from '@/components/QuestLog';
import SettingsMenu from '@/components/SettingsMenu';
import { useSectionVisibility } from '@/lib/settings/uiSettings';
import type { AppMode } from '@/lib/types';

const modes: { id: AppMode; label: string; tagline: string }[] = [
  { id: 'play', label: 'Play', tagline: 'Train against adaptive bots' },
  { id: 'puzzles', label: 'Puzzles', tagline: 'Build pattern recognition' },
  { id: 'learn', label: 'Learn', tagline: 'Micro-lessons from elite traits' },
  { id: 'watch', label: 'Watch', tagline: 'Model-game ideas' },
  { id: 'roadmap', label: 'Roadmap', tagline: 'Beginner to advanced path' },
  { id: 'family', label: 'Family Chess', tagline: 'Play, learn & explore together' },
  { id: 'stickers', label: 'Sticker Book', tagline: 'Collect story rewards' },
  { id: 'story', label: 'Princess Story 👑', tagline: 'Rescue the Fairy Queen' },
  { id: 'resources', label: 'Resources', tagline: 'Free chess books, audio, tools, and training links' },
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    case 'family':
      return <FamilyHub />;
    case 'stickers':
      return <StickerBook />;
    case 'story':
      return <StoryMode />;
    case 'resources':
      return <Resources />;
  }
}

export default function Home({ initialMode = 'play' }: { initialMode?: AppMode }) {
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [theme, setTheme] = useState<'adult' | 'family'>('adult');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [lastTrained, setLastTrained] = useState<string | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const visible = useSectionVisibility();

  useEffect(() => {
    try {
      const savedStreak = window.localStorage.getItem('gm-alpha-streak');
      const savedGoal = window.localStorage.getItem('gm-alpha-goal');
      const savedLastTrained = window.localStorage.getItem('gm-alpha-last-trained');
      const parsedStreak = Number(savedStreak);
      const parsedGoal = Number(savedGoal);
      if (Number.isFinite(parsedStreak) && parsedStreak >= 0) setStudyStreak(parsedStreak);
      if ([10, 20, 30, 45].includes(parsedGoal)) setDailyGoal(parsedGoal);
      if (savedLastTrained) setLastTrained(savedLastTrained);
    } catch {
      // The app remains usable when browser storage is unavailable.
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('gmp-theme');
    if (saved === 'adult' || saved === 'family') setTheme(saved);
    else if (initialMode === 'family') setTheme('family');
    setThemeLoaded(true);
  }, [initialMode]);

  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('gmp-theme', theme);
  }, [theme, themeLoaded]);

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent).detail;
      if (nextTheme === 'adult' || nextTheme === 'family') setTheme(nextTheme);
    };
    window.addEventListener('gmp-theme-change', onThemeChange);
    return () => window.removeEventListener('gmp-theme-change', onThemeChange);
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    try {
      window.localStorage.setItem('gm-alpha-streak', String(studyStreak));
      window.localStorage.setItem('gm-alpha-goal', String(dailyGoal));
      if (lastTrained) window.localStorage.setItem('gm-alpha-last-trained', lastTrained);
    } catch {
      // The current session still works even if persistence is blocked.
    }
  }, [dailyGoal, lastTrained, progressLoaded, studyStreak]);

  const markTodayTrained = () => {
    const today = localDateKey();
    if (lastTrained === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setStudyStreak(lastTrained === localDateKey(yesterday) ? (value) => value + 1 : 1);
    setLastTrained(today);
  };

  const active = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const trainedToday = lastTrained === localDateKey();
  const chooseMode = (nextMode: AppMode) => {
    setMode(nextMode);
    window.history.pushState({}, '', `/${nextMode}`);
  };

  useEffect(() => {
    const syncFromPath = () => {
      const pathMode = window.location.pathname.slice(1) as AppMode;
      if (modes.some((item) => item.id === pathMode)) setMode(pathMode);
    };
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="glass-panel rounded-[2rem] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-200">Alpha first slice</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Grandmaster Path</h1>
            {visible('intro') && (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A Chess.com-style training app foundation: play bots, solve puzzles, learn in tiny modules, study elite-player patterns, and follow a beginner-to-advanced roadmap.</p>
            )}
          </div>
          <div className="grid min-w-72 gap-3 rounded-3xl bg-slate-950/60 p-4">
            <SettingsMenu />
            {visible('statsPanel') && (
              <>
                <XpBadge />
                <QuestLog />
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
                <button disabled={trainedToday} onClick={markTodayTrained} className="rounded-xl bg-yellow-200 px-4 py-2 font-bold text-slate-950 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300">{trainedToday ? 'Today complete' : 'Mark today trained'}</button>
                <CloudSyncPanel />
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="my-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7" aria-label="Training modes">
        {modes.map((item) => (
          <button key={item.id} onClick={() => chooseMode(item.id)} className={`rounded-3xl border p-4 text-left transition ${mode === item.id ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-slate-600/50 bg-slate-900/70 text-slate-100 hover:border-teal-200/70 hover:bg-slate-800'}`}>
            <span className="block text-lg font-black">{item.label}</span>
            <span className={`mt-1 block text-sm ${mode === item.id ? 'text-slate-800' : 'text-slate-400'}`}>{item.tagline}</span>
          </button>
        ))}
      </nav>

      {visible('explore') && (
        <section className="mb-5 rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4" aria-label="Explore more">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Explore more</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Train', links: [
                { href: '/puzzles/rush', label: 'Puzzle Rush' },
                { href: '/puzzles/streak', label: 'Puzzle Streak' },
                { href: '/puzzles/duel', label: 'Puzzle Duel' },
              ] },
              { title: 'Adventure', links: [
                { href: '/bosses', label: 'Boss Battles' },
                { href: '/story', label: 'Princess Story' },
              ] },
              { title: 'Progress', links: [
                { href: '/profile', label: 'Character Sheet' },
                { href: '/family/leaderboard', label: 'Family Leaderboard' },
                { href: '/report', label: 'Parent Report' },
              ] },
            ].map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-sm font-black text-slate-200">{group.title}</p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="rounded-2xl border border-slate-600/60 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-100 transition hover:border-teal-300/70 hover:bg-slate-800"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {visible('modeHint') && (
        <p className="mb-5 text-center text-xs text-slate-400">Adult training: Play, Puzzles, Learn, Watch, Roadmap ? Shared child-friendly activities: Family Chess</p>
      )}

      {visible('currentRoom') && (
        <div className="mb-5 rounded-3xl border border-slate-600/40 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-300"><span className="font-bold text-yellow-200">Current room:</span> {active.label} - {active.tagline}</p>
        </div>
      )}

      {modeContent(mode)}

      <footer className="py-8 text-center text-sm text-slate-500">
        Built for Vercel. Stockfish powers computer play, with an Alpha Bot fallback if the engine cannot load.
      </footer>
    </main>
  );
}
