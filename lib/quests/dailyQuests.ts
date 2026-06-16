'use client';

import { awardXP } from '@/lib/progression/xp';

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  required: number;
  // Returns true when an XP award with this reason should advance the quest.
  matches: (reason: string) => boolean;
};

export type QuestState = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  required: number;
  progress: number;
  complete: boolean;
};

export type DailyQuests = {
  date: string;
  quests: QuestState[];
};

export const DAILY_QUESTS_KEY = 'dailyQuests';
export const QUESTS_CHANGED_EVENT = 'gm-quests-changed';

const startsWith = (prefix: string) => (reason: string) => reason.startsWith(prefix);

export const QUEST_POOL: QuestDef[] = [
  { id: 'play_game', title: 'Warm Up', description: 'Play any game', xpReward: 15, required: 1, matches: startsWith('Game') },
  { id: 'win_game', title: 'Victory', description: 'Win a game vs the bot', xpReward: 30, required: 1, matches: (r) => r === 'Game won vs bot' },
  { id: 'puzzle_solver', title: 'Puzzle Solver', description: 'Solve 3 puzzles', xpReward: 25, required: 3, matches: startsWith('Puzzle solved') },
  { id: 'first_try', title: 'Sharp Eye', description: 'Solve a puzzle on the first try', xpReward: 20, required: 1, matches: (r) => r === 'Puzzle solved first try' },
  { id: 'puzzle_marathon', title: 'Puzzle Marathon', description: 'Solve 5 puzzles', xpReward: 30, required: 5, matches: startsWith('Puzzle solved') },
  { id: 'double_win', title: 'Back to Back', description: 'Win 2 games vs the bot', xpReward: 40, required: 2, matches: (r) => r === 'Game won vs bot' },
  { id: 'story_time', title: 'Story Time', description: 'Complete a story chapter', xpReward: 30, required: 1, matches: (r) => r === 'Story chapter complete' },
  { id: 'persistent', title: 'Persistence', description: 'Finish 3 games', xpReward: 25, required: 3, matches: startsWith('Game') },
];

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seedFromDate(date: string): number {
  let hash = 2166136261;
  for (const char of date) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Deterministically pick 3 quests for the given date so they stay stable all day. */
export function pickQuestsForDate(date: string): QuestDef[] {
  const pool = [...QUEST_POOL];
  const picks: QuestDef[] = [];
  let seed = seedFromDate(date);
  while (picks.length < 3 && pool.length > 0) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const idx = seed % pool.length;
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}

function toState(def: QuestDef): QuestState {
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    xpReward: def.xpReward,
    required: def.required,
    progress: 0,
    complete: false,
  };
}

export function loadDailyQuests(now = new Date()): DailyQuests {
  const date = todayKey(now);
  if (typeof window === 'undefined') {
    return { date, quests: pickQuestsForDate(date).map(toState) };
  }
  try {
    const raw = window.localStorage.getItem(DAILY_QUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyQuests;
      if (parsed.date === date && Array.isArray(parsed.quests) && parsed.quests.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fall through to regenerate
  }
  const fresh: DailyQuests = { date, quests: pickQuestsForDate(date).map(toState) };
  try {
    window.localStorage.setItem(DAILY_QUESTS_KEY, JSON.stringify(fresh));
  } catch {
    // ignore
  }
  return fresh;
}

function saveDailyQuests(state: DailyQuests) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DAILY_QUESTS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(QUESTS_CHANGED_EVENT, { detail: state }));
  } catch {
    // ignore
  }
}

/**
 * Advance today's quests in response to an XP-award reason. Returns the list of
 * quests that newly completed (so the UI can toast them). Completed quests also
 * grant their XP reward.
 */
export function recordQuestProgress(reason: string, now = new Date()): QuestState[] {
  const state = loadDailyQuests(now);
  const newlyComplete: QuestState[] = [];
  const defById = new Map(QUEST_POOL.map((d) => [d.id, d]));

  const nextQuests = state.quests.map((quest) => {
    if (quest.complete) return quest;
    const def = defById.get(quest.id);
    if (!def || !def.matches(reason)) return quest;
    const progress = Math.min(quest.required, quest.progress + 1);
    const complete = progress >= quest.required;
    const updated = { ...quest, progress, complete };
    if (complete) newlyComplete.push(updated);
    return updated;
  });

  if (newlyComplete.length > 0 || nextQuests.some((q, i) => q.progress !== state.quests[i].progress)) {
    saveDailyQuests({ ...state, quests: nextQuests });
  }
  // Award XP for newly completed quests (avoid recursion: quest XP reasons are
  // prefixed and never match the pool predicates).
  newlyComplete.forEach((quest) => awardXP(quest.xpReward, `Quest: ${quest.title}`));
  return newlyComplete;
}

export function hasIncompleteQuests(now = new Date()): boolean {
  return loadDailyQuests(now).quests.some((q) => !q.complete);
}
