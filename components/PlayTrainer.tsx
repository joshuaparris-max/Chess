"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import PostGameReview from './PostGameReview';
import type { GameData } from '@/lib/gameReviewTypes';
import { botLevels } from '@/lib/trainingData';
import { getBotMove, uciToMove } from '@/lib/engine';
import { cancelStockfishMove, getStockfishMove } from '@/lib/stockfishClient';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

type PendingPromotion = {
  from: Square;
  to: Square;
} | null;

const promotionChoices: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: 'q', label: 'Queen', symbol: '♕' },
  { piece: 'r', label: 'Rook', symbol: '♖' },
  { piece: 'b', label: 'Bishop', symbol: '♗' },
  { piece: 'n', label: 'Knight', symbol: '♘' },
];

function gameStatus(game: Chess): string {
  if (game.history().length === 0) return 'White starts the game.';
  if (game.isCheckmate()) return game.turn() === 'w' ? 'Checkmate — Black wins.' : 'Checkmate — White wins.';
  if (game.isStalemate()) return 'Draw by stalemate.';
  if (game.isThreefoldRepetition()) return 'Draw by repetition.';
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material.';
  if (game.isDraw()) return 'Draw.';
  if (game.inCheck()) return `${game.turn() === 'w' ? 'White' : 'Black'} is in check.`;
  return `${game.turn() === 'w' ? 'White' : 'Black'} to move.`;
}

function coachMessageFromGameState(game: Chess): string | null {
  if (game.isCheckmate()) {
    const playerWon = game.turn() === 'b';
    if (playerWon) {
      return 'Checkmate — you win! ♔ Brilliant! The enemy king has no legal escape. Checkmate means the king is attacked and has no way to avoid capture.';
    }
    return 'Checkmate — the bot wins. Your king has no legal escape. That is checkmate. Every chess player gets checkmated while learning — use this to study defensive ideas.';
  }
  if (game.isStalemate()) return 'Stalemate — draw. The side to move has no legal move, but the king is not in check.';
  if (game.isThreefoldRepetition()) return 'Draw by threefold repetition. The same position occurred three times.';
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material. Neither side has enough pieces to checkmate.';
  if (game.isDraw()) return 'Draw. The game is over, but neither player won.';
  if (game.inCheck()) {
    const playerInCheck = game.turn() === 'w';
    if (playerInCheck) {
      return 'You are in check. Your king is under attack. You must respond by moving your king, blocking, or capturing the attacking piece.';
    }
    return 'Check! The bot king is under attack. The bot must respond to the check.';
  }
  return null;
}

function moveSanList(game: Chess): string[] {
  return game.history();
}

function copyGame(game: Chess): Chess {
  const copy = new Chess();
  copy.loadPgn(game.pgn());
  return copy;
}

