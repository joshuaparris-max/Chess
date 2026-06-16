'use client';

import { awardSticker, getEarnedStickerIds } from './awardSticker';
import { getStoredProgress } from '@/lib/progression/xp';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Award any milestone stickers the player now qualifies for. Called on XP-award
 * events so it re-evaluates cumulative progress + current settings. Idempotent —
 * awardSticker de-dupes, so re-awarding is a no-op.
 */
export function checkStickerMilestones(reason?: string): void {
  if (typeof window === 'undefined') return;
  const owned = new Set(getEarnedStickerIds());
  const progress = getStoredProgress();
  const grant = (id: string, when: boolean) => {
    if (when && !owned.has(id)) {
      awardSticker(id);
      owned.add(id);
    }
  };

  // Cumulative progress
  grant('star', progress.puzzlesSolved >= 5);
  grant('heart', progress.gamesPlayed >= 3);

  // Settings / cosmetics
  grant('unicorn', read('gm-piece-set') === 'fairy');
  grant('palette', read('gm-piece-set') !== null && read('gm-piece-set') !== 'classic');
  grant('mushroom', read('gm-board-theme') === 'fairyGarden');
  grant('moon', read('bedtimeMode') === 'true');

  // Streak best
  grant('sparkle', (Number(read('puzzleStreakBest')) || 0) >= 3);

  // Event-driven (reason from the XP award)
  if (reason) {
    grant('flower', reason.startsWith('Puzzle solved'));
    grant('rainbow', reason === 'Game won vs bot');
    grant('magic', reason === 'Game won vs bot');
    grant('dragon', reason === 'Game won vs bot');
    grant('castle', reason === 'Story chapter complete');
  }
}
