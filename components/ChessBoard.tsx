'use client';

import { type Chess, type Square } from 'chess.js';

const PIECES: Record<string, string> = {
  wk: '♔',
  wq: '♕',
  wr: '♖',
  wb: '♗',
  wn: '♘',
  wp: '♙',
  bk: '♚',
  bq: '♛',
  br: '♜',
  bb: '♝',
  bn: '♞',
  bp: '♟',
};

type ChessBoardProps = {
  game: Chess;
  selectedSquare: Square | null;
  legalTargets: string[];
  lastMove: { from: string; to: string } | null;
  disabled?: boolean;
  onSquareClick: (square: Square) => void;
};

export default function ChessBoard({ game, selectedSquare, legalTargets, lastMove, disabled = false, onSquareClick }: ChessBoardProps) {
  const board = game.board();

  return (
    <div className="board-shadow overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950">
      <div className="grid aspect-square w-full grid-cols-8">
        {board.flatMap((row, rowIndex) =>
          row.map((piece, fileIndex) => {
            const square = `${'abcdefgh'[fileIndex]}${8 - rowIndex}` as Square;
            const isLight = (rowIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalTarget = legalTargets.includes(square);
            const isLastMove = lastMove?.from === square || lastMove?.to === square;
            const pieceKey = piece ? `${piece.color}${piece.type}` : '';

            return (
              <button
                key={square}
                aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                disabled={disabled}
                onClick={() => onSquareClick(square)}
                className={`relative flex items-center justify-center text-3xl sm:text-5xl md:text-6xl transition ${isLight ? 'bg-[#eee6cf]' : 'bg-[#6f8f72]'} ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-110'} ${isSelected ? 'ring-4 ring-yellow-300 ring-inset' : ''}`}
              >
                {isLastMove && <span className="absolute inset-0 bg-yellow-300/25" />}
                {isLegalTarget && <span className="absolute h-4 w-4 rounded-full bg-slate-950/35 sm:h-5 sm:w-5" />}
                <span className={`relative z-10 select-none drop-shadow ${piece?.color === 'w' ? 'text-white' : 'text-slate-950'}`}>{piece ? PIECES[pieceKey] : ''}</span>
                <span className="absolute bottom-1 right-1 text-[10px] font-bold text-slate-900/40">{square}</span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
