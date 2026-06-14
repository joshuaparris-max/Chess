'use client';

import type { Square } from 'chess.js';

type Piece = {
  square: Square;
  symbol: string;
  label: string;
};

type Props = {
  pieces: Piece[];
  targets: Square[];           // current target stars
  legalMoves: Square[];        // highlighted dots
  blockers?: Square[];         // squares occupied by obstacle pieces
  blockerSymbol?: string;      // e.g. '♙' for pawn blocker
  blockerLabel?: string;
  flipped?: boolean;
  onSquareClick: (sq: Square) => void;
};

const FILES = 'abcdefgh'.split('');
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export default function AdventureBoard({
  pieces,
  targets,
  legalMoves,
  blockers = [],
  blockerSymbol = '♙',
  blockerLabel = 'pawn',
  flipped = false,
  onSquareClick,
}: Props) {
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950 shadow-xl">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {displayRanks.flatMap((rank, ri) =>
          displayFiles.map((file, fi) => {
            const sq = `${file}${rank}` as Square;
            const origRankIdx = RANKS.indexOf(rank);
            const origFileIdx = FILES.indexOf(file);
            const isLight = (origRankIdx + origFileIdx) % 2 === 0;
            const isTarget = targets.includes(sq);
            const isLegal = legalMoves.includes(sq);
            const isBlocker = blockers.includes(sq);
            const piece = pieces.find(p => p.square === sq);

            return (
              <button
                key={sq}
                aria-label={`${sq}${piece ? ` ${piece.label}` : ''}${isTarget ? ' star target' : ''}${isBlocker ? ` ${blockerLabel}` : ''}`}
                onClick={() => onSquareClick(sq)}
                className={[
                  'relative flex aspect-square items-center justify-center transition',
                  isLight ? 'bg-[#eee6cf]' : 'bg-[#6f8f72]',
                  isLegal || isTarget ? 'cursor-pointer hover:brightness-110' : 'cursor-default',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-300',
                ].join(' ')}
              >
                {/* Coordinate labels */}
                {rank === (flipped ? 8 : 1) && (
                  <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 select-none">
                    {file}
                  </span>
                )}
                {file === (flipped ? 'h' : 'a') && (
                  <span className="pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-bold opacity-40 select-none">
                    {rank}
                  </span>
                )}

                {/* Legal move dot */}
                {isLegal && !isTarget && !piece && !isBlocker && (
                  <span className="absolute h-5 w-5 rounded-full bg-slate-950/40 sm:h-6 sm:w-6" aria-hidden="true" />
                )}

                {/* Target star */}
                {isTarget && (
                  <span
                    className="relative z-10 text-2xl sm:text-3xl"
                    style={{ textShadow: '0 0 8px #fde68a' }}
                    aria-hidden="true"
                  >
                    ⭐
                  </span>
                )}

                {/* Blocker piece */}
                {isBlocker && !piece && (
                  <span className="relative z-10 select-none text-xl sm:text-2xl opacity-60" title={blockerLabel} aria-hidden="true">
                    {blockerSymbol}
                  </span>
                )}

                {/* Active piece */}
                {piece && (
                  <span className="relative z-10 select-none text-3xl drop-shadow sm:text-4xl" aria-hidden="true">
                    {piece.symbol}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
