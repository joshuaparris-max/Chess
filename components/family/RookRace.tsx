'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import AdventureBoard from './AdventureBoard';
import CelebrationOverlay from './CelebrationOverlay';
import ReadAloudButton from './ReadAloudButton';

// Rook on a1, pawn blocker at a5
// Stage 1: a1 → a4 (up, before blocker)
// Stage 2: a4 → e4 (right along rank 4)
// Stage 3: e4 → e8 (up to the top)
const START: Square = 'a1';
const BLOCKER: Square = 'a5';
const TARGETS: Square[] = ['a4', 'e4', 'e8'];

const STEPS = [
  { instruction: 'Rooks move in straight lines — up, down, left or right. There is a pawn on a5. The rook cannot jump over it, but can reach the flag on a4. Can you get there?' },
  { instruction: 'Excellent! Now slide the rook sideways along the rank to reach e4. Rooks can travel as far as they like in a straight line!' },
  { instruction: 'Last flag — slide the rook straight up to e8 and cross the finish line!' },
];

function rookMoves(sq: Square, blockers: Square[]): Square[] {
  const f = sq.charCodeAt(0) - 97;
  const r = parseInt(sq[1]) - 1;
  const out: Square[] = [];
  for (const [df, dr] of [[-1,0],[1,0],[0,-1],[0,1]]) {
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

export default function RookRace({ onComplete }: { onComplete?: () => void }) {
  const [pos, setPos] = useState<Square>(START);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Blocker is only relevant in stage 0 (when rook is on a-file)
  const activeBlockers = step === 0 ? [BLOCKER] : [];
  const legal = rookMoves(pos, activeBlockers);
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
      const onSameFile = sq[0] === pos[0];
      const onSameRank = sq[1] === pos[1];
      if (!onSameFile && !onSameRank) {
        flash('Rooks can only move in straight lines — along a row or up and down a column. Try again!');
      } else {
        flash('The rook moves straight, but something is blocking the way! It cannot jump over other pieces.');
      }
      return;
    }
    if (sq !== target) {
      flash('That\'s a valid rook move, but the flag is somewhere else along this line. Keep going!');
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
        heading="Race finished!"
        body="The rook crossed every flag in a straight line!"
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
        pieces={[{ square: pos, symbol: '♖', label: 'white rook' }]}
        targets={[target]}
        legalMoves={legal}
        blockers={activeBlockers}
        blockerSymbol="♙"
        blockerLabel="pawn blocker"
        onSquareClick={onClick}
      />

      <div className="mb-4 flex justify-center gap-3" aria-label={`${step} of ${TARGETS.length} flags reached`}>
        {TARGETS.map((_, i) => (
          <span key={i} className={`text-2xl transition-all ${i < step ? 'opacity-100' : 'opacity-20'}`} aria-hidden="true">🚩</span>
        ))}
      </div>

      <button onClick={restart} className="w-full rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95">
        Start over
      </button>
    </div>
  );
}
