'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import AdventureBoard from './AdventureBoard';
import CelebrationOverlay from './CelebrationOverlay';
import ReadAloudButton from './ReadAloudButton';

const START: Square = 'b1';
const STARS: Square[] = ['c3', 'e4', 'f6'];

const STEPS = [
  { instruction: 'The knight moves in an L shape — two squares one way, then one square sideways. Can you help it reach the first star?' },
  { instruction: 'Great jump! The knight leapt right over the other squares. Now help it reach the second star.' },
  { instruction: 'One more star! Where can the knight jump next?' },
];

function knightMoves(sq: Square): Square[] {
  const f = sq.charCodeAt(0) - 97;
  const r = parseInt(sq[1]) - 1;
  const out: Square[] = [];
  for (const [df, dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nf = f + df, nr = r + dr;
    if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8)
      out.push(`${'abcdefgh'[nf]}${nr + 1}` as Square);
  }
  return out;
}

export default function KnightTreasureHunt({ onComplete }: { onComplete?: () => void }) {
  const [pos, setPos] = useState<Square>(START);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const legal = knightMoves(pos);
  const target = STARS[step];
  const instruction = STEPS[step]?.instruction ?? '';

  const flash = useCallback((msg: string) => {
    setFeedback(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(null), 2800);
  }, []);

  const restart = () => {
    setPos(START); setStep(0); setDone(false); setFeedback(null);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  const onClick = (sq: Square) => {
    if (done) return;
    if (!legal.includes(sq)) {
      flash('That square is not one of the knight\'s jumps. Look for an L-shape and try again!');
      return;
    }
    if (sq !== target) {
      flash('That\'s a valid knight jump, but the star is somewhere else. Keep looking!');
      return;
    }
    setPos(sq);
    setFeedback(null);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (step + 1 >= STARS.length) {
      setDone(true);
      onComplete?.();
    } else {
      setStep(s => s + 1);
    }
  };

  if (done) {
    return (
      <CelebrationOverlay
        heading="All three stars collected!"
        body="The knight finished the treasure hunt!"
        boardPrompt="Now set this up on your real chessboard together."
        onPlayAgain={restart}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-base leading-relaxed text-slate-100">{instruction}</p>
        <ReadAloudButton text={instruction} />
      </div>

      {feedback && (
        <div role="status" className="mb-3 rounded-2xl border border-orange-300/40 bg-orange-950/30 p-3 text-center text-sm font-bold text-orange-100">
          {feedback}
        </div>
      )}

      <AdventureBoard
        pieces={[{ square: pos, symbol: '♘', label: 'white knight' }]}
        targets={[target]}
        legalMoves={legal}
        onSquareClick={onClick}
      />

      <div className="mb-4 flex justify-center gap-3" aria-label={`${step} of ${STARS.length} stars collected`}>
        {STARS.map((_, i) => (
          <span key={i} className={`text-2xl transition-all ${i < step ? 'opacity-100' : 'opacity-20'}`} aria-hidden="true">⭐</span>
        ))}
      </div>

      <button onClick={restart} className="w-full rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95">
        Start over
      </button>
    </div>
  );
}
