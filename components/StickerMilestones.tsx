'use client';

import { useEffect } from 'react';
import { XP_AWARDED_EVENT } from '@/lib/progression/xp';
import { checkStickerMilestones } from '@/lib/stickers/milestones';

/** Invisible: awards milestone stickers whenever XP is granted. */
export default function StickerMilestones() {
  useEffect(() => {
    checkStickerMilestones();
    const onAward = (event: Event) => {
      const detail = (event as CustomEvent).detail as { reason?: string } | undefined;
      checkStickerMilestones(detail?.reason);
    };
    window.addEventListener(XP_AWARDED_EVENT, onAward as EventListener);
    return () => window.removeEventListener(XP_AWARDED_EVENT, onAward as EventListener);
  }, []);
  return null;
}
