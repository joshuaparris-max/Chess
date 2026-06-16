'use client';

import { useEffect, useState } from 'react';
import { getPlayerProgress, XP_AWARDED_EVENT, type PlayerLevel } from '@/lib/progression/xp';

type XpToast = {
  amount: number;
  reason: string;
};

type LevelUp = {
  level: PlayerLevel;
};

export default function XpBadge() {
  // Start from a stable default so server and client first render match; the
  // real values load in the effect below (avoids a hydration mismatch).
  const [progress, setProgress] = useState({
    xp: 0,
    level: 'Pawn',
    symbol: '♟',
    nextLevelXp: 100,
    progressPercent: 0,
  });
  const [toast, setToast] = useState<XpToast | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUp | null>(null);

  useEffect(() => {
    const refresh = () => setProgress(getPlayerProgress());
    refresh();

    const onAward = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        amount: number;
        reason: string;
        level: PlayerLevel;
        previousLevel: PlayerLevel | null;
      };
      refresh();
      setToast({ amount: detail.amount, reason: detail.reason });
      window.setTimeout(() => setToast(null), 2200);
      if (detail.previousLevel) setLevelUp({ level: detail.level });
    };

    window.addEventListener(XP_AWARDED_EVENT, onAward);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(XP_AWARDED_EVENT, onAward);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const remaining = Math.max(0, progress.nextLevelXp - progress.xp);

  return (
    <>
      <div
        className="rounded-2xl border border-yellow-200/40 bg-slate-950/70 px-4 py-3 text-left shadow-sm"
        title={`${progress.xp} XP - ${remaining} XP to next level`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">{progress.symbol}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">Level</p>
            <p className="truncate text-sm font-black text-white">{progress.level}</p>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-yellow-200 transition-all" style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-300">{progress.xp} XP</p>
      </div>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-2xl border border-yellow-200/50 bg-slate-950 px-4 py-3 text-sm font-bold text-yellow-100 shadow-2xl">
          +{toast.amount} XP - {toast.reason}
        </div>
      )}

      {levelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-w-sm rounded-[2rem] border border-yellow-200/50 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="text-7xl">{levelUp.level.symbol}</div>
            <h3 className="mt-4 text-3xl font-black text-white">You reached {levelUp.level.name}!</h3>
            <p className="mt-2 text-sm text-slate-300">Your chess journey just levelled up.</p>
            <button
              type="button"
              onClick={() => setLevelUp(null)}
              className="mt-6 min-h-11 rounded-2xl bg-yellow-200 px-5 py-2 text-sm font-black text-slate-950"
            >
              Keep going
            </button>
          </div>
        </div>
      )}
    </>
  );
}

