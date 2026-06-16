'use client';

export type LootItem = {
  id: string;
  type: 'board_theme' | 'sticker' | 'bonus_xp';
  name: string;
  emoji: string;
  themeId?: string;
};

export const OWNED_COSMETICS_KEY = 'ownedCosmetics';

export const LOOT_POOL: LootItem[] = [
  { id: 'theme_ocean', type: 'board_theme', name: 'Ocean Theme', emoji: '🌊', themeId: 'ocean' },
  { id: 'theme_forest', type: 'board_theme', name: 'Forest Theme', emoji: '🌲', themeId: 'forest' },
  { id: 'theme_sunset', type: 'board_theme', name: 'Sunset Theme', emoji: '🌅', themeId: 'sunset' },
  { id: 'theme_midnight', type: 'board_theme', name: 'Midnight Theme', emoji: '🌙', themeId: 'midnight' },
  { id: 'sticker_dragon', type: 'sticker', name: 'Dragon', emoji: '🐉' },
  { id: 'sticker_castle', type: 'sticker', name: 'Castle', emoji: '🏰' },
  { id: 'sticker_gem', type: 'sticker', name: 'Gem', emoji: '💎' },
];

const BONUS_XP: LootItem = { id: 'bonus_xp', type: 'bonus_xp', name: 'Bonus XP', emoji: '✨' };

export function getOwnedCosmetics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OWNED_COSMETICS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Pick a random unowned cosmetic, or bonus XP if everything is owned. */
export function getRandomLoot(ownedIds: string[]): LootItem {
  const unowned = LOOT_POOL.filter((item) => !ownedIds.includes(item.id));
  if (unowned.length === 0) return BONUS_XP;
  return unowned[Math.floor(Math.random() * unowned.length)];
}

export function awardLoot(item: LootItem): void {
  if (typeof window === 'undefined' || item.type === 'bonus_xp') return;
  try {
    const owned = getOwnedCosmetics();
    if (!owned.includes(item.id)) {
      owned.push(item.id);
      window.localStorage.setItem(OWNED_COSMETICS_KEY, JSON.stringify(owned));
    }
    if (item.type === 'sticker') {
      const raw = window.localStorage.getItem('earnedStickers');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const stickerId = item.id.replace(/^sticker_/, '');
      if (!list.includes(stickerId)) {
        list.push(stickerId);
        window.localStorage.setItem('earnedStickers', JSON.stringify(list));
      }
    }
  } catch {
    // best effort
  }
}

export function applyBoardTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('gm-board-theme', themeId);
    window.dispatchEvent(new CustomEvent('gm-board-theme-change', { detail: themeId }));
  } catch {
    // ignore
  }
}
