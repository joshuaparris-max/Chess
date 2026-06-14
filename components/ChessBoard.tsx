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
  captureSquares?: string[];
  lastMove: { from: string; to: string } | null;
  disabled?: boolean;
  onSquareClick: (square: Square) => void;
};

export default function ChessBoard({ game, selectedSquare, legalTargets, captureSquares = [], lastMove, disabled = false, onSquareClick }: ChessBoardProps) {
  const board = game.board();

  return (
    <div className="chess-board board-shadow rounded-2xl border border-slate-500/30 bg-slate-950 mx-auto">
      {board.flatMap((row, rowIndex) =>
        row.map((piece, fileIndex) => {
          const square = `${'abcdefgh'[fileIndex]}${8 - rowIndex}` as Square;
          const isLight = (rowIndex + fileIndex) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isLegalTarget = legalTargets.includes(square);
          const isCapture = captureSquares.includes(square);
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const pieceKey = piece ? `${piece.color}${piece.type}` : '';

          return (
            <button
              key={square}
              aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
              disabled={disabled}
              onClick={() => onSquareClick(square)}
              className={`chess-square transition ${isLight ? 'bg-[#eee6cf]' : 'bg-[#6f8f72]'} ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-110'} ${isSelected ? 'ring-4 ring-yellow-300 ring-inset' : ''}`}
            >
              {isLastMove && <span className="absolute inset-0 bg-yellow-300/25" />}
              {isLegalTarget && !isCapture && (
                <span className="absolute h-7 w-7 rounded-full bg-slate-950/45 sm:h-8 sm:w-8" />
              )}
              {isCapture && (
                <span className="absolute inset-0.5 rounded-sm ring-4 ring-red-500/70 sm:ring-[5px]" />
              )}
              <span className={`chess-piece ${piece ? (piece.color === 'w' ? 'white-piece' : 'black-piece') : ''}`}>{piece ? PIECES[pieceKey] : ''}</span>
              <span className="coord">{square}</span>
            </button>
          );
        }),
      )}
    </div>
  );
}
