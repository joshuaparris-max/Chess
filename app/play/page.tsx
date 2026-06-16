'use client';

import { useState } from 'react';
import PlayTrainer from '@/components/PlayTrainer';
import BeginnerModal from '@/components/BeginnerModal';
import Link from 'next/link';

export default function PlayPage() {
  const [showGame, setShowGame] = useState(false);
  const [showBeginnerModal, setShowBeginnerModal] = useState(true);

  if (showGame) {
    return <PlayTrainer />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-teal-300 transition hover:text-teal-200">
            ♞ Grandmaster Path
          </Link>
          <div className="hidden gap-8 md:flex">
            <Link href="/play" className="text-sm font-bold text-teal-300 transition">
              Play
            </Link>
            <Link href="/puzzles" className="text-sm font-bold text-slate-300 transition hover:text-teal-300">
              Puzzles
            </Link>
            <Link href="/learn" className="text-sm font-bold text-slate-300 transition hover:text-teal-300">
              Learn
            </Link>
            <Link href="/family" className="text-sm font-bold text-slate-300 transition hover:text-teal-300">
              Family
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/50 p-8">
          <h1 className="text-4xl font-black text-white sm:text-5xl">Ready to play?</h1>
          <p className="mt-4 text-lg text-slate-300">
            Choose how you'd like to play, and we'll set things up for you.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Play against bot */}
            <button
              onClick={() => setShowBeginnerModal(true)}
              className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-8 text-left transition hover:border-teal-400 hover:bg-slate-900"
            >
              <div className="text-5xl mb-3">♚</div>
              <h2 className="text-2xl font-black text-white group-hover:text-teal-300">
                Play against a friendly bot
              </h2>
              <p className="mt-3 text-slate-300">
                Practice at your level, from beginner to advanced.
              </p>
              <div className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition group-hover:bg-teal-300">
                Start here →
              </div>
            </button>

            {/* Two player */}
            <button
              onClick={() => {
                // Set game mode to two-player
                try {
                  const settings = JSON.parse(localStorage.getItem('gm-play-settings-v1') || '{}');
                  settings.gameMode = 'two-player';
                  localStorage.setItem('gm-play-settings-v1', JSON.stringify(settings));
                } catch {
                  // fallback
                }
                setShowGame(true);
              }}
              className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-8 text-left transition hover:border-teal-400 hover:bg-slate-900"
            >
              <div className="text-5xl mb-3">👥</div>
              <h2 className="text-2xl font-black text-white group-hover:text-teal-300">
                Play with someone beside me
              </h2>
              <p className="mt-3 text-slate-300">
                Pass and play mode. No login required.
              </p>
              <div className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition group-hover:bg-teal-300">
                Play now →
              </div>
            </button>
          </div>

          {/* Advanced options link */}
          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="text-sm font-bold text-slate-400 transition hover:text-teal-300"
            >
              Advanced game options →
            </Link>
          </div>
        </div>
      </main>

      {/* Beginner Modal */}
      <BeginnerModal
        isOpen={showBeginnerModal && !showGame}
        onClose={() => setShowBeginnerModal(false)}
        onStart={() => setShowGame(true)}
      />
    </div>
  );
}
