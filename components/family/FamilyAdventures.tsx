'use client';

import { useState } from 'react';
import { useLocalProgress } from '@/lib/familyProgress';
import KnightTreasureHunt from './KnightTreasureHunt';
import RookRace from './RookRace';
import BishopDiagonalTrail from './BishopDiagonalTrail';
import PawnToQueen from './PawnToQueen';

type AdventureId = 'knight' | 'rook' | 'bishop' | 'pawn';

const ADVENTURES: {
  id: AdventureId;
  label: string;
  icon: string;
  tagline: string;
  colour: string;
}[] = [
  { id: 'knight', label: 'Knight Treasure Hunt', icon: '♘', tagline: 'Leap in L-shapes to collect three stars!', colour: 'border-teal-400/50 bg-teal-950/30 hover:bg-teal-950/50' },
  { id: 'rook',   label: 'Rook Race',             icon: '♖', tagline: 'Slide in straight lines to reach all three flags!', colour: 'border-violet-400/50 bg-violet-950/30 hover:bg-violet-950/50' },
  { id: 'bishop', label: 'Bishop Diagonal Trail', icon: '♗', tagline: 'Follow the diagonal path across the board!', colour: 'border-amber-400/50 bg-amber-950/30 hover:bg-amber-950/50' },
  { id: 'pawn',   label: 'Pawn to Queen',         icon: '♙', tagline: 'March the pawn forward and help it promote!', colour: 'border-rose-400/50 bg-rose-950/30 hover:bg-rose-950/50' },
];

export default function FamilyAdventures() {
  const { progress, markAdventureDone } = useLocalProgress();
  const [active, setActive] = useState<AdventureId | null>(null);

  const onComplete = (id: AdventureId) => markAdventureDone(id);

  if (active) {
    const meta = ADVENTURES.find(a => a.id === active)!;
    return (
      <div>
        <button
          onClick={() => setActive(null)}
          className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
        >
          ← Back to adventures
        </button>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 px-4 py-3">
          <span className="text-3xl" aria-hidden="true">{meta.icon}</span>
          <div>
            <h2 className="font-black text-lg text-slate-100">{meta.label}</h2>
            <p className="text-sm text-slate-400">{meta.tagline}</p>
          </div>
          {progress.adventuresDone.includes(active) && (
            <span className="ml-auto text-yellow-300 text-xl" title="Completed">⭐</span>
          )}
        </div>
        {active === 'knight' && <KnightTreasureHunt onComplete={() => onComplete('knight')} />}
        {active === 'rook'   && <RookRace          onComplete={() => onComplete('rook')}   />}
        {active === 'bishop' && <BishopDiagonalTrail onComplete={() => onComplete('bishop')} />}
        {active === 'pawn'   && <PawnToQueen       onComplete={() => onComplete('pawn')}   />}
      </div>
    );
  }

  const doneCount = ADVENTURES.filter(a => progress.adventuresDone.includes(a.id)).length;

  return (
    <div>
      <div className="mb-5 rounded-3xl border border-slate-600/50 bg-slate-900/60 p-5 text-center">
        <h2 className="text-2xl font-black text-slate-100">Chess Adventures</h2>
        <p className="mt-1 text-slate-400 text-sm">
          {doneCount === 0 ? 'Pick an adventure and learn how each piece moves!' : `${doneCount} of 4 adventures completed`}
        </p>
        {doneCount === 4 && <p className="mt-2 text-yellow-300 font-bold">All adventures complete! ⭐⭐⭐⭐</p>}
      </div>

      <div className="flex flex-col gap-3">
        {ADVENTURES.map((a) => {
          const done = progress.adventuresDone.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-95 ${a.colour}`}
            >
              <span className="text-4xl" aria-hidden="true">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-100 text-base">{a.label}</p>
                <p className="text-sm text-slate-400 mt-0.5">{a.tagline}</p>
              </div>
              <span className={`shrink-0 text-2xl transition ${done ? 'opacity-100' : 'opacity-20'}`} aria-label={done ? 'Completed' : 'Not yet completed'}>⭐</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
