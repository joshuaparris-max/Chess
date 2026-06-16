'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  loadDailyQuests,
  QUESTS_CHANGED_EVENT,
  type DailyQuests,
  type QuestState,
} from '@/lib/quests/dailyQuests';

export default function QuestLog() {
  const [open, setOpen] = useState(false);
  const [daily, setDaily] = useState<DailyQuests | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => setDaily(loadDailyQuests()), []);

  useEffect(() => {
    refresh();

    const onChanged = () => refresh();
    const onComplete = (event: Event) => {
      const quest = (event as CustomEvent).detail as { xpReward?: number } | undefined;
      refresh();
      setToast(`Quest complete! +${quest?.xpReward ?? 0} XP 🎉`);
      window.setTimeout(() => setToast(null), 2600);
    };

    window.addEventListener(QUESTS_CHANGED_EVENT, onChanged as EventListener);
    window.addEventListener('gm-quest-complete', onComplete as EventListener);
    return () => {
      window.removeEventListener(QUESTS_CHANGED_EVENT, onChanged as EventListener);
      window.removeEventListener('gm-quest-complete', onComplete as EventListener);
    };
  }, [refresh]);

  const quests: QuestState[] = daily?.quests ?? [];
  const hasIncomplete = quests.some((q) => !q.complete);
  const completedCount = quests.filter((q) => q.complete).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-100 hover:border-amber-300/70"
        aria-label="Open quest log"
      >
        <span aria-hidden="true">📜</span>
        <span>Quests</span>
        {hasIncomplete && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-slate-900" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close quest log"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-full max-w-sm overflow-y-auto bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">📜 Daily Quests</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-300"
              >
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {completedCount}/{quests.length} complete · resets at midnight
            </p>

            <div className="mt-4 space-y-3">
              {quests.map((quest) => {
                const pct = Math.round((quest.progress / quest.required) * 100);
                return (
                  <div
                    key={quest.id}
                    className={`rounded-2xl border p-4 ${quest.complete ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/70'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          {quest.complete ? '✅ ' : ''}
                          {quest.title}
                        </p>
                        <p className="text-sm text-slate-300">{quest.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-1 text-xs font-bold text-amber-200">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full ${quest.complete ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {quest.progress} / {quest.required}
                    </p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-black text-slate-950 shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
