'use client';

import { getStoredProgress, PLAYER_PROGRESS_KEY, getLevel } from '@/lib/progression/xp';

export type FamilyProfile = {
  name: string;
  emoji: string;
  xp: number;
  gamesPlayed: number;
  puzzlesSolved: number;
};

export const FAMILY_PROFILES_KEY = 'familyProfiles';
export const ACTIVE_PROFILE_KEY = 'activeProfile';
export const PROFILE_EMOJIS = ['👨', '👧', '👦', '👩', '🧒', '🦸', '🦄', '🐉', '🦊', '🐧'];

export function loadProfiles(): FamilyProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAMILY_PROFILES_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list
      .filter((p): p is FamilyProfile => Boolean(p && typeof p === 'object' && typeof (p as FamilyProfile).name === 'string'))
      .map((p) => ({
        name: p.name,
        emoji: typeof p.emoji === 'string' ? p.emoji : '🙂',
        xp: Math.max(0, Number(p.xp) || 0),
        gamesPlayed: Math.max(0, Number(p.gamesPlayed) || 0),
        puzzlesSolved: Math.max(0, Number(p.puzzlesSolved) || 0),
      }));
  } catch {
    return [];
  }
}

function saveProfiles(profiles: FamilyProfile[]) {
  try {
    window.localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

export function getActiveProfileName(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

/** Snapshot the live global progress back into the named profile. */
export function syncActiveIntoProfiles(): FamilyProfile[] {
  const active = getActiveProfileName();
  if (!active) return loadProfiles();
  const progress = getStoredProgress();
  const profiles = loadProfiles().map((p) =>
    p.name === active
      ? { ...p, xp: progress.xp, gamesPlayed: progress.gamesPlayed, puzzlesSolved: progress.puzzlesSolved }
      : p,
  );
  saveProfiles(profiles);
  return profiles;
}

/** Make a profile active: snapshot the current one out, load the target's stats into global progress. */
export function switchProfile(name: string) {
  syncActiveIntoProfiles();
  const profile = loadProfiles().find((p) => p.name === name);
  if (!profile) return;
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, name);
    window.localStorage.setItem(
      PLAYER_PROGRESS_KEY,
      JSON.stringify({
        xp: profile.xp,
        level: getLevel(profile.xp).name,
        gamesPlayed: profile.gamesPlayed,
        puzzlesSolved: profile.puzzlesSolved,
      }),
    );
    window.dispatchEvent(new CustomEvent('gm-profile-switched', { detail: name }));
  } catch {
    // ignore
  }
}

export function addProfile(name: string, emoji: string): FamilyProfile[] {
  const trimmed = name.trim().slice(0, 20) || 'Player';
  const existing = loadProfiles();
  if (existing.some((p) => p.name === trimmed)) return existing;
  const next = [...existing, { name: trimmed, emoji, xp: 0, gamesPlayed: 0, puzzlesSolved: 0 }];
  saveProfiles(next);
  return next;
}

export function leaderboard(): FamilyProfile[] {
  return [...syncActiveIntoProfiles()].sort((a, b) => b.xp - a.xp);
}
