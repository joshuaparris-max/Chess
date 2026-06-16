export const EARNED_STICKERS_KEY = 'earnedStickers';
export const STORY_PROGRESS_KEY = 'storyProgress';

export function normaliseStickerIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}

export function getEarnedStickerIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const direct = normaliseStickerIds(JSON.parse(window.localStorage.getItem(EARNED_STICKERS_KEY) || '[]'));
    const story = JSON.parse(window.localStorage.getItem(STORY_PROGRESS_KEY) || '{}') as { stickersEarned?: unknown };
    return normaliseStickerIds([...direct, ...normaliseStickerIds(story.stickersEarned)]);
  } catch {
    return [];
  }
}

export function awardSticker(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const next = normaliseStickerIds([...getEarnedStickerIds(), id]);
    window.localStorage.setItem(EARNED_STICKERS_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the current session should keep working.
  }
}

