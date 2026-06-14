'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Square } from 'chess.js';

// The treasure sequence: knight starts on b1 and collects stars at c3, e4, f6
const START_SQUARE: Square = 'b1';
const STARS: Square[] = ['c3', 'e4', 'f6'];

const INSTRUCTIONS = [
  'The knight moves in an L shape — two squares one way, then one square to the side. Can you help it reach the first star? ⭐',
  'Great jump! Now help the knight reach the second star. ⭐⭐',
  'One more star! Where can the knight jump next? ⭐⭐⭐',
];

// Compute knight moves purely from geometry — no chess.js needed (no kings required)
function getLegalKnightMoves(knightSquare: Square): Square[] {
  const file = knightSquare.charCodeAt(0) - 97;
  const rank = parseInt(knightSquare[1]) - 1;
  const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const results: Square[] = [];
  for (const [df, dr] of deltas) {
    const nf = file + df;
    const nr = rank + dr;
    if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      results.push(`${'abcdefgh'[nf]}${nr + 1}` as Square);
    }
  }
  return results;
}

type CelebrationStar = { id: number; x: number; y: number; delay: number; size: number };

function CelebrationOverlay({ onPlayAgain }: { onPlayAgain: () => void }) {
  const stars = useMemo<CelebrationStar[]>(() => (
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.round((i * 37 + 11) % 100),
      y: Math.round((i * 53 + 7) % 100),
      delay: Math.round((i * 0.15) * 10) / 10,
      size: 16 + (i % 4) * 8,
    }))
  ), []);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-300/60 bg-slate-950/95 p-8 text-center shadow-2xl">
      {/* CSS star confetti */}
      {stars.map((s) => (
        <span
          key={s.id}
          aria-hidden="true"
          className="pointer-events-none absolute animate-bounce select-none text-yellow-300 opacity-80"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${1 + (s.id % 3) * 0.4}s`,
          }}
        >
          ⭐
        </span>
      ))}
      <div className="relative z-10">
        <p className="text-5xl">🎉</p>
        <h3 className="mt-3 text-2xl font-black text-yellow-200">All three stars collected!</h3>
        <p className="mt-3 text-lg text-slate-100">The knight finished the treasure hunt!</p>
        <p className="mt-4 rounded-2xl border border-teal-300/40 bg-teal-950/40 p-4 text-base font-bold text-teal-100">
          Now set this up on your real chessboard together.
        </p>
        <button
          onClick={onPlayAgain}
          className="mt-6 min-h-[52px] w-full rounded-2xl bg-teal-400 px-6 py-3 text-lg font-black text-slate-950 hover:bg-teal-300 active:scale-95"
        >
          Play again
        </button>
      </div>
    </div>
  );
}

export default function KnightTreasureHunt() {
  const [knightSquare, setKnightSquare] = useState<Square>(START_SQUARE);
  const [starIndex, setStarIndex] = useState(0); // which star we're aiming for
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpeechAvailable(
      typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && 'SpeechSynthesisUtterance' in window,
    );

    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const legalMoves = useMemo(() => getLegalKnightMoves(knightSquare), [knightSquare]);
  const targetStar = STARS[starIndex];

  const resetActivity = () => {
    setKnightSquare(START_SQUARE);
    setStarIndex(0);
    setComplete(false);
    setFeedback(null);
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    if (speechAvailable) window.speechSynthesis.cancel();
  };

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 2500);
  }, []);

  const onSquareClick = (square: Square) => {
    if (complete) return;

    if (!legalMoves.includes(square)) {
      showFeedback('The knight cannot jump there yet. Look for an L-shaped jump and try again!');
      return;
    }

    if (square !== targetStar) {
      showFeedback("Almost! That's a legal knight move, but the star is somewhere else. Try again! 🔍");
      return;
    }

    // Correct!
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    setKnightSquare(square);
    if (starIndex + 1 >= STARS.length) {
      setComplete(true);
      setFeedback(null);
    } else {
      setStarIndex((i) => i + 1);
      setFeedback(null);
    }
  };

  const readAloud = () => {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      complete
        ? 'Well done! All three stars collected! Now set this up on your real chessboard together.'
        : INSTRUCTIONS[starIndex]
    );
    window.speechSynthesis.speak(utter);
  };

  // Build board display
  const files = 'abcdefgh'.split('');
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <section className="mx-auto max-w-xl">
      {/* Header */}
      <div className="glass-panel mb-4 rounded-3xl p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-200">Sylvie's Chess Adventure</p>
        <h2 className="mt-1 text-2xl font-black sm:text-3xl">Knight Treasure Hunt</h2>
        {!complete && (
          <p className="mt-2 text-base font-bold text-teal-200">
            {starIndex} of {STARS.length} stars ⭐
          </p>
        )}
      </div>

      {complete ? (
        <CelebrationOverlay onPlayAgain={resetActivity} />
      ) : (
        <>
          {/* Instruction card */}
          <div className="mb-4 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-base leading-relaxed text-slate-100">{INSTRUCTIONS[starIndex]}</p>
              </div>
              {speechAvailable && (
                <button
                  onClick={readAloud}
                  aria-label="Read instruction aloud"
                  className="shrink-0 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700 active:scale-95"
                >
                  🔊 Read aloud
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div role="status" className="mb-4 rounded-2xl border border-orange-300/40 bg-orange-950/30 p-3 text-center text-sm font-bold text-orange-100">
              {feedback}
            </div>
          )}

          {/* Board */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950 shadow-xl">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
              {ranks.flatMap((rank) =>
                files.map((file) => {
                  const sq = `${file}${rank}` as Square;
                  const fileIndex = files.indexOf(file);
                  const rankIndex = ranks.indexOf(rank);
                  const isLight = (fileIndex + rankIndex) % 2 === 0;
                  const isKnight = sq === knightSquare;
                  const isStar = sq === targetStar;
                  const isLegal = legalMoves.includes(sq);

                  return (
                    <button
                      key={sq}
                      aria-label={`${sq}${isKnight ? ' knight' : ''}${isStar ? ' star' : ''}`}
                      onClick={() => onSquareClick(sq)}
                      className={[
                        'relative flex aspect-square items-center justify-center transition',
                        isLight ? 'bg-[#eee6cf]' : 'bg-[#6f8f72]',
                        isLegal && !isKnight ? 'cursor-pointer hover:brightness-110' : 'cursor-default',
                      ].join(' ')}
                    >
                      {/* Legal move dot */}
                      {isLegal && !isKnight && !isStar && (
                        <span className="absolute h-5 w-5 rounded-full bg-slate-950/40 sm:h-6 sm:w-6" />
                      )}
                      {/* Star target */}
                      {isStar && (
                        <span className="relative z-10 text-2xl sm:text-3xl" style={{ textShadow: '0 0 8px #fde68a' }}>
                          ⭐
                        </span>
                      )}
                      {/* Knight */}
                      {isKnight && (
                        <span className="relative z-10 select-none text-3xl drop-shadow sm:text-4xl">♘</span>
                      )}
                      {/* Coord label */}
                      {rank === 1 && (
                        <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-bold opacity-50 select-none">
                          {file}
                        </span>
                      )}
                      {file === 'a' && (
                        <span className="pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-bold opacity-50 select-none">
                          {rank}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Progress dots */}
          <div className="mb-4 flex justify-center gap-3">
            {STARS.map((_, i) => (
              <span
                key={i}
                className={`text-2xl transition-all ${i < starIndex ? 'opacity-100' : 'opacity-25'}`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={resetActivity}
            className="w-full rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
          >
            Start over
          </button>
        </>
      )}
    </section>
  );
}
