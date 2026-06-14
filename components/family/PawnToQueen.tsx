'use client';

import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import CelebrationOverlay from './CelebrationOverlay';
import ReadAloudButton from './ReadAloudButton';

// Position: White King e1, Black King h8 (clear of promotion square), White Pawn d5, Black Pawn e7
// FEN: 7k/4p3/8/3P4/8/8/8/4K3 w - - 0 1
// Stage 1: d5→d6 (forward)
// Stage 2: d6→e7 (diagonal capture of black pawn on e7)
// Stage 3: e7→e8 (promotion! e8 now empty)
const INITIAL_FEN = '7k/4p3/8/3P4/8/8/8/4K3 w - - 0 1';
const TARGETS: Square[] = ['d6', 'e7', 'e8'];

const STEPS = [
  { instruction: 'Pawns march forward, one square at a time. Move the pawn from d5 forward to d6!', prompt: 'Move pawn forward' },
  { instruction: 'Pawns capture diagonally — one square forward and to the side. The black pawn is right there. Take it by moving to e7!', prompt: 'Capture the black pawn' },
  { instruction: 'The pawn has almost reached the other end of the board. One more step to e8 — and then it can become any piece it wants!', prompt: 'Reach the final rank' },
];

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

const PROMOTION_CHOICES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: 'q', label: 'Queen', symbol: '♕' },
  { piece: 'r', label: 'Rook', symbol: '♖' },
  { piece: 'b', label: 'Bishop', symbol: '♗' },
  { piece: 'n', label: 'Knight', symbol: '♘' },
];

const PIECE_SYMBOLS: Record<string, string> = {
  wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',
  bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟',
};

export default function PawnToQueen({ onComplete }: { onComplete?: () => void }) {
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  const [selected, setSelected] = useState<Square | null>(null);
  const [step, setStep] = useState(0);
  const [awaitPromotion, setAwaitPromotion] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<Square | null>(null);
  const [pendingTo, setPendingTo] = useState<Square | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [promotedPiece, setPromotedPiece] = useState<string | null>(null);

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true }).map(m => m.to as Square);
  }, [game, selected]);

  const board = game.board();
  const instruction = STEPS[step]?.instruction ?? '';

  const restart = () => {
    setGame(new Chess(INITIAL_FEN));
    setSelected(null); setStep(0); setAwaitPromotion(false);
    setPendingFrom(null); setPendingTo(null); setFeedback(null);
    setDone(false); setPromotedPiece(null);
  };

  const handlePromotion = (piece: PromotionPiece) => {
    if (!pendingFrom || !pendingTo) return;
    const copy = new Chess(game.fen());
    try {
      copy.move({ from: pendingFrom, to: pendingTo, promotion: piece });
      setGame(copy);
      setAwaitPromotion(false);
      setPendingFrom(null); setPendingTo(null);
      setPromotedPiece(PROMOTION_CHOICES.find(c => c.piece === piece)?.label ?? 'Queen');
      setDone(true);
      onComplete?.();
    } catch {
      setFeedback('Something went wrong with the promotion. Try again.');
      setAwaitPromotion(false);
    }
  };

  const onClick = (sq: Square) => {
    if (done || awaitPromotion) return;
    const piece = game.get(sq);

    if (!selected) {
      if (piece?.color === 'w' && piece.type === 'p') setSelected(sq);
      return;
    }
    if (selected === sq) { setSelected(null); return; }
    if (piece?.color === 'w') { setSelected(sq); return; }

    if (!legalTargets.includes(sq)) {
      setFeedback('That is not a legal pawn move. Pawns go forward, or capture one square diagonally.');
      setSelected(null);
      return;
    }

    if (sq !== TARGETS[step]) {
      setFeedback('That is a legal pawn move, but follow the lesson one star at a time.');
      setSelected(null);
      return;
    }

    // Check if this is a promotion move
    const movingPiece = game.get(selected);
    if (movingPiece?.type === 'p' && sq[1] === '8') {
      setPendingFrom(selected);
      setPendingTo(sq);
      setSelected(null);
      setAwaitPromotion(true);
      return;
    }

    const copy = new Chess(game.fen());
    try {
      copy.move({ from: selected, to: sq });
      copy.setTurn('w');
      setGame(copy);
      setSelected(null);
      setFeedback(null);
      setStep(s => s + 1);
    } catch {
      setFeedback('That move did not work. Try again!');
      setSelected(null);
    }
  };

  if (done) {
    return (
      <CelebrationOverlay
        heading={`The pawn became a ${promotedPiece ?? 'Queen'}!`}
        body="Any pawn that reaches the final rank can become a new piece. Most players choose the queen — it is the most powerful piece."
        boardPrompt="Now set this up on your real chessboard together."
        onPlayAgain={restart}
      />
    );
  }

  const files = 'abcdefgh'.split('');

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

      {awaitPromotion && (
        <div role="dialog" aria-labelledby="promo-title" className="mb-3 rounded-2xl border-2 border-yellow-300/60 bg-slate-950 p-4">
          <h4 id="promo-title" className="mb-1 text-lg font-black text-yellow-100">The pawn made it! Choose its new piece:</h4>
          <p className="mb-3 text-sm text-slate-300">You can choose any of these. The queen is usually the best choice!</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROMOTION_CHOICES.map(c => (
              <button
                key={c.piece}
                onClick={() => handlePromotion(c.piece)}
                className="min-h-14 rounded-xl border border-slate-600 bg-slate-800 p-3 text-center font-bold text-white hover:border-yellow-300 hover:bg-slate-700"
              >
                <span className="mr-1 text-2xl" aria-hidden="true">{c.symbol}</span>{c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Board */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950 shadow-xl">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
          {board.flatMap((row, ri) =>
            row.map((piece, fi) => {
              const sq = `${files[fi]}${8 - ri}` as Square;
              const isLight = (ri + fi) % 2 === 0;
              const isSelected = selected === sq;
              const isLegal = legalTargets.includes(sq);
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
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-300',
                  ].join(' ')}
                >
                  {isLegal && !piece && (
                    <span className="absolute h-5 w-5 rounded-full bg-slate-950/40 sm:h-6 sm:w-6" aria-hidden="true" />
                  )}
                  {isLegal && piece && (
                    <span className="absolute inset-0.5 rounded-sm ring-4 ring-red-500/60" aria-hidden="true" />
                  )}
                  {sym && (
                    <span className={`relative z-10 text-3xl drop-shadow sm:text-4xl ${piece?.color === 'w' ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]' : 'text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.3)]'}`} aria-hidden="true">
                      {sym}
                    </span>
                  )}
                  {8 - ri === 1 && <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 select-none">{files[fi]}</span>}
                  {fi === 0 && <span className="pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-bold opacity-40 select-none">{8 - ri}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mb-4 flex justify-center gap-3" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <span key={i} className={`text-2xl transition-all ${i < step ? 'opacity-100' : 'opacity-20'}`} aria-hidden="true">♟</span>
        ))}
      </div>

      <button onClick={restart} className="w-full rounded-2xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95">
        Start over
      </button>
    </div>
  );
}
