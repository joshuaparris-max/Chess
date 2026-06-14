'use client';

import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { useLocalProgress } from '@/lib/familyProgress';
import CelebrationOverlay from './CelebrationOverlay';
import ReadAloudButton from './ReadAloudButton';

interface Puzzle {
  id: string;
  label: string;
  theme: string;
  fen: string;
  from: Square;
  to: Square;
  hint: string;
  celebrate: string;
  maxStars: 1 | 2 | 3;
  isPromotion?: true;
}

const PUZZLES: Puzzle[] = [
  {
    id: 'fp01', label: "Queen's Finish", theme: 'Checkmate', maxStars: 3,
    fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1',
    from: 'f5', to: 'f8',
    hint: 'Slide the queen all the way up the f-file to the last row!',
    celebrate: "Checkmate! The queen slid to f8 and the black king had nowhere to run.",
  },
  {
    id: 'fp02', label: "Rook's Finish", theme: 'Checkmate', maxStars: 3,
    fen: '7k/8/4B3/8/8/3B4/8/K5R1 w - - 0 1',
    from: 'g1', to: 'g8',
    hint: 'Zoom the rook straight up the g-file!',
    celebrate: "Checkmate! The rook zoomed all the way up and trapped the king.",
  },
  {
    id: 'fp03', label: "Pawn's Checkmate", theme: 'Promotion + Mate', maxStars: 3,
    fen: 'k7/2P5/1K6/8/8/8/8/8 w - - 0 1',
    from: 'c7', to: 'c8',
    hint: 'March the pawn one step forward to c8 — it becomes a queen AND gives checkmate!',
    celebrate: "Amazing! The pawn promoted to a queen on c8 — instant checkmate!",
    isPromotion: true,
  },
  {
    id: 'fp04', label: 'Win the Rook', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/8/3Q3r/8/8/8/K7 w - - 0 1',
    from: 'd5', to: 'h5',
    hint: 'The queen can slide all the way along row 5 to reach the rook!',
    celebrate: "Got it! The queen slid right across the rank and took the rook for free.",
  },
  {
    id: 'fp05', label: 'Win the Queen', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/8/4q3/8/8/K3R3 w - - 0 1',
    from: 'e1', to: 'e4',
    hint: 'The rook and the black queen share the same column — slide up and take it!',
    celebrate: "The rook captured the queen. The queen was sitting on the same file with nothing to protect it!",
  },
  {
    id: 'fp06', label: 'Win the Bishop', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/8/3Q1b2/8/8/8/K7 w - - 0 1',
    from: 'd5', to: 'f5',
    hint: 'Slide the queen two squares to the right along row 5!',
    celebrate: "The queen slid right over to f5 and took the bishop. Always look for undefended pieces!",
  },
  {
    id: 'fp07', label: 'Win the Knight', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/Q2n4/8/8/8/K7 w - - 0 1',
    from: 'a5', to: 'd5',
    hint: 'The queen and knight are on the same row — slide across and take it!',
    celebrate: "The queen captured the knight. The knight had no protection!",
  },
  {
    id: 'fp08', label: 'Pawn Becomes a Queen', theme: 'Promotion', maxStars: 2,
    fen: '7k/1P6/8/8/8/8/8/K7 w - - 0 1',
    from: 'b7', to: 'b8',
    hint: 'One step forward and the pawn reaches the last row — it can become a queen!',
    celebrate: "The pawn marched all the way to b8 and became a queen! Any pawn can do this.",
    isPromotion: true,
  },
  {
    id: 'fp09', label: 'Rook Hunts the Bishop', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/2R3b1/8/8/8/8/K7 w - - 0 1',
    from: 'c6', to: 'g6',
    hint: 'Slide the rook along row 6 all the way to the bishop!',
    celebrate: "The rook slid along rank 6 and captured the bishop. The bishop had nowhere to hide!",
  },
  {
    id: 'fp10', label: 'Pawn Takes the Rook', theme: 'Pawn Capture', maxStars: 3,
    fen: 'k7/8/8/3r4/4P3/8/8/K7 w - - 0 1',
    from: 'e4', to: 'd5',
    hint: 'Pawns capture diagonally — one step forward and to the side. The rook is right there!',
    celebrate: "The pawn captured the rook diagonally! Pawns are sneaky — they capture on the diagonal.",
  },
];

