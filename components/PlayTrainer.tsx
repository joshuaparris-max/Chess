"use client";

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import { botLevels } from '@/lib/trainingData';
import { getBotMove, uciToMove } from '@/lib/engine';

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
  const [coachNote, setCoachNote] = useState('White starts every game. You play as White — focus on development, centre control, and king safety.');

  const level = useMemo(() => botLevels.find((bot) => bot.id === levelId) ?? botLevels[1], [levelId]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setLastMove(null);
    setCoachNote('New game. Aim for safety first: centre, development, king safety.');
  };

  const undoPair = () => {
    const copy = copyGame(game);
    copy.undo();
    copy.undo();
    setGame(copy);
    setSelectedSquare(null);
    setLastMove(null);
    setCoachNote('Move pair undone. Now replay with one clearer thought.');
  };

  const makePlayerMove = (from: Square, to: Square) => {
    const copy = copyGame(game);
    try {
      const move = copy.move({ from, to, promotion: 'q' });
      if (!move) return false;
      setGame(copy);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setCoachNote(move.captured ? 'Good: you won material. Now ask whether your piece is safe.' : 'Move made. Before the bot replies, notice what changed.');
      return true;
    } catch {
      return false;
    }
  };

  const onSquareClick = (square: Square) => {
    if (isThinking || game.isGameOver() || game.turn() !== 'w') return;

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

    const ok = makePlayerMove(selectedSquare, square);
    if (!ok) setCoachNote('Illegal move. Slow down and check how that piece moves.');
  };

  useEffect(() => {
    if (game.turn() !== 'b' || game.isGameOver()) return;

    setIsThinking(true);
    const timer = window.setTimeout(() => {
      const uci = getBotMove(game.fen(), level);
      if (!uci) {
        setIsThinking(false);
        return;
      }

      const copy = copyGame(game);
      try {
        const move = copy.move(uciToMove(uci));
        setGame(copy);
        if (move) setLastMove({ from: move.from, to: move.to });
        setCoachNote(level.elo >= 2000 ? 'The bot reduced your easy options. Find your worst piece and improve it.' : 'Bot moved. Look for checks, captures and loose pieces.');
      } catch {
        setCoachNote('The alpha engine produced an invalid move. Resetting is safe if this repeats.');
      } finally {
        setIsThinking(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [game, level]);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,620px)_minmax(320px,1fr)]">
      <div className="glass-panel min-w-0 rounded-3xl p-2 sm:p-6">
        <div className="mb-2 flex items-center justify-between sm:mb-4">
          <div>
            <h2 className="text-lg font-bold sm:text-2xl">Play vs Alpha Bot</h2>
            <p className="text-xs text-slate-300 sm:text-sm">Local minimax trainer. You play White; bands are unmeasured practice targets.</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button onClick={resetGame} className="rounded-xl bg-teal-400 px-4 py-2 font-bold text-slate-950 hover:bg-teal-300">New game</button>
            <button disabled={isThinking || game.history().length === 0} onClick={undoPair} className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40">Undo pair</button>
          </div>
        </div>

        <div className="mobile-coach mb-3 sm:mb-4">
          <p className="text-sm font-semibold text-yellow-200">Coach</p>
          <p className="text-sm text-slate-100">{coachNote}</p>
        </div>

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Black bot</p>
        <ChessBoard game={game} selectedSquare={selectedSquare} legalTargets={legalTargets} lastMove={lastMove} disabled={isThinking} onSquareClick={onSquareClick} />
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">You · White</p>

        {/* Mobile action bar */}
        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
          <button onClick={resetGame} className="flex-1 rounded-2xl bg-teal-400 py-3 text-center font-bold text-slate-950">New</button>
          <button disabled={isThinking || game.history().length === 0} onClick={undoPair} className="flex-1 rounded-2xl border border-slate-600 py-3 text-center text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Undo</button>
          <button onClick={() => setCoachNote('Hint: Look for checks, captures, threats before each move.')} className="flex-1 rounded-2xl bg-yellow-200/10 py-3 text-center text-sm text-yellow-100">Hint</button>
        </div>
      </div>

      <aside className="min-w-0 space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor="bot-level">Bot difficulty</label>
          <select id="bot-level" value={levelId} onChange={(event) => setLevelId(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white">
            {botLevels.map((bot) => (
              <option key={bot.id} value={bot.id}>{bot.label} — training band {bot.elo}</option>
            ))}
          </select>
          <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
            <p className="text-lg font-bold text-yellow-200">{level.label}</p>
            <p className="text-sm text-slate-300">{level.style}</p>
            <p className="mt-2 text-sm text-slate-400">{level.description}</p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Coach note</h3>
          <p className="mt-2 text-slate-100">{isThinking ? 'Bot is thinking…' : coachNote}</p>
          <p className="mt-4 text-sm text-slate-400">Status: {gameStatus(game)}</p>
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
