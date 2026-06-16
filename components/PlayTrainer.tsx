"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import EmojiReaction from './EmojiReaction';
import GameClock from './GameClock';
import GameArchive from './GameArchive';
import PostGameReview from './PostGameReview';
import type { GameData } from '@/lib/gameReviewTypes';
import { botLevels } from '@/lib/trainingData';
import { getBotMove, uciToMove } from '@/lib/engine';
import { cancelStockfishMove, getStockfishMove } from '@/lib/stockfishClient';
import { commitClockMove, createClock, startClock, stopClock } from '@/lib/clock';
import { createGameId, saveLocalGame, saveLocalGameReview } from '@/lib/gameArchive';
import { recogniseOpening } from '@/lib/openings';
import {
  initAudio,
  playCapture,
  playCheck,
  playCheckmate,
  playFairyQueenLayer,
  playPawnMove,
  playPieceMove,
  setChessSoundsEnabled,
} from '@/lib/audio/chessSounds';
import { recordGameCompleted } from '@/lib/progression/xp';
import {
  getSlots,
  useSpell,
  spellsEnabled as readSpellsEnabled,
  setSpellsEnabled as persistSpellsEnabled,
  type SpellType,
  type SpellSlots,
} from '@/lib/spells/spellSlots';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';
type GameMode = 'vs-computer' | 'two-player';
type PlayerColor = 'w' | 'b';
type TimeControl = 'untimed' | '10+0' | '5+0';
const ONBOARDING_KEY = 'gm-play-onboarding-seen-v1';
const PLAY_SETTINGS_KEY = 'gm-play-settings-v1';
const CHESS_SOUNDS_KEY = 'chessSounds';

function fairyQueenActive() {
  try {
    return window.localStorage.getItem('gm-piece-set') === 'fairy';
  } catch {
    return false;
  }
}

const timeControlMs: Record<Exclude<TimeControl, 'untimed'>, number> = {
  '10+0': 10 * 60_000,
  '5+0': 5 * 60_000,
};

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

const reactionEmojis = ['👏', '🎉', '😮', '🤔', '😄', '🙈', '❤️', '⭐'];

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

