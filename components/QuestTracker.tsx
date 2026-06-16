'use client';

import { useEffect } from 'react';
import { XP_AWARDED_EVENT } from '@/lib/progression/xp';
import { recordQuestProgress } from '@/lib/quests/dailyQuests';

/**
 * Invisible global tracker: advances daily quests whenever XP is awarded, so
 * quests progress on every route (Puzzle Rush, Boss Battles, etc.), not just on
 * pages where the Quest Log button is mounted. This is the single source of
 * quest-progress recording — QuestLog only displays.
 */
export default function QuestTracker() {
  useEffect(() => {
    const onAward = (event: Event) => {
      const detail = (event as CustomEvent).detail as { reason?: string } | undefined;
      if (detail?.reason && !detail.reason.startsWith('Quest:')) {
        recordQuestProgress(detail.reason);
      }
    };
    window.addEventListener(XP_AWARDED_EVENT, onAward as EventListener);
    return () => window.removeEventListener(XP_AWARDED_EVENT, onAward as EventListener);
  }, []);
  return null;
}
