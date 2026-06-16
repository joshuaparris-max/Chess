'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-teal-300 transition hover:text-teal-200">
            ♞ Grandmaster Path
          </Link>
          <div className="hidden gap-8 md:flex">
            <Link href="/play" className="text-sm font-bold text-slate-300 transition hover:text-teal-300">
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
        {/* Hero Section */}
        <div className="mb-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl">
              Play chess. Learn one step at a time.
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Friendly bots, quick puzzles and guided lessons—without feeling overwhelmed.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/play"
                className="rounded-lg bg-teal-400 px-8 py-4 text-lg font-bold text-slate-950 text-center transition hover:bg-teal-300"
              >
                Play your first game
              </Link>
              <Link
                href="/puzzles"
                className="flex items-center justify-center rounded-lg border border-teal-400 px-8 py-4 text-lg font-bold text-teal-400 transition hover:bg-teal-400 hover:text-slate-950"
              >
                Try a puzzle
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">No account needed.</p>
          </div>

          {/* Illustration placeholder */}
          <div className="flex items-center justify-center">
            <div className="relative h-80 w-80 rounded-3xl bg-gradient-to-br from-teal-500/20 to-slate-700/20 p-8 ring-1 ring-teal-500/20">
              <div className="flex h-full items-center justify-center text-6xl">♞</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-12">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Play Card */}
            <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition hover:border-teal-400 hover:bg-slate-900">
              <div className="mb-4 text-4xl">♚</div>
              <h3 className="text-2xl font-black text-white">Play a friendly bot</h3>
              <p className="mt-3 text-slate-300">Practise at your level. Beginners are welcome.</p>
              <Link
                href="/play"
                className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-300"
              >
                Play now
              </Link>
            </div>

            {/* Puzzles Card */}
            <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition hover:border-teal-400 hover:bg-slate-900">
              <div className="mb-4 text-4xl">💡</div>
              <h3 className="text-2xl font-black text-white">Solve a quick puzzle</h3>
              <p className="mt-3 text-slate-300">Find the best move with helpful hints.</p>
              <Link
                href="/puzzles"
                className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-300"
              >
                Try a puzzle
              </Link>
            </div>

            {/* Learn Card */}
            <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition hover:border-teal-400 hover:bg-slate-900">
              <div className="mb-4 text-4xl">📚</div>
              <h3 className="text-2xl font-black text-white">Learn the basics</h3>
              <p className="mt-3 text-slate-300">Small lessons that take just a few minutes.</p>
              <Link
                href="/learn"
                className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-300"
              >
                Start learning
              </Link>
            </div>
          </div>
        </div>

        {/* Family Chess Section */}
        <div className="rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-white">Playing together?</h2>
            <p className="mt-3 text-lg text-slate-300">
              Explore child-friendly chess stories and family activities.
            </p>
            <Link
              href="/family"
              className="mt-6 inline-block rounded-lg bg-teal-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-300"
            >
              Open Family Chess
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/50 py-8 text-center text-sm text-slate-500">
        <p>A friendly place to play, practise and grow at chess.</p>
      </footer>
    </div>
  );
}