export default function PlayTrainer() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [levelId, setLevelId] = useState(botLevels[1].id);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion>(null);
  const [engineNotice, setEngineNotice] = useState<string | null>(null);
  const [coachNote, setCoachNote] = useState('White starts every game. You play as White — focus on development, centre control, and king safety.');
  const engineRequestId = useRef(0);

  const level = useMemo(() => botLevels.find((bot) => bot.id === levelId) ?? botLevels[1], [levelId]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);

  const resetGame = () => {
    engineRequestId.current += 1;
    cancelStockfishMove();
    setGame(new Chess());
    setIsThinking(false);
    setSelectedSquare(null);
    setLastMove(null);
    setPendingPromotion(null);
    setCoachNote('New game. Aim for safety first: centre, development, king safety.');
    setShowReview(false);
    setReviewContext(null);
    setReviewAutoRequest(false);
  };

  const undoPair = () => {
    engineRequestId.current += 1;
    cancelStockfishMove();
    setIsThinking(false);

    if (pendingPromotion) {
      setPendingPromotion(null);
      setSelectedSquare(null);
      setCoachNote('Promotion choice cleared. Choose a move when you are ready.');
      return;
    }

    const copy = copyGame(game);
    copy.undo();
    copy.undo();
    setGame(copy);
    setSelectedSquare(null);
    setLastMove(null);
    setCoachNote('Move pair undone. Now replay with one clearer thought.');
    if (!copy.isGameOver()) {
      setShowReview(false);
      setReviewContext(null);
      setReviewAutoRequest(false);
    }
  };

  const applyPlayerMove = (from: Square, to: Square, promotion?: PromotionPiece) => {
    const copy = copyGame(game);
    try {
      const move = copy.move(promotion ? { from, to, promotion } : { from, to });
      if (!move) return false;
      setGame(copy);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPendingPromotion(null);
      const stateMsg = coachMessageFromGameState(copy);
      if (stateMsg) {
        setCoachNote(stateMsg);
      } else {
        setCoachNote(move.captured ? 'Good: you won material. Now ask whether your piece is safe.' : 'Move made. Before the bot replies, notice what changed.');
      }
      return true;
    } catch {
      return false;
    }
  };

  const requiresPromotionChoice = (from: Square, to: Square) => {
    const piece = game.get(from);
    if (piece?.type !== 'p') return false;

    const promotionRank = piece.color === 'w' ? '8' : '1';
    if (!to.endsWith(promotionRank)) return false;

    return game.moves({ square: from, verbose: true }).some((move) => move.to === to && Boolean(move.promotion));
  };

  const completePromotion = (promotion: PromotionPiece) => {
    if (!pendingPromotion || isThinking || game.isGameOver()) return;

    const moved = applyPlayerMove(pendingPromotion.from, pendingPromotion.to, promotion);
    if (!moved) {
      setPendingPromotion(null);
      setCoachNote('That promotion could not be completed. The board is unchanged, so please try the move again.');
    }
  };

  const onSquareClick = (square: Square) => {
    if (isThinking || pendingPromotion || game.isGameOver() || game.turn() !== 'w') return;

    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece?.color === 'w') setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === 'w') {
      setSelectedSquare(square);
      return;
    }

    if (requiresPromotionChoice(selectedSquare, square)) {
      setPendingPromotion({ from: selectedSquare, to: square });
      setSelectedSquare(null);
      setCoachNote('Your pawn reached the end of the board. Choose what it becomes.');
      return;
    }

    const ok = applyPlayerMove(selectedSquare, square);
    if (!ok) setCoachNote('Illegal move. Slow down and check how that piece moves.');
  };

  useEffect(() => {
    if (game.turn() !== 'b' || game.isGameOver()) return;

    const requestId = engineRequestId.current + 1;
    engineRequestId.current = requestId;
    setIsThinking(true);
    const timer = window.setTimeout(async () => {
      let uci: string | null = null;
      let usedFallback = false;

      try {
        uci = await getStockfishMove(game.fen(), level);
        if (engineRequestId.current === requestId) setEngineNotice(null);
      } catch {
        if (engineRequestId.current !== requestId) return;
        usedFallback = true;
        uci = getBotMove(game.fen(), level);
        setEngineNotice('Engine failed to load. Falling back to Alpha Bot.');
      }

      if (engineRequestId.current !== requestId || !uci) return;

      const copy = copyGame(game);
      try {
        const move = copy.move(uciToMove(uci));
        setGame(copy);
        if (move) setLastMove({ from: move.from, to: move.to });
        const stateMsg = coachMessageFromGameState(copy);
        if (stateMsg) {
          setCoachNote(stateMsg);
        } else if (usedFallback) {
          setCoachNote('Engine failed to load. Falling back to Alpha Bot.');
        } else {
          setCoachNote(level.elo >= 2000 ? 'The bot reduced your easy options. Find your worst piece and improve it.' : 'Bot moved. Look for checks, captures and loose pieces.');
        }
      } catch {
        setCoachNote('The alpha engine produced an invalid move. Resetting is safe if this repeats.');
      } finally {
        if (engineRequestId.current === requestId) setIsThinking(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      if (engineRequestId.current === requestId) {
        engineRequestId.current += 1;
        cancelStockfishMove();
      }
    };
  }, [game, level]);

  // Post-game review state
  const [showReview, setShowReview] = useState(false);
  const [reviewContext, setReviewContext] = useState<GameData | null>(null);
  const [reviewAutoRequest, setReviewAutoRequest] = useState(false);

  function buildGameReviewContext(game: Chess, botLabelOrLevel: any): GameData {
    const moves = moveSanList(game);
    let result: GameData['result'] = 'draw';
    if (game.isCheckmate()) {
      // player is White in this UI
      const playerWon = game.turn() === 'b';
      result = playerWon ? 'win' : 'loss';
    } else if (game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial() || game.isDraw()) {
      result = 'draw';
    }

    const botLevelValue = typeof botLabelOrLevel === 'object' && botLabelOrLevel?.elo ? botLabelOrLevel.elo : undefined;

    return {
      playerColor: 'white',
      botColor: 'black',
      result,
      moves,
      finalFEN: game.fen(),
      finalMove: moves.length > 0 ? moves[moves.length - 1] : undefined,
      isCheckmate: game.isCheckmate(),
      sideToMoveAfterGame: game.turn() === 'w' ? 'white' : 'black',
      winner: game.isCheckmate() ? (game.turn() === 'b' ? 'white' : 'black') : null,
      moveCount: moves.length,
      botLevel: botLevelValue,
      endBy: game.isCheckmate() ? 'checkmate' : undefined,
    };
  }

  // Hide review automatically when game is no longer over
  useEffect(() => {
    if (!game.isGameOver()) {
      setShowReview(false);
      setReviewContext(null);
    }
  }, [game]);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,620px)_minmax(320px,1fr)]">
      <div className="glass-panel min-w-0 rounded-3xl p-2 sm:p-6">
        <div className="mb-2 flex items-center justify-between sm:mb-4">
          <div>
            <h2 className="text-lg font-bold sm:text-2xl">Play vs Computer</h2>
            <p className="text-xs text-slate-300 sm:text-sm">Choose a training level. You play White, and these are practice levels rather than official ratings.</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button onClick={resetGame} className="rounded-xl bg-teal-400 px-4 py-2 font-bold text-slate-950 hover:bg-teal-300">New game</button>
            <button disabled={isThinking || (game.history().length === 0 && !pendingPromotion)} onClick={undoPair} className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40">Undo pair</button>
          </div>
        </div>

        <div className="mobile-coach mb-3 sm:mb-4">
          <p className="text-sm font-semibold text-yellow-200">Coach</p>
          <p className="text-sm text-slate-100">{isThinking ? 'Bot is thinking…' : coachNote}</p>
        </div>

        {engineNotice && <p className="mb-4 rounded-xl border border-yellow-300/40 bg-yellow-950/30 p-3 text-sm text-yellow-100">{engineNotice}</p>}

        {game.isGameOver() && (
          <div className={`mb-4 rounded-2xl border-2 p-4 text-center font-bold ${
            game.isCheckmate() && game.turn() === 'b'
              ? 'border-green-400/50 bg-green-950/40 text-green-200'
              : game.isCheckmate()
              ? 'border-red-400/50 bg-red-950/40 text-red-200'
              : 'border-yellow-400/50 bg-yellow-950/40 text-yellow-200'
          }`}>
            {gameStatus(game)}
          </div>
        )}

        {game.isGameOver() && (
          <div className="mb-4 flex flex-col items-center gap-3">
            {!showReview ? (
              <button
                onClick={() => {
                  setReviewContext(buildGameReviewContext(game, level));
                  setReviewAutoRequest(true);
                  setShowReview(true);
                }}
                className="min-h-[48px] w-full max-w-sm rounded-2xl bg-slate-800/70 px-4 py-3 text-sm font-bold text-slate-100 hover:bg-slate-700"
              >
                Review my game
              </button>
            ) : (
              reviewContext && <PostGameReview gameData={reviewContext} autoRequest={reviewAutoRequest} />
            )}
          </div>
        )}

        {pendingPromotion && (
          <div role="dialog" aria-labelledby="promotion-title" className="mb-4 rounded-2xl border-2 border-yellow-300/60 bg-slate-950 p-4 shadow-2xl">
            <h3 id="promotion-title" className="text-lg font-bold text-yellow-100">Choose your promotion</h3>
            <p className="mt-1 text-sm text-slate-100">Your pawn reached the end of the board. Choose what it becomes.</p>
            <p className="mt-1 text-xs text-slate-400">Most of the time, choose Queen. Sometimes Knight is useful for a surprise check.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {promotionChoices.map((choice) => (
                <button
                  key={choice.piece}
                  type="button"
                  onClick={() => completePromotion(choice.piece)}
                  className="min-h-16 rounded-xl border border-slate-600 bg-slate-800 px-3 py-3 text-center font-bold text-white transition hover:border-yellow-200 hover:bg-slate-700 focus-visible:border-yellow-200"
                >
                  <span aria-hidden="true" className="mr-2 text-2xl">{choice.symbol}</span>
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Black bot</p>
        <ChessBoard game={game} selectedSquare={selectedSquare} legalTargets={legalTargets} lastMove={lastMove} disabled={isThinking || Boolean(pendingPromotion) || game.isGameOver()} onSquareClick={onSquareClick} />
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">You · White</p>

        {/* Mobile action bar */}
        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
          <button onClick={resetGame} className="flex-1 rounded-2xl bg-teal-400 py-3 text-center font-bold text-slate-950">New</button>
          <button disabled={isThinking || (game.history().length === 0 && !pendingPromotion)} onClick={undoPair} className="flex-1 rounded-2xl border border-slate-600 py-3 text-center text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Undo</button>
          <button disabled={Boolean(pendingPromotion) || game.isGameOver()} onClick={() => setCoachNote('Hint: Look for checks, captures, threats before each move.')} className="flex-1 rounded-2xl bg-yellow-200/10 py-3 text-center text-sm text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40">Hint</button>
        </div>
      </div>

      <aside className="min-w-0 space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor="bot-level">Bot difficulty</label>
          <select id="bot-level" value={levelId} onChange={(event) => setLevelId(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white">
            {botLevels.map((bot) => (
              <option key={bot.id} value={bot.id}>{bot.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">These are practice levels, not official ratings.</p>
          <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
            <p className="text-lg font-bold text-yellow-200">{level.label}</p>
            <p className="text-sm text-slate-300">{level.style}</p>
            <p className="mt-2 text-sm text-slate-400">{level.description}</p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Coach note</h3>
          <p className="mt-2 text-slate-100">{isThinking ? 'Bot is thinking…' : coachNote}</p>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-slate-400">Game status</p>
            <p className={`mt-1 text-sm font-semibold ${
              game.isGameOver()
                ? game.isCheckmate() && game.turn() === 'b'
                  ? 'text-green-300'
                  : game.isCheckmate()
                  ? 'text-red-300'
                  : 'text-yellow-300'
                : game.inCheck()
                ? 'text-orange-300'
                : 'text-slate-400'
            }`}>
              {gameStatus(game)}
            </p>
          </div>
        </div>

        <div className="glass-panel max-h-80 overflow-auto rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Move list</h3>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-300">
            {moveSanList(game).map((san, index) => (
              <li key={`${san}-${index}`}>{index + 1}. {san}</li>
            ))}
          </ol>
          {game.history().length === 0 && <p className="mt-2 text-sm text-slate-400">No moves yet.</p>}
        </div>
      </aside>
    </section>
  );
}
