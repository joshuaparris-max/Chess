'use client';

import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import { puzzles } from '@/lib/trainingData';

export default function PuzzleTrainer() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [game, setGame] = useState(() => new Chess(puzzles[0].fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('Find the best move. Try before using the hint.');
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const puzzle = puzzles[puzzleIndex];

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);

  const loadPuzzle = (index: number) => {
    const next = puzzles[index];
    setPuzzleIndex(index);
    setGame(new Chess(next.fen));
    setSelectedSquare(null);
    setStep(0);
    setShowHint(false);
    setLastMove(null);
    setMessage('Find the best move. Try before using the hint.');
  };

  const nextPuzzle = () => loadPuzzle((puzzleIndex + 1) % puzzles.length);

  const onSquareClick = (square: Square) => {
    if (game.isGameOver() && step >= puzzle.solution.length) return;

    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece?.color === game.turn()) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === game.turn()) {
      setSelectedSquare(square);
      return;
    }

    const attempted = `${selectedSquare}${square}`;
    const expected = puzzle.solution[step];
    const copy = new Chess(game.fen());

    try {
      const move = copy.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (!move) {
        setMessage('That move is not legal. Try again.');
        return;
      }

      if (attempted !== expected && `${selectedSquare}${square}q` !== expected) {
        setMessage('Legal, but not the training move. Reset the position and look for the forcing idea.');
        setSelectedSquare(null);
        return;
      }

      setGame(copy);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep >= puzzle.solution.length) {
        setMessage(`Correct. ${puzzle.teachingPoint}`);
      } else {
        setMessage('Good first move. Now continue the line.');
      }
    } catch {
      setMessage('Illegal move. Try again.');
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(320px,1fr)]">
      <div className="glass-panel rounded-3xl p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-200">Puzzle {puzzleIndex + 1}/{puzzles.length}</p>
          <h2 className="mt-1 text-2xl font-bold">{puzzle.title}</h2>
          <p className="text-sm text-slate-300">{puzzle.motif} · {puzzle.level} · {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move</p>
        </div>
        <ChessBoard game={game} selectedSquare={selectedSquare} legalTargets={legalTargets} lastMove={lastMove} onSquareClick={onSquareClick} />
      </div>

      <aside className="space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Puzzle coach</h3>
          <p className="mt-3 text-slate-100">{message}</p>
          {showHint && <p className="mt-3 rounded-2xl bg-yellow-200/10 p-3 text-sm text-yellow-100">Hint: {puzzle.hint}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => loadPuzzle(puzzleIndex)} className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm hover:bg-slate-700/50">Reset puzzle</button>
            <button onClick={() => setShowHint(true)} className="rounded-xl border border-yellow-200/40 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-200/10">Show hint</button>
            <button onClick={nextPuzzle} className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300">Next</button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Why this exists</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">The research report found that elite players rely on vast pattern libraries. This puzzle slice starts with small repeatable motifs so pattern recognition grows before heavy engine analysis.</p>
        </div>
      </aside>
    </section>
  );
}
