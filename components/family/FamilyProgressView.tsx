'use client';

import { useState } from 'react';
import { useLocalProgress } from '@/lib/familyProgress';

const ADVENTURES = [
  { id: 'knight', label: 'Knight Treasure Hunt', icon: '♘' },
  { id: 'rook',   label: 'Rook Race',             icon: '♖' },
  { id: 'bishop', label: 'Bishop Diagonal Trail', icon: '♗' },
  { id: 'pawn',   label: 'Pawn to Queen',         icon: '♙' },
];

const LESSONS = [
  { id: 'pieces',   label: 'How Each Piece Moves' },
  { id: 'check',    label: 'Check: Keep the King Safe' },
  { id: 'castling', label: 'Castling' },
  { id: 'values',   label: 'Trading Pieces: What Are They Worth?' },
  { id: 'centre',   label: 'Playing Towards the Centre' },
];

const PUZZLE_COUNT = 10;
const MAX_PUZZLE_STARS = 3; // per puzzle

export default function FamilyProgressView() {
  const { progress, resetProgress } = useLocalProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const adventuresDone = ADVENTURES.filter(a => progress.adventuresDone.includes(a.id)).length;
  const lessonsDone    = LESSONS.filter(l => progress.lessonsDone.includes(l.id)).length;
  const totalStars     = Object.values(progress.puzzleStars).reduce((s, v) => s + v, 0);
  const maxStars       = PUZZLE_COUNT * MAX_PUZZLE_STARS;
  const puzzlesDone    = Object.values(progress.puzzleStars).filter(s => s > 0).length;

  const totalScore = adventuresDone * 10 + lessonsDone * 5 + totalStars;

  const handleReset = () => {
    resetProgress();
    setConfirmReset(false);
  };

  return (
    <div>
      <div className="mb-5 rounded-3xl border border-slate-600/50 bg-slate-900/60 p-5 text-center">
        <h2 className="text-2xl font-black text-slate-100">Family Progress</h2>
        <p className="mt-2 text-4xl font-black text-yellow-300">{totalScore} <span className="text-base font-bold text-slate-400">points</span></p>
        <p className="mt-1 text-sm text-slate-400">Adventures + Lessons + Puzzle stars</p>
      </div>

      {/* Adventures */}
      <div className="mb-4 rounded-2xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center justify-between font-black text-slate-100">
          <span>Adventures</span>
          <span className="text-sm font-bold text-slate-400">{adventuresDone} / 4</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ADVENTURES.map(a => {
            const done = progress.adventuresDone.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${done ? 'border-yellow-300/50 bg-yellow-950/20' : 'border-slate-700/50 bg-slate-900/30 opacity-50'}`}
              >
                <span className="text-2xl" aria-hidden="true">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-300 truncate">{a.label}</p>
                  <p className={`text-xs font-bold ${done ? 'text-yellow-300' : 'text-slate-600'}`}>{done ? '⭐ Done' : 'Not yet'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Puzzles */}
      <div className="mb-4 rounded-2xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center justify-between font-black text-slate-100">
          <span>Puzzles</span>
          <span className="text-sm font-bold text-slate-400">{totalStars} / {maxStars} stars</span>
        </h3>
        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all"
            style={{ width: `${maxStars > 0 ? (totalStars / maxStars) * 100 : 0}%` }}
            role="progressbar"
            aria-valuenow={totalStars}
            aria-valuemax={maxStars}
            aria-valuemin={0}
            aria-label={`${totalStars} of ${maxStars} puzzle stars earned`}
          />
        </div>
        <p className="text-xs text-slate-400">{puzzlesDone} of {PUZZLE_COUNT} puzzles attempted · earn up to 3 stars each</p>
      </div>

      {/* Lessons */}
      <div className="mb-5 rounded-2xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center justify-between font-black text-slate-100">
          <span>Lessons</span>
          <span className="text-sm font-bold text-slate-400">{lessonsDone} / 5</span>
        </h3>
        <div className="flex flex-col gap-1.5">
          {LESSONS.map(l => {
            const done = progress.lessonsDone.includes(l.id);
            return (
              <div key={l.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${done ? 'border-teal-300/40 bg-teal-950/20' : 'border-slate-700/50 opacity-50'}`}>
                <span className={`text-sm font-black ${done ? 'text-teal-300' : 'text-slate-600'}`}>{done ? '✓' : '○'}</span>
                <span className="text-sm text-slate-300">{l.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge */}
      {adventuresDone === 4 && lessonsDone === 5 && puzzlesDone >= 5 && (
        <div className="mb-5 rounded-2xl border-2 border-yellow-300/60 bg-yellow-950/20 p-4 text-center">
          <p className="text-3xl mb-1">🏆</p>
          <p className="font-black text-yellow-200 text-lg">Chess Explorer Badge!</p>
          <p className="text-sm text-slate-300 mt-1">You have completed all adventures, all lessons, and solved puzzles together. Amazing work!</p>
        </div>
      )}

      {/* Reset */}
      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full rounded-2xl border border-slate-700 py-3 text-sm font-bold text-slate-500 hover:text-slate-300 hover:border-slate-600 active:scale-95"
        >
          Reset all progress
        </button>
      ) : (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/20 p-4 text-center">
          <p className="mb-3 text-sm font-bold text-red-100">Are you sure? This will erase all adventures, puzzles, and lessons.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-xl border border-slate-600 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-black text-white hover:bg-red-500"
            >
              Yes, reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
