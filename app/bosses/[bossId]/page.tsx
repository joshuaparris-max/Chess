'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { BOSSES, markBossDefeated } from '@/lib/bosses/bosses';
import { getBotMove, uciToMove } from '@/lib/engine';
import { awardLoot, applyBoardTheme, LOOT_POOL } from '@/lib/loot/lootSystem';
import { recordGameCompleted } from '@/lib/progression/xp';
import type { BotLevel } from '@/lib/types';

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const START_MATERIAL = 8 * 1 + 2 * 3 + 2 * 3 + 2 * 5 + 9; // 39

function bossLevel(depth: number): BotLevel {
  return {
    id: `boss-d${depth}`,
    label: 'Boss',
    elo: 400 + depth * 180,
    style: 'boss',
    depth: Math.min(4, Math.max(1, Math.ceil(depth / 3))),
    noise: Math.max(0, 40 - depth * 3),
    blunderChance: Math.max(0, 0.28 - depth * 0.03),
    stockfishSkill: Math.min(20, depth * 2),
    moveTimeMs: 120,
    description: 'Boss opponent',
  };
}

function material(game: Chess, color: 'w' | 'b'): number {
  let total = 0;
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.color === color) total += PIECE_VALUE[cell.type] ?? 0;
    }
  }
  return total;
}

export default function BossBattlePage({ params }: { params: Promise<{ bossId: string }> }) {
  const { bossId } = use(params);
  const boss = BOSSES.find((b) => b.id === bossId);

  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [explode, setExplode] = useState(false);
  const [applied, setApplied] = useState(false);
  const level = useMemo(() => bossLevel(boss?.depth ?? 2), [boss]);
  const turnRef = useRef(0);

  const reset = useCallback(() => {
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
    setThinking(false);
    setResult(null);
    setExplode(false);
    setApplied(false);
    turnRef.current += 1;
  }, []);

  // Boss health from material (boss is Black).
  const bossHealth = Math.max(0, Math.min(100, Math.round((material(game, 'b') / START_MATERIAL) * 100)));
  const healthColor = bossHealth > 60 ? 'bg-emerald-500' : bossHealth > 30 ? 'bg-yellow-500' : 'bg-red-500';

  const finishIfOver = useCallback((g: Chess): boolean => {
    if (g.isCheckmate()) {
      // side to move is checkmated; if it's black's turn, player (white) won.
      const playerWon = g.turn() === 'b';
      setResult(playerWon ? 'won' : 'lost');
      if (playerWon && boss) {
        setExplode(true);
        markBossDefeated(boss.id);
        const lootItem = LOOT_POOL.find((l) => l.id === boss.reward);
        if (lootItem) awardLoot(lootItem);
        recordGameCompleted(true);
      } else {
        recordGameCompleted(false);
      }
      return true;
    }
    if (g.isDraw() || g.isStalemate()) {
      setResult('lost');
      recordGameCompleted(false);
      return true;
    }
    return false;
  }, [boss]);

  const bossReply = useCallback((afterPlayer: Chess) => {
    const myTurn = turnRef.current;
    setThinking(true);
    window.setTimeout(() => {
      if (turnRef.current !== myTurn) return;
      const uci = getBotMove(afterPlayer.fen(), level);
      const copy = new Chess(afterPlayer.fen());
      if (uci) {
        try {
          const mv = copy.move(uciToMove(uci));
          if (mv) {
            setGame(copy);
            setLastMove({ from: mv.from, to: mv.to });
          }
        } catch {
          // ignore invalid engine move
        }
      }
      setThinking(false);
      finishIfOver(copy);
    }, 400);
  }, [level, finishIfOver]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const onSquareClick = (square: Square) => {
    if (result || thinking || game.turn() !== 'w' || game.isGameOver()) return;
    const piece = game.get(square);
    if (!selected) {
      if (piece?.color === 'w') setSelected(square);
      return;
    }
    if (selected === square) {
      setSelected(null);
      return;
    }
    if (piece?.color === 'w') {
      setSelected(square);
      return;
    }
    const copy = new Chess(game.fen());
    try {
      const mv = copy.move({ from: selected, to: square, promotion: 'q' });
      if (!mv) {
        setSelected(null);
        return;
      }
      setGame(copy);
      setLastMove({ from: mv.from, to: mv.to });
      setSelected(null);
      if (!finishIfOver(copy)) bossReply(copy);
    } catch {
      setSelected(null);
    }
  };

  if (!boss) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center text-slate-100">
        <p>Unknown boss.</p>
        <Link href="/bosses" className="text-rose-300 underline">
          Back to bosses
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/bosses" className="text-sm font-semibold text-rose-300 hover:underline">
          ← Bosses
        </Link>
        <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-200">
          Restart
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <div className="flex items-center gap-3">
          <span className={`text-5xl ${explode ? 'animate-spin' : ''}`}>{boss.emoji}</span>
          <div className="flex-1">
            <h1 className="text-lg font-black">{boss.name}</h1>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-700">
              <div className={`h-full rounded-full transition-all ${healthColor}`} style={{ width: `${bossHealth}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Boss health {bossHealth}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ChessBoard
          game={game}
          selectedSquare={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          disabled={Boolean(result) || thinking || game.turn() !== 'w'}
          onSquareClick={onSquareClick}
        />
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-slate-300">
        {result ? '' : thinking ? `${boss.name} is thinking…` : 'Your move (White) — checkmate the boss!'}
      </p>

      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-950 p-8 text-center">
            {result === 'won' ? (
              <>
                <div className="text-7xl">🏆</div>
                <h2 className="mt-3 text-2xl font-black text-emerald-300">Boss Defeated!</h2>
                <p className="mt-2 text-slate-300">You unlocked {boss.rewardLabel}!</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {boss.reward.startsWith('theme_') && (
                    <button
                      onClick={() => {
                        applyBoardTheme(boss.reward.replace('theme_', ''));
                        setApplied(true);
                      }}
                      disabled={applied}
                      className="rounded-full bg-amber-400 px-5 py-2 font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {applied ? 'Applied ✓' : 'Apply theme'}
                    </button>
                  )}
                  <Link href="/bosses" className="rounded-full border border-slate-600 px-5 py-2 font-bold">
                    Back to Bosses
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="text-7xl">{boss.emoji}</div>
                <h2 className="mt-3 text-2xl font-black text-rose-300">The {boss.name} defeated you…</h2>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button onClick={reset} className="rounded-full bg-rose-500 px-6 py-2 font-black text-white">
                    Try Again
                  </button>
                  <Link href="/bosses" className="rounded-full border border-slate-600 px-6 py-2 font-bold">
                    Back
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
