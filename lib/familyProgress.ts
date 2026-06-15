'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type FamilyProgress = {
  adventuresDone: string[];
  lessonsDone: string[];
  puzzleStars: Record<string, number>;
};

export type FamilyProfile = { id: string; name: string; emoji: string };

const LEGACY_KEY = 'gm-family-progress';
const PROFILES_KEY = 'gm-family-profiles-v1';
const PROGRESS_PREFIX = 'gm-family-progress::';
const CHANGE_EVENT = 'gm-family-progress-change';
const PROFILE_EVENT = 'gm-family-profile-change';

const EMPTY: FamilyProgress = { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
const ADVENTURE_IDS = new Set(['knight', 'rook', 'bishop', 'pawn']);
const LESSON_IDS = new Set(['pieces', 'check', 'castling', 'values', 'centre']);
const PUZZLE_STAR_LIMITS: Record<string, number> = {
  fp01: 3, fp02: 3, fp03: 3, fp04: 2, fp05: 2,
  fp06: 2, fp07: 2, fp08: 2, fp09: 2, fp10: 3,
  fp11: 2, fp12: 2, fp13: 2, fp14: 3, fp15: 2,
  fp16: 3, fp17: 2, fp18: 2, fp19: 3, fp20: 3,
  fp21: 3, fp22: 2, fp23: 3, fp24: 2,
};

const PROFILE_EMOJIS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐝'];

export function normaliseFamilyProgress(value: unknown): FamilyProgress {
  if (!value || typeof value !== 'object') return { adventuresDone: [], lessonsDone: [], puzzleStars: {} };

  const candidate = value as Partial<FamilyProgress>;
  const adventuresDone = Array.isArray(candidate.adventuresDone)
    ? [...new Set(candidate.adventuresDone.filter((id): id is string => typeof id === 'string' && ADVENTURE_IDS.has(id)))]
    : [];
  const lessonsDone = Array.isArray(candidate.lessonsDone)
    ? [...new Set(candidate.lessonsDone.filter((id): id is string => typeof id === 'string' && LESSON_IDS.has(id)))]
    : [];
  const puzzleStars = candidate.puzzleStars && typeof candidate.puzzleStars === 'object'
    ? Object.fromEntries(
        Object.entries(candidate.puzzleStars)
          .filter(([id, stars]) => PUZZLE_STAR_LIMITS[id] && typeof stars === 'number' && Number.isFinite(stars))
          .map(([id, stars]) => [id, Math.max(0, Math.min(PUZZLE_STAR_LIMITS[id], Math.floor(stars)))]),
      )
    : {};

  return { adventuresDone, lessonsDone, puzzleStars };
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export type ProfilesState = { profiles: FamilyProfile[]; activeId: string };

const DEFAULT_PROFILE: FamilyProfile = { id: 'p1', name: 'Player 1', emoji: '🦁' };

function progressKey(profileId: string) {
  return `${PROGRESS_PREFIX}${profileId}`;
}

/** Loads (and on first run, seeds + migrates legacy progress into) the profiles store. */
export function loadProfiles(): ProfilesState {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfilesState>;
      const profiles = Array.isArray(parsed.profiles)
        ? parsed.profiles.filter((p): p is FamilyProfile => !!p && typeof p.id === 'string' && typeof p.name === 'string')
        : [];
      if (profiles.length) {
        const activeId = profiles.some((p) => p.id === parsed.activeId) ? (parsed.activeId as string) : profiles[0].id;
        return { profiles, activeId };
      }
    }
  } catch {
    // fall through to seeding
  }

  const state: ProfilesState = { profiles: [DEFAULT_PROFILE], activeId: DEFAULT_PROFILE.id };
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy && !window.localStorage.getItem(progressKey(DEFAULT_PROFILE.id))) {
      window.localStorage.setItem(progressKey(DEFAULT_PROFILE.id), legacy);
    }
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
  return state;
}

function saveProfiles(state: ProfilesState) {
  try { window.localStorage.setItem(PROFILES_KEY, JSON.stringify(state)); } catch {}
  queueMicrotask(() => window.dispatchEvent(new CustomEvent<ProfilesState>(PROFILE_EVENT, { detail: state })));
}

function load(profileId: string): FamilyProgress {
  try {
    const raw = window.localStorage.getItem(progressKey(profileId));
    if (raw) return normaliseFamilyProgress(JSON.parse(raw));
  } catch {}
  return { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
}

function publish(profileId: string, p: FamilyProgress) {
  try { window.localStorage.setItem(progressKey(profileId), JSON.stringify(p)); } catch {}
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { profileId, progress: p } }));
  });
}

