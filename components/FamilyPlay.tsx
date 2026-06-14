'use client';

import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';
type PendingPromotion = { from: Square; to: Square } | null;

const PROMOTION_CHOICES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: 'q', label: 'Queen', symbol: '♕' },
  { piece: 'r', label: 'Rook', symbol: '♖' },
  { piece: 'b', label: 'Bishop', symbol: '♗' },
  { piece: 'n', label: 'Knight', symbol: '♘' },
];

// Deterministic friendly questions based on game state
function getFriendlyQuestion(game: Chess, whiteName: string, blackName: string): string {
  if (game.isGameOver()) return '';

  const turn = game.turn();
  const allMoves = game.moves({ verbose: true });
  const captures = allMoves.filter((m) => m.captured);
  const turnName = turn === 'w' ? whiteName : blackName;
  const otherName = turn === 'w' ? blackName : whiteName;

  if (game.inCheck()) {
    return `${turnName}'s king is in check — what move will keep the king safe?`;
  }
  if (captures.length > 0) {
    return `Can ${turnName} capture any of ${otherName}'s pieces this move?`;
  }
  // Rotate through general questions based on move count
  const moveCount = game.history().length;
  const questions = [
    `Before you move, look at all of ${turnName}'s pieces. Are they safe?`,
    `What do you think ${otherName} might do next?`,
    `Can you spot a piece that is not protected?`,
    `Is either king near the edge of the board?`,
    `Which of ${turnName}'s pieces hasn't moved yet?`,
    `Are there any pieces that could work together?`,
  ];
  return questions[moveCount % questions.length];
}

function getGameEndMessage(game: Chess, whiteName: string, blackName: string): string {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'b' ? whiteName : blackName;
    return `Checkmate — ${winner} wins! 🎉`;
  }
  if (game.isStalemate()) return 'Draw by stalemate.';
  if (game.isThreefoldRepetition()) return 'Draw by repetition.';
  if (game.isInsufficientMaterial()) return 'Draw — not enough pieces to checkmate.';
  if (game.isDraw()) return 'Draw.';
  return '';
}

function copyGame(g: Chess): Chess {
  const copy = new Chess();
  copy.loadPgn(g.pgn());
  return copy;
}

