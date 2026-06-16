'use client';

import { useMemo } from 'react';
import { type Chess, type Square } from 'chess.js';
import ChessBoard from '../ChessBoard';

type ChessChallengeProps = {
  game: Chess;
  selectedSquare: Square | null;
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: Square) => void;
};

export default function ChessChallenge({ game, selectedSquare, lastMove, onSquareClick }: ChessChallengeProps) {
  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);
  const captureSquares = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).filter((move) => Boolean(move.captured)).map((move) => move.to);
  }, [game, selectedSquare]);

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-950/60 p-4 shadow-[0_20px_60px_-30px_rgba(124,58,237,0.55)]">
      <ChessBoard
        game={game}
        selectedSquare={selectedSquare}
        legalTargets={legalTargets}
        captureSquares={captureSquares}
        lastMove={lastMove}
        onSquareClick={onSquareClick}
      />
    </div>
  );
}