/** Manage the list of local family profiles (switch / add / rename / remove). */
export function useFamilyProfiles() {
  const [state, setState] = useState<ProfilesState>({ profiles: [DEFAULT_PROFILE], activeId: DEFAULT_PROFILE.id });

  useEffect(() => {
    setState(loadProfiles());
    const sync = () => setState(loadProfiles());
    window.addEventListener(PROFILE_EVENT, sync);
    window.addEventListener('storage', (e) => { if (e.key === PROFILES_KEY) sync(); });
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync);
    };
  }, []);

  const switchProfile = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.profiles.some((p) => p.id === id) || prev.activeId === id) return prev;
      const next = { ...prev, activeId: id };
      saveProfiles(next);
      return next;
    });
  }, []);

  const addProfile = useCallback((name?: string) => {
    setState((prev) => {
      const id = `p${Date.now().toString(36)}`;
      const emoji = PROFILE_EMOJIS[prev.profiles.length % PROFILE_EMOJIS.length];
      const cleanName = (name ?? '').trim() || `Player ${prev.profiles.length + 1}`;
      const next = { profiles: [...prev.profiles, { id, name: cleanName.slice(0, 20), emoji }], activeId: id };
      saveProfiles(next);
      return next;
    });
  }, []);

  const renameProfile = useCallback((id: string, name: string) => {
    setState((prev) => {
      const cleanName = name.trim().slice(0, 20);
      if (!cleanName) return prev;
      const next = { ...prev, profiles: prev.profiles.map((p) => (p.id === id ? { ...p, name: cleanName } : p)) };
      saveProfiles(next);
      return next;
    });
  }, []);

  const removeProfile = useCallback((id: string) => {
    setState((prev) => {
      if (prev.profiles.length <= 1) return prev; // always keep one
      const profiles = prev.profiles.filter((p) => p.id !== id);
      const activeId = prev.activeId === id ? profiles[0].id : prev.activeId;
      try { window.localStorage.removeItem(progressKey(id)); } catch {}
      const next = { profiles, activeId };
      saveProfiles(next);
      return next;
    });
  }, []);

  const activeProfile = state.profiles.find((p) => p.id === state.activeId) ?? state.profiles[0];

  return { profiles: state.profiles, activeId: state.activeId, activeProfile, switchProfile, addProfile, renameProfile, removeProfile };
}

// ── Export / import (manual cross-device transfer, no accounts) ──────────────────

export function exportFamilyData(): string {
  const state = loadProfiles();
  const progress: Record<string, FamilyProgress> = {};
  for (const p of state.profiles) progress[p.id] = load(p.id);
  return JSON.stringify({ version: 1, profiles: state.profiles, progress }, null, 2);
}

export function importFamilyData(json: string): boolean {
  try {
    const data = JSON.parse(json) as { profiles?: unknown; progress?: Record<string, unknown> };
    if (!Array.isArray(data.profiles) || data.profiles.length === 0) return false;

    const profiles: FamilyProfile[] = data.profiles
      .filter((p): p is FamilyProfile => !!p && typeof (p as FamilyProfile).id === 'string' && typeof (p as FamilyProfile).name === 'string')
      .map((p, i) => ({
        id: p.id,
        name: String(p.name).slice(0, 20) || `Player ${i + 1}`,
        emoji: typeof p.emoji === 'string' && p.emoji ? p.emoji : PROFILE_EMOJIS[i % PROFILE_EMOJIS.length],
      }));
    if (profiles.length === 0) return false;

    for (const p of profiles) {
      const prog = normaliseFamilyProgress(data.progress?.[p.id]);
      try { window.localStorage.setItem(progressKey(p.id), JSON.stringify(prog)); } catch {}
    }
    saveProfiles({ profiles, activeId: profiles[0].id });
    return true;
  } catch {
    return false;
  }
}

// ── Per-profile progress ────────────────────────────────────────────────────────

export function useLocalProgress() {
  const [progress, setProgress] = useState<FamilyProgress>(() => ({ ...EMPTY }));
  const activeIdRef = useRef<string>(DEFAULT_PROFILE.id);

  useEffect(() => {
    const initial = loadProfiles();
    activeIdRef.current = initial.activeId;
    setProgress(load(initial.activeId));

    const onProfileChange = () => {
      const active = loadProfiles().activeId;
      activeIdRef.current = active;
      setProgress(load(active));
    };
    const onAppChange = (event: Event) => {
      const detail = (event as CustomEvent<{ profileId: string; progress: FamilyProgress }>).detail;
      if (detail && detail.profileId === activeIdRef.current) {
        setProgress(normaliseFamilyProgress(detail.progress));
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === progressKey(activeIdRef.current) || event.key === PROFILES_KEY) {
        setProgress(load(loadProfiles().activeId));
      }
    };

    window.addEventListener(PROFILE_EVENT, onProfileChange);
    window.addEventListener(CHANGE_EVENT, onAppChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PROFILE_EVENT, onProfileChange);
      window.removeEventListener(CHANGE_EVENT, onAppChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const markAdventureDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.adventuresDone.includes(id)) return prev;
      const next = { ...prev, adventuresDone: [...prev.adventuresDone, id] };
      publish(activeIdRef.current, next);
      return next;
    });
  }, []);

  const markLessonDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.lessonsDone.includes(id)) return prev;
      const next = { ...prev, lessonsDone: [...prev.lessonsDone, id] };
      publish(activeIdRef.current, next);
      return next;
    });
  }, []);

  const setPuzzleStars = useCallback((id: string, stars: number) => {
    setProgress(prev => {
      const existing = prev.puzzleStars[id] ?? 0;
      if (stars <= existing) return prev;
      const next = { ...prev, puzzleStars: { ...prev.puzzleStars, [id]: stars } };
      publish(activeIdRef.current, next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next: FamilyProgress = { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
    setProgress(next);
    try { window.localStorage.removeItem(progressKey(activeIdRef.current)); } catch {}
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { profileId: activeIdRef.current, progress: next } }));
    });
  }, []);

  return { progress, markAdventureDone, markLessonDone, setPuzzleStars, resetProgress };
}