export default function FamilyPlay() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion>(null);
  // White = Sylvie by default; swapped = White is Dad, Black is Sylvie
  const [swapped, setSwapped] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);
  const [flipped, setFlipped] = useState(false);

  const whiteName = swapped ? 'Dad' : 'Sylvie';
  const blackName = swapped ? 'Sylvie' : 'Dad';

  const turn = game.turn();
  const currentName = turn === 'w' ? whiteName : blackName;
  const isOver = game.isGameOver();

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((m) => m.to);
  }, [game, selectedSquare]);

  const captureSquares = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true })
      .filter((m) => Boolean(m.captured))
      .map((m) => m.to);
  }, [game, selectedSquare]);

  const friendlyQuestion = useMemo(
    () => getFriendlyQuestion(game, whiteName, blackName),
    [blackName, game, whiteName],
  );

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setLastMove(null);
    setPendingPromotion(null);
  };

  const undoMove = () => {
    if (pendingPromotion) {
      setPendingPromotion(null);
      setSelectedSquare(null);
      return;
    }
    const copy = copyGame(game);
    copy.undo();
    setGame(copy);
    setSelectedSquare(null);
    setLastMove(null);
  };

  const swapColours = () => {
    setSwapped((s) => !s);
    resetGame();
  };

  const requiresPromotion = (from: Square, to: Square) => {
    const piece = game.get(from);
    if (piece?.type !== 'p') return false;
    const rank = piece.color === 'w' ? '8' : '1';
    if (!to.endsWith(rank)) return false;
    return game.moves({ square: from, verbose: true }).some((m) => m.to === to && Boolean(m.promotion));
  };

  const applyMove = (from: Square, to: Square, promotion?: PromotionPiece): boolean => {
    const copy = copyGame(game);
    try {
      const move = copy.move(promotion ? { from, to, promotion } : { from, to });
      if (!move) return false;
      setGame(copy);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPendingPromotion(null);
      return true;
    } catch {
      return false;
    }
  };

  const completePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion || isOver) return;
    if (!applyMove(pendingPromotion.from, pendingPromotion.to, piece)) {
      setPendingPromotion(null);
    }
  };

  const onSquareClick = (square: Square) => {
    if (isOver || pendingPromotion) return;

    const piece = game.get(square);

    if (!selectedSquare) {
      if (piece?.color === turn) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === turn) {
      setSelectedSquare(square);
      return;
    }

    if (requiresPromotion(selectedSquare, square)) {
      setPendingPromotion({ from: selectedSquare, to: square });
      setSelectedSquare(null);
      return;
    }

    applyMove(selectedSquare, square);
  };

  // Turn banner content
  const bannerText = (() => {
    if (isOver) return getGameEndMessage(game, whiteName, blackName);
    if (game.inCheck()) return `${currentName}'s king is in check! ⚠️`;
    return `${currentName}'s turn`;
  })();

  const bannerColour = (() => {
    if (isOver) {
      if (game.isCheckmate()) return 'bg-green-900/60 border-green-400/50 text-green-100';
      return 'bg-yellow-900/60 border-yellow-400/50 text-yellow-100';
    }
    if (game.inCheck()) return 'bg-red-900/60 border-red-400/50 text-red-100';
    return turn === 'w'
      ? 'bg-slate-800/80 border-teal-300/40 text-teal-100'
      : 'bg-slate-800/80 border-purple-300/40 text-purple-100';
  })();

  return (
    <section className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="glass-panel mb-4 rounded-3xl p-5 text-center">
        <h2 className="text-2xl font-black sm:text-3xl">Josh &amp; Sylvie — Play Together</h2>
        <p className="mt-1 text-sm text-slate-300">
          {whiteName} plays White · {blackName} plays Black
        </p>
      </div>

      {/* Turn banner */}
      <div className={`mb-4 rounded-2xl border-2 p-4 text-center text-xl font-black sm:text-2xl ${bannerColour}`}>
        {bannerText}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={resetGame}
          className="min-h-[48px] flex-1 rounded-2xl bg-teal-400 px-4 py-3 font-bold text-slate-950 hover:bg-teal-300 active:scale-95"
        >
          New game
        </button>
        <button
          onClick={undoMove}
          disabled={game.history().length === 0 && !pendingPromotion}
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-500/50 px-4 py-3 font-bold text-slate-100 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          Undo
        </button>
        <button
          onClick={swapColours}
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-500/50 px-4 py-3 font-bold text-slate-100 hover:bg-slate-700/50 active:scale-95"
        >
          Swap colours
        </button>
        <button
          onClick={() => setShowQuestions((v) => !v)}
          className={`min-h-[48px] flex-1 rounded-2xl border px-4 py-3 font-bold transition active:scale-95 ${
            showQuestions
              ? 'border-yellow-300/60 bg-yellow-200/10 text-yellow-100'
              : 'border-slate-500/50 text-slate-400'
          }`}
        >
          Questions {showQuestions ? 'on' : 'off'}
        </button>
        <button
          onClick={() => setFlipped((v) => !v)}
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-500/50 px-4 py-3 font-bold text-slate-100 hover:bg-slate-700/50 active:scale-95"
          title="Flip board so Black's side is at the bottom"
        >
          Flip board
        </button>
      </div>

      {/* Friendly question */}
      {showQuestions && !isOver && friendlyQuestion && (
        <div className="mb-4 rounded-2xl border border-yellow-300/30 bg-yellow-950/30 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Talk about it</p>
          <p className="mt-1 text-base text-yellow-100">{friendlyQuestion}</p>
        </div>
      )}

      {/* Promotion chooser */}
      {pendingPromotion && (
        <div role="dialog" aria-labelledby="promo-title" className="mb-4 rounded-2xl border-2 border-yellow-300/60 bg-slate-950 p-4 shadow-2xl">
          <h3 id="promo-title" className="text-lg font-bold text-yellow-100">Choose your piece</h3>
          <p className="mt-1 text-sm text-slate-300">Your pawn reached the end! What should it become?</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROMOTION_CHOICES.map((c) => (
              <button
                key={c.piece}
                onClick={() => completePromotion(c.piece)}
                className="min-h-16 rounded-xl border border-slate-600 bg-slate-800 px-3 py-3 text-center font-bold text-white transition hover:border-yellow-200 hover:bg-slate-700"
              >
                <span className="mr-2 text-2xl">{c.symbol}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Board */}
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">{blackName} · Black</p>
      <ChessBoard
        game={game}
        selectedSquare={selectedSquare}
        legalTargets={legalTargets}
        captureSquares={captureSquares}
        lastMove={lastMove}
        disabled={isOver || Boolean(pendingPromotion)}
        flipped={flipped}
        onSquareClick={onSquareClick}
      />
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-teal-200">{whiteName} · White</p>

      {/* Move list */}
      {game.history().length > 0 && (
        <div className="glass-panel mt-4 max-h-40 overflow-auto rounded-3xl p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Moves</p>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-300">
            {game.history().map((san, i) => (
              <li key={i}>{i + 1}. {san}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