function coachMessageFromGameState(game: Chess, gameMode: GameMode): string | null {
  if (gameMode === 'two-player') {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    if (game.isStalemate()) return 'Stalemate — draw. The side to move has no legal move, but the king is not in check.';
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition. The same position occurred three times.';
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material. Neither side has enough pieces to checkmate.';
    if (game.isDraw()) return 'Draw. The game is over, but neither player won.';
    if (game.inCheck()) return `${game.turn() === 'w' ? 'White' : 'Black'} is in check. Find a move that keeps the king safe.`;
    return null;
  }

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

function playMoveSound(move: { piece: string; captured?: string; san: string }, afterMove: Chess) {
  if (afterMove.isCheckmate() || move.san.includes('#')) {
    playCheckmate();
    return;
  }
  if (afterMove.inCheck() || move.san.includes('+')) {
    playCheck();
    return;
  }
  if (move.captured) {
    playCapture();
    return;
  }
  if (move.piece === 'p') {
    playPawnMove();
    return;
  }
  playPieceMove();
}

export default function PlayTrainer() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [levelId, setLevelId] = useState(botLevels[1].id);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion>(null);
  const [engineNotice, setEngineNotice] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('vs-computer');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [timeControl, setTimeControl] = useState<TimeControl>('untimed');
  const [clock, setClock] = useState(() => createClock(10 * 60_000));
  const [coachNote, setCoachNote] = useState('White starts every game. You play as White — focus on development, centre control, and king safety.');
  const engineRequestId = useRef(0);
  const archivedPgnRef = useRef('');
  const [importPgn, setImportPgn] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [spellSlots, setSpellSlots] = useState<SpellSlots>({ date: '', slots: { truesight: 1, rewind: 1, shield: 1 } });
  const [spellsOn, setSpellsOn] = useState(true);

  useEffect(() => {
    setSpellSlots(getSlots());
    setSpellsOn(readSpellsEnabled());
    const onChanged = () => setSpellSlots(getSlots());
    window.addEventListener('gm-spells-changed', onChanged);
    return () => window.removeEventListener('gm-spells-changed', onChanged);
  }, []);

  const spendSpell = (type: SpellType): boolean => {
    const ok = useSpell(type);
    setSpellSlots(getSlots());
    return ok;
  };

  const toggleSpells = () => {
    const next = !spellsOn;
    setSpellsOn(next);
    persistSpellsEnabled(next);
  };
  const [reaction, setReaction] = useState<{ emoji: string; nonce: number } | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setShowOnboarding(localStorage.getItem(ONBOARDING_KEY) !== 'true');
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PLAY_SETTINGS_KEY) || '{}') as Partial<{
        levelId: string; playerColor: PlayerColor; timeControl: TimeControl; boardFlipped: boolean;
      }>;
      if (saved.levelId && botLevels.some((bot) => bot.id === saved.levelId)) setLevelId(saved.levelId);
      if (saved.playerColor === 'w' || saved.playerColor === 'b') setPlayerColor(saved.playerColor);
      if (saved.timeControl === 'untimed' || saved.timeControl === '10+0' || saved.timeControl === '5+0') setTimeControl(saved.timeControl);
      if (typeof saved.boardFlipped === 'boolean') setBoardFlipped(saved.boardFlipped);
      const savedSounds = localStorage.getItem(CHESS_SOUNDS_KEY);
      if (savedSounds !== null) setSoundEffects(savedSounds === 'true');
    } catch {
      // Ignore malformed or unavailable local settings.
    } finally {
      setSettingsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    try {
      localStorage.setItem(PLAY_SETTINGS_KEY, JSON.stringify({ levelId, playerColor, timeControl, boardFlipped }));
      localStorage.setItem(CHESS_SOUNDS_KEY, String(soundEffects));
    } catch {}
    setChessSoundsEnabled(soundEffects);
  }, [settingsReady, levelId, playerColor, timeControl, boardFlipped, soundEffects]);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
  };

  const showReaction = (emoji: string) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction({ emoji, nonce: Date.now() });
    reactionTimer.current = setTimeout(() => setReaction(null), 1600);
  };

  useEffect(() => {
    return () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, []);

  const level = useMemo(() => botLevels.find((bot) => bot.id === levelId) ?? botLevels[1], [levelId]);
  const opening = useMemo(() => recogniseOpening(game.history()), [game]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);

  const captureSquares = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true })
      .filter((move) => Boolean(move.captured))
      .map((move) => move.to);
  }, [game, selectedSquare]);

  const resetGame = () => {
    engineRequestId.current += 1;
    cancelStockfishMove();
    setGame(new Chess());
    setIsThinking(false);
    setSelectedSquare(null);
    setLastMove(null);
    setPendingPromotion(null);
    setEngineNotice(null);
    setCoachNote(playerColor === 'w' || gameMode === 'two-player' ? 'New game. White starts. Aim for safety first.' : 'New game. The bot plays White first, then it is your turn.');
    const nextClock = timeControl === 'untimed' ? createClock(10 * 60_000) : createClock(timeControlMs[timeControl]);
    setClock(timeControl === 'untimed' ? nextClock : startClock(nextClock, 'w', performance.now()));
    setShowReview(false);
    setReviewContext(null);
    setReviewAutoRequest(false);
  };

  useEffect(() => {
    engineRequestId.current += 1;
    cancelStockfishMove();
    const nextClock = timeControl === 'untimed' ? createClock(10 * 60_000) : createClock(timeControlMs[timeControl]);
    setGame(new Chess());
    setClock(timeControl === 'untimed' ? nextClock : startClock(nextClock, 'w', performance.now()));
    setSelectedSquare(null);
    setLastMove(null);
    setPendingPromotion(null);
    setIsThinking(false);
    setShowReview(false);
    setReviewContext(null);
    setReviewAutoRequest(false);
  }, [playerColor, timeControl]);

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

    if (game.history().length === 0) return;
    if (gameMode === 'vs-computer' && !spendSpell('rewind')) {
      setCoachNote('⏪ Rewind recharges tomorrow ✨');
      return;
    }

    const copy = copyGame(game);
    copy.undo();
    if (gameMode === 'vs-computer') copy.undo();
    setGame(copy);
    setSelectedSquare(null);
    setLastMove(null);
    setCoachNote(gameMode === 'two-player' ? 'Move undone. Try again.' : 'Move pair undone. Now replay with one clearer thought.');
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
      if (timeControl !== 'untimed') setClock((value) => commitClockMove(value, move.color, performance.now()));
      setLastMove({ from: move.from, to: move.to });
      playMoveSound(move, copy);
      if (move.piece === 'q' && fairyQueenActive()) playFairyQueenLayer();
      setSelectedSquare(null);
      setPendingPromotion(null);
      const stateMsg = coachMessageFromGameState(copy, gameMode);
      if (stateMsg) {
        setCoachNote(stateMsg);
      } else if (gameMode === 'two-player') {
        const nextPlayer = copy.turn() === 'w' ? 'White' : 'Black';
        setCoachNote(move.captured ? `${nextPlayer} to move. A capture was made — check whether the capturing piece is safe.` : `${nextPlayer} to move. Look for checks, captures, and threats.`);
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
    initAudio();

    const moved = applyPlayerMove(pendingPromotion.from, pendingPromotion.to, promotion);
    if (!moved) {
      setPendingPromotion(null);
      setCoachNote('That promotion could not be completed. The board is unchanged, so please try the move again.');
    }
  };

  const castShield = () => {
    if (isThinking || game.isGameOver() || game.history().length === 0) {
      setCoachNote('🛡️ Shield needs a position with a move already played.');
      return;
    }
    if (!spendSpell('shield')) {
      setCoachNote('🛡️ Shield recharges tomorrow ✨');
      return;
    }
    // Warn if the player's just-moved piece sits on a square the opponent can capture.
    const lastSquare = lastMove?.to;
    if (!lastSquare) {
      setCoachNote('🛡️ Shield: no recent move to check.');
      return;
    }
    const enemyCanCapture = game
      .moves({ verbose: true })
      .some((move) => move.to === lastSquare && Boolean(move.captured));
    if (enemyCanCapture) {
      const piece = game.get(lastSquare as Square);
      const names: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
      setCoachNote(`⚠️ Shield warning: your ${piece ? names[piece.type] : 'piece'} on ${lastSquare} can be captured! Make sure it is defended.`);
    } else {
      setCoachNote('🛡️ Shield: your last-moved piece looks safe for now.');
    }
  };

  const showHint = () => {
    if (isThinking || game.isGameOver()) {
      setCoachNote('Hint unavailable while the game is over or the bot is thinking.');
      return;
    }
    if (!spendSpell('truesight')) {
      setCoachNote('🔮 True Sight recharges tomorrow ✨');
      return;
    }

    const copy = copyGame(game);
    const uci = getBotMove(game.fen(), level);
    if (!uci) {
      setCoachNote('No hint is available for this position.');
      return;
    }

    const move = copy.move(uciToMove(uci));
    if (!move) {
      setCoachNote('Hint generator had trouble parsing the recommended move.');
      return;
    }

    setCoachNote(`Hint: ${move.san}. Try it if it keeps your position safe.`);
  };

  const onSquareClick = (square: Square) => {
    if (isThinking || pendingPromotion || game.isGameOver()) return;
    initAudio();
    if (gameMode === 'vs-computer' && game.turn() !== playerColor) return;

    const currentTurn = game.turn();
    const piece = game.get(square);

    if (!selectedSquare) {
      if (piece?.color === currentTurn) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === currentTurn) {
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
    if (gameMode === 'two-player' || game.turn() === playerColor || game.isGameOver()) return;

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
        if (move && timeControl !== 'untimed') setClock((value) => commitClockMove(value, move.color, performance.now()));
        if (move) setLastMove({ from: move.from, to: move.to });
        if (move) {
          playMoveSound(move, copy);
          if (move.piece === 'q' && fairyQueenActive()) playFairyQueenLayer();
        }
        const stateMsg = coachMessageFromGameState(copy, 'vs-computer');
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
  }, [game, level, gameMode, playerColor, timeControl]);

  useEffect(() => {
    if (timeControl === 'untimed' || !game.isGameOver()) return;
    setClock((value) => stopClock(value, performance.now()));
  }, [game, timeControl]);

  useEffect(() => {
    if (!game.isGameOver()) return;
    const pgn = game.pgn();
    if (!pgn || archivedPgnRef.current === pgn) return;
    archivedPgnRef.current = pgn;
    const createdAtIso = new Date().toISOString();
    const winner = game.isCheckmate() ? (game.turn() === 'b' ? 'White wins' : 'Black wins') : 'Draw';
    if (gameMode === 'vs-computer') {
      const winningColor = game.isCheckmate() ? (game.turn() === 'b' ? 'w' : 'b') : null;
      recordGameCompleted(winningColor === playerColor);
    }
    saveLocalGame({
      schemaVersion: 1,
      id: createGameId(pgn, createdAtIso),
      createdAtIso,
      playerColor,
      opponentType: gameMode === 'two-player' ? 'human' : 'bot',
      result: winner,
      pgn,
      moves: game.history(),
      finalFen: game.fen(),
      botLevelId: gameMode === 'vs-computer' ? levelId : undefined,
    });
  }, [game, gameMode, levelId, playerColor]);

  const loadPgn = (pgn: string) => {
    const loaded = new Chess();
    try {
      loaded.loadPgn(pgn);
      engineRequestId.current += 1;
      cancelStockfishMove();
      setGame(loaded);
      setSelectedSquare(null);
      setLastMove(null);
      setPendingPromotion(null);
      setImportPgn('');
      setCoachNote('PGN loaded. Review the move list or continue if the game is unfinished.');
    } catch {
      setCoachNote('That PGN could not be loaded. Check the move text and try again.');
    }
  };

  // Post-game review state
  const [showReview, setShowReview] = useState(false);
  const [reviewContext, setReviewContext] = useState<GameData | null>(null);
  const [reviewAutoRequest, setReviewAutoRequest] = useState(false);

  function buildGameReviewContext(game: Chess, botLabelOrLevel: any): GameData {
    const moves = moveSanList(game);
    let result: GameData['result'] = 'draw';
    if (game.isCheckmate()) {
      const winner = game.turn() === 'b' ? 'w' : 'b';
      const playerWon = winner === playerColor;
      result = playerWon ? 'win' : 'loss';
    } else if (game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial() || game.isDraw()) {
      result = 'draw';
    }

    const botLevelValue = typeof botLabelOrLevel === 'object' && botLabelOrLevel?.elo ? botLabelOrLevel.elo : undefined;

    return {
      playerColor: playerColor === 'w' ? 'white' : 'black',
      botColor: twoPlayer ? undefined : playerColor === 'w' ? 'black' : 'white',
      opponentType: twoPlayer ? 'human' : 'bot',
      result,
      moves,
      finalFEN: game.fen(),
      finalMove: moves.length > 0 ? moves[moves.length - 1] : undefined,
      isCheckmate: game.isCheckmate(),
      sideToMoveAfterGame: game.turn() === 'w' ? 'white' : 'black',
      winner: game.isCheckmate() ? (game.turn() === 'b' ? 'white' : 'black') : null,
      moveCount: moves.length,
      botLevel: twoPlayer ? undefined : botLevelValue,
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

  const twoPlayer = gameMode === 'two-player';

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,620px)_minmax(320px,1fr)]">
      <div className="glass-panel min-w-0 rounded-3xl p-2 sm:p-6">
        <div className="mb-3 sm:mb-4">
          <div className="mb-3 flex rounded-2xl border border-slate-600 bg-slate-950/60 p-1">
            <button
              onClick={() => { setGameMode('vs-computer'); resetGame(); }}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${!twoPlayer ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              vs Computer
            </button>
            <button
              onClick={() => { setGameMode('two-player'); resetGame(); }}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${twoPlayer ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              2 Players (pass &amp; play)
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-2xl">{twoPlayer ? '2 Players — Pass & Play' : 'Play vs Computer'}</h2>
              <p className="text-xs text-slate-300 sm:text-sm">
                {twoPlayer ? 'Both players take turns on this device.' : `Choose a training level. You play ${playerColor === 'w' ? 'White' : 'Black'}, and these are practice levels rather than official ratings.`}
              </p>
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={resetGame} className="rounded-xl bg-teal-400 px-4 py-2 font-bold text-slate-950 hover:bg-teal-300">New game</button>
              <button disabled={isThinking || (game.history().length === 0 && !pendingPromotion) || (!twoPlayer && spellsOn && spellSlots.slots.rewind <= 0)} onClick={undoPair} className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40" title="Rewind spell">⏪ {twoPlayer ? 'Undo' : 'Undo pair'}{!twoPlayer && spellsOn ? ` (${spellSlots.slots.rewind})` : ''}</button>
              {!twoPlayer && <button disabled={Boolean(pendingPromotion) || game.isGameOver() || (spellsOn && spellSlots.slots.truesight <= 0)} onClick={showHint} className="rounded-xl border border-yellow-300/70 bg-yellow-200/10 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-200/20 disabled:cursor-not-allowed disabled:opacity-40" title="True Sight spell">🔮 True Sight{spellsOn ? ` (${spellSlots.slots.truesight})` : ''}</button>}
              {!twoPlayer && <button disabled={game.isGameOver() || game.history().length === 0 || (spellsOn && spellSlots.slots.shield <= 0)} onClick={castShield} className="rounded-xl border border-sky-300/70 bg-sky-200/10 px-4 py-2 text-sm text-sky-100 hover:bg-sky-200/20 disabled:cursor-not-allowed disabled:opacity-40" title="Shield spell — warns if your last piece is hanging">🛡️ Shield{spellsOn ? ` (${spellSlots.slots.shield})` : ''}</button>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="mt-3 min-h-11 rounded-xl border border-teal-300/50 px-4 py-2 text-sm font-semibold text-teal-100 hover:bg-teal-300/10"
          >
            How to play
          </button>
          <button
            type="button"
            onClick={toggleSpells}
            className="mt-3 ml-0 sm:ml-2 min-h-11 rounded-xl border border-purple-300/50 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-300/10"
            title="Spell slots limit hints/undo to keep them special. Turn off for classic unlimited mode."
          >
            {spellsOn ? '🪄 Spell slots: ON (3/day)' : '🪄 Spell slots: OFF (classic)'}
          </button>
        </div>

        {showOnboarding && (
          <div role="dialog" aria-labelledby="play-guide-title" className="mb-4 rounded-2xl border border-teal-300/50 bg-slate-950/95 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="play-guide-title" className="text-lg font-bold text-teal-200">Your first chess game</h3>
                <p className="mt-1 text-sm text-slate-300">Win by checkmating the enemy king: attack it so there is no legal escape.</p>
              </div>
              <button type="button" onClick={closeOnboarding} aria-label="Close how to play guide" className="min-h-11 rounded-xl border border-slate-600 px-3 text-sm font-bold">Close</button>
            </div>
            <ol className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              <li className="rounded-xl bg-slate-800/70 p-3"><strong>1. Select a piece.</strong> Choose one of your pieces. Highlighted destinations show where it can legally move.</li>
              <li className="rounded-xl bg-slate-800/70 p-3"><strong>2. Read the markers.</strong> Dots are legal empty squares. Red rings mean a capture is available.</li>
              <li className="rounded-xl bg-slate-800/70 p-3"><strong>3. Keep your king safe.</strong> If your king is in check, you must move, block, or capture the attacker.</li>
              <li className="rounded-xl bg-slate-800/70 p-3"><strong>4. Start simply.</strong> Move a centre pawn, develop knights and bishops, then castle.</li>
            </ol>
            <button type="button" onClick={closeOnboarding} className="mt-4 min-h-12 w-full rounded-xl bg-teal-400 px-4 py-3 font-bold text-slate-950">Start playing</button>
          </div>
        )}

        <div className="mobile-coach mb-3 sm:mb-4">
          <p className="text-sm font-semibold text-yellow-200">Coach</p>
          <p className="text-sm text-slate-100">{isThinking && !twoPlayer ? 'Bot is thinking…' : coachNote}</p>
        </div>

        {engineNotice && <p className="mb-4 rounded-xl border border-yellow-300/40 bg-yellow-950/30 p-3 text-sm text-yellow-100">{engineNotice}</p>}
        {opening && <p className="mb-4 rounded-xl border border-teal-300/40 bg-teal-950/30 p-3 text-sm text-teal-100"><strong>{opening.name}:</strong> {opening.idea}</p>}

        {game.isGameOver() && (
          <div className={`mb-4 rounded-2xl border-2 p-4 text-center font-bold ${
            twoPlayer && game.isCheckmate()
              ? 'border-yellow-400/50 bg-yellow-950/40 text-yellow-200'
              : game.isCheckmate() && game.turn() === 'b'
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
              reviewContext && <PostGameReview gameData={reviewContext} autoRequest={reviewAutoRequest} onSummary={(summary) => saveLocalGameReview(game.pgn(), summary)} />
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

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {boardFlipped ? (twoPlayer ? 'White' : playerColor === 'w' ? 'You · White' : 'White bot') : (twoPlayer ? 'Black' : playerColor === 'b' ? 'You · Black' : 'Black bot')}
        </p>
        {!twoPlayer && (
          <div className="mb-4 rounded-2xl border border-teal-300/30 bg-slate-950/70 p-3 text-sm text-teal-100">
            White always starts. Select one of your pieces to see legal moves: dots are destinations and red rings are captures.
          </div>
        )}
        <div className="relative">
          <ChessBoard game={game} selectedSquare={selectedSquare} legalTargets={legalTargets} captureSquares={captureSquares} lastMove={lastMove} disabled={isThinking || Boolean(pendingPromotion) || game.isGameOver()} flipped={boardFlipped} onSquareClick={onSquareClick} />
          {reaction && <EmojiReaction key={reaction.nonce} emoji={reaction.emoji} />}
        </div>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
          {boardFlipped ? (twoPlayer ? 'Black' : playerColor === 'b' ? 'You · Black' : 'Black bot') : (twoPlayer ? 'White' : playerColor === 'w' ? 'You · White' : 'White bot')}
        </p>

        {twoPlayer && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 border-t border-slate-600/50 pt-3">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => showReaction(emoji)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-600/60 bg-slate-950/60 text-2xl transition hover:border-teal-300 hover:bg-slate-800 active:scale-95"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Mobile action bar */}
        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
          <button onClick={resetGame} className="flex-1 rounded-2xl bg-teal-400 py-3 text-center font-bold text-slate-950">New</button>
          <button disabled={isThinking || (game.history().length === 0 && !pendingPromotion) || (!twoPlayer && spellsOn && spellSlots.slots.rewind <= 0)} onClick={undoPair} className="flex-1 rounded-2xl border border-slate-600 py-3 text-center text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40">⏪{!twoPlayer && spellsOn ? ` ${spellSlots.slots.rewind}` : ''}</button>
          <button disabled={Boolean(pendingPromotion) || game.isGameOver() || (!twoPlayer && spellsOn && spellSlots.slots.truesight <= 0)} onClick={twoPlayer ? () => setCoachNote('Hint: Look for checks, captures, and threats before each move.') : showHint} className="flex-1 rounded-2xl bg-yellow-200/10 py-3 text-center text-sm text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40">🔮{!twoPlayer && spellsOn ? ` ${spellSlots.slots.truesight}` : ''}</button>
          {!twoPlayer && <button disabled={game.isGameOver() || game.history().length === 0 || (spellsOn && spellSlots.slots.shield <= 0)} onClick={castShield} className="flex-1 rounded-2xl bg-sky-200/10 py-3 text-center text-sm text-sky-100 disabled:cursor-not-allowed disabled:opacity-40">🛡️{spellsOn ? ` ${spellSlots.slots.shield}` : ''}</button>}
        </div>
      </div>

      <aside className="min-w-0 space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Settings</h3>
          <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-600/60 bg-slate-950/50 px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-slate-100">Sound effects</span>
              <span className="block text-xs text-slate-400">Move chimes and capture sparkles</span>
            </span>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(event) => {
                initAudio();
                setSoundEffects(event.target.checked);
              }}
              className="h-5 w-5 accent-teal-400"
            />
          </label>
        </div>

        {!twoPlayer && (
          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-300" htmlFor="player-color">Your color
                <select id="player-color" value={playerColor} onChange={(event) => { const color = event.target.value as PlayerColor; setPlayerColor(color); setBoardFlipped(color === 'b'); }} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white">
                  <option value="w">White</option>
                  <option value="b">Black</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-300" htmlFor="time-control">Time control
                <select id="time-control" value={timeControl} onChange={(event) => setTimeControl(event.target.value as TimeControl)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white">
                  <option value="untimed">Untimed</option>
                  <option value="10+0">10 minutes</option>
                  <option value="5+0">5 minutes</option>
                </select>
              </label>
            </div>
            <button onClick={() => setBoardFlipped((value) => !value)} className="mb-4 min-h-[44px] w-full rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800">Flip board</button>
            <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor="bot-level">Bot difficulty</label>
            <select id="bot-level" value={levelId} onChange={(event) => setLevelId(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white">
              {botLevels.map((bot) => (
                <option key={bot.id} value={bot.id}>{bot.label} · approx. {bot.elo} practice Elo</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">Approximate strength helps you choose a challenge; these are practice levels, not official ratings.</p>
            <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
              <p className="text-lg font-bold text-yellow-200">{level.label}</p>
              <p className="text-sm text-slate-300">{level.style}</p>
              <p className="mt-2 text-sm text-slate-400">{level.description}</p>
            </div>
          </div>
        )}

        {timeControl !== 'untimed' && <div className="glass-panel rounded-3xl p-5"><GameClock clock={clock} /></div>}

        <div className="glass-panel rounded-3xl p-5">
          <h3 className="font-bold text-teal-200">Coach note</h3>
          <p className="mt-2 text-slate-100">{isThinking && !twoPlayer ? 'Bot is thinking…' : coachNote}</p>
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
        <p className="sr-only" aria-live="polite">{gameStatus(game)} {coachNote}</p>

        <div className="glass-panel rounded-3xl p-5">
          <label htmlFor="pgn-import" className="font-bold text-teal-200">Import PGN</label>
          <textarea id="pgn-import" value={importPgn} onChange={(event) => setImportPgn(event.target.value)} placeholder="Paste a PGN game here" className="mt-3 min-h-24 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm text-white" />
          <button disabled={!importPgn.trim()} onClick={() => loadPgn(importPgn)} className="mt-2 min-h-[44px] w-full rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Load PGN</button>
        </div>

        <GameArchive onLoad={loadPgn} />
      </aside>
    </section>
  );
}
