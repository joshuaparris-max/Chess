'use client';

import { useCallback, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import AdventureBoard from './AdventureBoard';
import CelebrationOverlay from './CelebrationOverlay';
import ReadAloudButton from './ReadAloudButton';

// Bishop starts on c1 (dark square).
// Blocker pawn at g5 — blocks the c1→h6 NE diagonal after f4.
// Stage 1: c1 → f4 (NE, stops before g5 blocker)
// Stage 2: f4 → e5 (NW, one square)
// Stage 3: e5 → g7 (NE, 2 squares)
const START: Square = 'c1';
const BLOCKER: Square = 'g5';
const TARGETS: Square[] = ['f4', 'e5', 'g7'];

const STEPS = [
  { instruction: 'Bishops slide diagonally — corner to corner. There is a pawn on g5. The bishop cannot jump over it, but can reach the trail marker on f4. Can you get there?' },
  { instruction: 'Perfect diagonal! Bishops always stay on the same colour. Now slide back one diagonal step to e5.' },
  { instruction: 'One more diagonal dash — slide to g7 to complete the trail!' },
];

function bishopMoves(sq: Square, blockers: Square[]): Square[] {
  const f = sq.charCodeAt(0) - 97;
  const r = parseInt(sq[1]) - 1;
  const out: Square[] = [];
  for (const [df, dr] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    let nf = f + df, nr = r + dr;
    while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      const t = `${'abcdefgh'[nf]}${nr + 1}` as Square;
      if (blockers.includes(t)) break;
      out.push(t);
      nf += df; nr += dr;
    }
  }
  return out;
}

export default function BishopDiagonalTrail({ onComplete }: { onComplete?: () => void }) {
  const [pos, setPos] = useState<Square>(START);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show blocker only in stage 0 when it blocks the active path
  const activeBlockers = step === 0 ? [BLOCKER] : [];
  const legal = bishopMoves(pos, activeBlockers);
  const target = TARGETS[step];
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
      flash('Bishops only move diagonally, and they cannot jump over pieces. Have another look!');
      return;
    }
    if (sq !== target) {
      flash('That\'s a valid diagonal, but the trail marker is somewhere else. Look at the star!');
      return;
    }
    setPos(sq);
    setFeedback(null);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (step + 1 >= TARGETS.length) {
      setDone(true);
      onComplete?.();
    } else {
      setStep(s => s + 1);
    }
  };

  if (done) {
    return (
      <CelebrationOverlay
        heading="Trail complete!"
        body="The bishop stayed on the diagonal the whole way!"
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
        pieces={[{ square: pos, symbol: '♗', label: 'white bishop' }]}
        targets={[target]}
        legalMoves={legal}
        blockers={activeBlockers}
        blockerSymbol="♙"
        blockerLabel="pawn blocker"
        onSquareClick={onClick}
      />

      <div className="mb-4 flex justify-center gap-3" aria-label={`${step} of ${TARGETS.length} markers reached`}>
        {TARGETS.map((_, i) => (
          <span key={i} className={`text-2xl transition-all ${i < step ? 'opacity-100' : 'opacity-20'}`} aria-hidden="true">⭐</span>
        ))}
      </div>

      <button onClick={restart} className="w-full rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95">
        Start over
      </button>
    </div>
  );
}