const PIECE_SYMBOLS: Record<string, string> = {
  wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',
  bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟',
};
const FILES = 'abcdefgh'.split('');

function calcStars(attempts: number, hintUsed: boolean, maxStars: number): number {
  const earned = attempts === 0 && !hintUsed ? 3 : attempts <= 1 ? 2 : 1;
  return Math.min(earned, maxStars);
}

export default function FamilyPuzzles() {
  const { progress, setPuzzleStars } = useLocalProgress();
  const [idx, setIdx] = useState(0);
  const [game, setGame] = useState(() => new Chess(PUZZLES[0].fen));
  const [selected, setSelected] = useState<Square | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [earnedStars, setEarnedStars] = useState(0);

  const puzzle = PUZZLES[idx];
  const bestStars = progress.puzzleStars[puzzle.id] ?? 0;

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true }).map(m => m.to as string);
  }, [game, selected]);

  const captureSquares = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true })
      .filter(m => Boolean(m.captured))
      .map(m => m.to as string);
  }, [game, selected]);

  const loadPuzzle = (newIdx: number) => {
    setIdx(newIdx);
    setGame(new Chess(PUZZLES[newIdx].fen));
    setSelected(null);
    setAttempts(0);
    setHintUsed(false);
    setSolved(false);
    setFeedback(null);
    setEarnedStars(0);
  };

  const showHintHandler = () => {
    setHintUsed(true);
    setFeedback(`Hint: ${puzzle.hint}`);
  };

  const onClick = (sq: Square) => {
    if (solved) return;
    const piece = game.get(sq);

    if (!selected) {
      if (piece?.color === 'w') setSelected(sq);
      return;
    }
    if (selected === sq) { setSelected(null); return; }
    if (piece?.color === 'w') { setSelected(sq); return; }

    if (!legalTargets.includes(sq)) {
      setFeedback("That square cannot be reached from here. Try another square!");
      setSelected(null);
      return;
    }

    if (selected === puzzle.from && sq === puzzle.to) {
      const copy = new Chess(game.fen());
      try {
        copy.move(puzzle.isPromotion ? { from: selected, to: sq, promotion: 'q' } : { from: selected, to: sq });
        setGame(copy);
        const stars = calcStars(attempts, hintUsed, puzzle.maxStars);
        setEarnedStars(stars);
        setSolved(true);
        setSelected(null);
        setFeedback(null);
        const prev = progress.puzzleStars[puzzle.id] ?? 0;
        if (stars > prev) setPuzzleStars(puzzle.id, stars);
      } catch {
        setFeedback("That move had a problem. Try again!");
        setSelected(null);
      }
    } else {
      setAttempts(a => a + 1);
      setFeedback("Good try! That is a legal move, but there is an even better one. Check the hint if you need help!");
      setSelected(null);
    }
  };

  const board = game.board();
  const totalStars = PUZZLES.reduce((sum, p) => sum + (progress.puzzleStars[p.id] ?? 0), 0);
  const maxPossible = PUZZLES.reduce((sum, p) => sum + p.maxStars, 0);

  if (solved) {
    return (
      <div>
        <CelebrationOverlay
          heading={`${'⭐'.repeat(earnedStars)} ${earnedStars} star${earnedStars !== 1 ? 's' : ''}!`}
          body={puzzle.celebrate}
          boardPrompt={idx < PUZZLES.length - 1 ? undefined : "You finished all the puzzles! Great work."}
          onPlayAgain={() => loadPuzzle(idx)}
          playAgainLabel="Try again"
        />
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => loadPuzzle(idx)}
            className="flex-1 rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
          >
            Replay puzzle
          </button>
          {idx < PUZZLES.length - 1 && (
            <button
              onClick={() => loadPuzzle(idx + 1)}
              className="flex-1 rounded-2xl bg-teal-400 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 active:scale-95"
            >
              Next puzzle →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 rounded-3xl border border-slate-600/50 bg-slate-900/60 p-4 text-center">
        <h2 className="text-xl font-black text-slate-100">Family Puzzles</h2>
        <p className="text-sm text-slate-400 mt-0.5">Stars: {totalStars} / {maxPossible}</p>
      </div>

      {/* Puzzle selector */}
      <div className="mb-4 flex flex-wrap gap-1.5 justify-center">
        {PUZZLES.map((p, i) => {
          const stars = progress.puzzleStars[p.id] ?? 0;
          const isCurrent = i === idx;
          return (
            <button
              key={p.id}
              onClick={() => loadPuzzle(i)}
              aria-label={`Puzzle ${i + 1}${stars ? `, ${stars} stars` : ''}`}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition active:scale-95 ${isCurrent ? 'bg-teal-400 text-slate-950' : stars > 0 ? 'bg-slate-700 text-yellow-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {i + 1}
              {stars > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px]">{'⭐'.repeat(Math.min(stars, 3))}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Puzzle header */}
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{puzzle.theme}</span>
            {bestStars > 0 && <span className="text-xs text-yellow-300">Best: {'⭐'.repeat(bestStars)}</span>}
          </div>
          <h3 className="mt-0.5 font-black text-lg text-slate-100">{puzzle.label}</h3>
          <p className="mt-1 text-sm text-slate-300">White to move. Find the best move!</p>
        </div>
        <ReadAloudButton text={`Puzzle: ${puzzle.label}. ${puzzle.theme}. White to move. Find the best move!`} />
      </div>

      {/* Feedback */}
      {feedback && (
        <div role="status" className={`mb-3 rounded-2xl border p-3 text-center text-sm font-bold ${feedback.startsWith('Hint:') ? 'border-yellow-300/40 bg-yellow-950/30 text-yellow-100' : 'border-orange-300/40 bg-orange-950/30 text-orange-100'}`}>
          {feedback}
        </div>
      )}

      {/* Board */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950 shadow-xl">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
          {board.flatMap((row, ri) =>
            row.map((piece, fi) => {
              const sq = `${FILES[fi]}${8 - ri}` as Square;
              const isLight = (ri + fi) % 2 === 0;
              const isSelected = selected === sq;
              const isLegal = legalTargets.includes(sq);
              const isCapture = captureSquares.includes(sq);
              const isHintFrom = hintUsed && sq === puzzle.from && !solved;
              const isHintTo = hintUsed && sq === puzzle.to && !solved;
              const sym = piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : '';

              return (
                <button
                  key={sq}
                  aria-label={`${sq}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                  onClick={() => onClick(sq)}
                  className={[
                    'relative flex aspect-square items-center justify-center transition',
                    isLight ? 'bg-[#eee6cf]' : 'bg-[#6f8f72]',
                    isSelected ? 'ring-4 ring-yellow-300 ring-inset' : '',
                    isHintFrom ? 'ring-4 ring-yellow-200/80 ring-inset' : '',
                    isHintTo ? 'ring-4 ring-teal-300/80 ring-inset' : '',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-300',
                  ].join(' ')}
                >
                  {isLegal && !isCapture && (
                    <span className="absolute h-5 w-5 rounded-full bg-slate-950/40 sm:h-6 sm:w-6" aria-hidden="true" />
                  )}
                  {isCapture && (
                    <span className="absolute inset-0.5 rounded-sm ring-4 ring-red-500/60" aria-hidden="true" />
                  )}
                  {sym && (
                    <span
                      className={`relative z-10 text-3xl drop-shadow sm:text-4xl ${piece?.color === 'w' ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]' : 'text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.3)]'}`}
                      aria-hidden="true"
                    >
                      {sym}
                    </span>
                  )}
                  {8 - ri === 1 && <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 select-none">{FILES[fi]}</span>}
                  {fi === 0 && <span className="pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-bold opacity-40 select-none">{8 - ri}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={showHintHandler}
          disabled={hintUsed}
          className="flex-1 rounded-2xl border border-yellow-300/40 py-3 text-sm font-bold text-yellow-100 hover:bg-yellow-950/30 disabled:opacity-40 active:scale-95"
        >
          {hintUsed ? 'Hint shown' : 'Show hint'}
        </button>
        <button
          onClick={() => loadPuzzle(idx)}
          className="flex-1 rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
