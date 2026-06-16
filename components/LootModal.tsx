'use client';

import { useEffect, useState } from 'react';
import { XP_AWARDED_EVENT, awardXP } from '@/lib/progression/xp';
import {
  applyBoardTheme,
  awardLoot,
  getOwnedCosmetics,
  getRandomLoot,
  type LootItem,
} from '@/lib/loot/lootSystem';

type Stage = 'closed' | 'chest' | 'reveal';

export default function LootModal() {
  const [stage, setStage] = useState<Stage>('closed');
  const [item, setItem] = useState<LootItem | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const onXp = (event: Event) => {
      const detail = (event as CustomEvent).detail as { reason?: string } | undefined;
      if (detail?.reason !== 'Game won vs bot') return;
      if (stage !== 'closed') return;
      // Boss battles award their own reward modal; don't stack a loot chest on top.
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/bosses')) return;
      const loot = getRandomLoot(getOwnedCosmetics());
      setItem(loot);
      setApplied(false);
      setStage('chest');
    };
    window.addEventListener(XP_AWARDED_EVENT, onXp as EventListener);
    return () => window.removeEventListener(XP_AWARDED_EVENT, onXp as EventListener);
  }, [stage]);

  const openChest = () => {
    if (!item) return;
    if (item.type === 'bonus_xp') awardXP(20, 'Loot bonus XP');
    else awardLoot(item);
    setStage('reveal');
  };

  const close = () => {
    setStage('closed');
    setItem(null);
  };

  if (stage === 'closed' || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-slate-950 p-8 text-center shadow-2xl">
        {stage === 'chest' ? (
          <>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Victory reward!</p>
            <button
              type="button"
              onClick={openChest}
              className="mx-auto mt-4 block text-8xl loot-chest-shake"
              aria-label="Open the treasure chest"
            >
              🎁
            </button>
            <p className="mt-4 text-slate-300">Tap the chest to open it!</p>
          </>
        ) : (
          <>
            <div className="text-7xl">{item.emoji}</div>
            <h3 className="mt-4 text-2xl font-black text-white">
              {item.type === 'bonus_xp' ? 'You found +20 Bonus XP!' : `You unlocked ${item.name}!`}
            </h3>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {item.type === 'board_theme' && item.themeId && (
                <button
                  type="button"
                  onClick={() => {
                    applyBoardTheme(item.themeId!);
                    setApplied(true);
                  }}
                  disabled={applied}
                  className="rounded-full bg-amber-400 px-6 py-2 font-black text-slate-950 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {applied ? 'Applied ✓' : 'Apply now'}
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-slate-600 px-6 py-2 font-bold text-slate-100 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
