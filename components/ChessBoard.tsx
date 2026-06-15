'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Chess, type Square } from 'chess.js';
import ChessPiece from './ChessPiece';

type ChessBoardProps = {
  game: Chess;
  selectedSquare: Square | null;
  legalTargets: string[];
  captureSquares?: string[];
  lastMove: { from: string; to: string } | null;
  disabled?: boolean;
  flipped?: boolean;
  onSquareClick: (square: Square) => void;
};

const PIECE_SETS = {
  classic: {
    label: 'Classic',
    pieces: {
      wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
      bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
    },
  },
  inverted: {
    label: 'Inverted',
    pieces: {
      wk: '♚', wq: '♛', wr: '♜', wb: '♝', wn: '♞', wp: '♟',
      bk: '♔', bq: '♕', br: '♖', bb: '♗', bn: '♘', bp: '♙',
    },
  },
  algebraic: {
    label: 'Algebraic',
    pieces: {
      wk: 'K', wq: 'Q', wr: 'R', wb: 'B', wn: 'N', wp: 'P',
      bk: 'k', bq: 'q', br: 'r', bb: 'b', bn: 'n', bp: 'p',
    },
  },
  circled: {
    label: 'Circled',
    pieces: {
      wk: 'Ⓚ', wq: 'Ⓠ', wr: 'Ⓡ', wb: 'Ⓑ', wn: 'Ⓝ', wp: 'Ⓟ',
      bk: 'Ⓚ', bq: 'Ⓠ', br: 'Ⓡ', bb: 'Ⓑ', bn: 'Ⓝ', bp: 'Ⓟ',
    },
  },
  minimal: {
    label: 'Minimal',
    pieces: {
      wk: 'K', wq: 'Q', wr: 'R', wb: 'B', wn: 'N', wp: 'P',
      bk: 'K', bq: 'Q', br: 'R', bb: 'B', bn: 'N', bp: 'P',
    },
  },
};

type PieceSetKey = keyof typeof PIECE_SETS;

export default function ChessBoard({
  game,
  selectedSquare,
  legalTargets,
  captureSquares = [],
  lastMove,
  disabled = false,
  flipped = false,
  onSquareClick,
}: ChessBoardProps) {
  const [pieceSet, setPieceSet] = useState<PieceSetKey>('classic');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('gm-piece-set');
      if (saved && saved in PIECE_SETS) {
        setPieceSet(saved as PieceSetKey);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('gm-piece-set', pieceSet);
    } catch {
      // Ignore storage errors.
    }
  }, [pieceSet]);

  const pieces: Record<string, string> = useMemo(() => PIECE_SETS[pieceSet].pieces, [pieceSet]);
  const board = game.board();
  const displayRows = flipped ? [...board].reverse() : board;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-600 bg-slate-950/60 p-3 text-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-200">Piece style</p>
          <p className="text-xs text-slate-400">Choose how the board pieces appear.</p>
        </div>
        <select
          aria-label="Select chess icon set"
          value={pieceSet}
          onChange={(event) => setPieceSet(event.target.value as PieceSetKey)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
        >
          {Object.entries(PIECE_SETS).map(([key, option]) => (
            <option key={key} value={key}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="chess-board board-shadow rounded-2xl border border-slate-500/30 bg-slate-950 mx-auto">
        {displayRows.flatMap((row, rowIndex) => {
          const displayCells = flipped ? [...row].reverse() : row;
          const rankNum = flipped ? rowIndex + 1 : 8 - rowIndex;
          return displayCells.map((piece, fileIndex) => {
            const fileChar = flipped ? 'hgfedcba'[fileIndex] : 'abcdefgh'[fileIndex];
            const square = `${fileChar}${rankNum}` as Square;
            const isLight = (rowIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalTarget = legalTargets.includes(square);
            const isCapture = captureSquares.includes(square);
            const isLastMove = lastMove?.from === square || lastMove?.to === square;
            const pieceKey = piece ? (`${piece.color}${piece.type}` as keyof typeof pieces) : undefined;
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
                {piece && pieceSet === 'classic' ? <ChessPiece color={piece.color} type={piece.type} /> : (
                  <span className={`chess-piece ${piece ? (piece.color === 'w' ? 'text-white drop-shadow-md' : 'text-slate-950') : ''}`}>
                    {piece && pieceKey ? pieces[pieceKey] : ''}
                  </span>
                )}
                {(rankNum === (flipped ? 8 : 1) || fileIndex === 0) && <span className="coord">{square}</span>}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
