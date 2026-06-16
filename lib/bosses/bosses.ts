export type Boss = {
  id: string;
  name: string;
  emoji: string;
  /** Stockfish search depth / difficulty. */
  depth: number;
  /** 1-5 difficulty pips. */
  difficulty: number;
  description: string;
  reward: string;
  rewardLabel: string;
};

export const BOSSES: Boss[] = [
  {
    id: 'goblin',
    name: 'Goblin Snatcher',
    emoji: '👺',
    depth: 2,
    difficulty: 1,
    description: 'Greedy and chaotic. Will grab any piece it can.',
    reward: 'theme_forest',
    rewardLabel: '🌲 Forest Theme',
  },
  {
    id: 'orc',
    name: 'Orc Crusher',
    emoji: '👹',
    depth: 4,
    difficulty: 2,
    description: 'Aggressive attacker. Always pushes pawns forward.',
    reward: 'sticker_dragon',
    rewardLabel: '🐉 Dragon Sticker',
  },
  {
    id: 'witch',
    name: 'Chess Witch',
    emoji: '🧙',
    depth: 6,
    difficulty: 3,
    description: 'Tricky and unpredictable. Loves forks.',
    reward: 'theme_sunset',
    rewardLabel: '🌅 Sunset Theme',
  },
  {
    id: 'dragon',
    name: 'Elder Dragon',
    emoji: '🐉',
    depth: 8,
    difficulty: 4,
    description: 'Sacrifices pieces for brutal attacks.',
    reward: 'sticker_gem',
    rewardLabel: '💎 Gem Sticker',
  },
  {
    id: 'lich',
    name: 'Ancient Lich',
    emoji: '💀',
    depth: 12,
    difficulty: 5,
    description: 'The endgame master. Coldly efficient.',
    reward: 'theme_midnight',
    rewardLabel: '🌙 Midnight Theme',
  },
];

export const DEFEATED_BOSSES_KEY = 'defeatedBosses';

export function getDefeatedBosses(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEFEATED_BOSSES_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function markBossDefeated(id: string): string[] {
  const list = getDefeatedBosses();
  if (!list.includes(id)) {
    list.push(id);
    try {
      window.localStorage.setItem(DEFEATED_BOSSES_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
  return list;
}
