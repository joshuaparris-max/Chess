'use client';

import { useCallback, useEffect, useState } from 'react';

export type FamilyProgress = {
  adventuresDone: string[];
  lessonsDone: string[];
  puzzleStars: Record<string, number>;
};

const KEY = 'gm-family-progress';
const CHANGE_EVENT = 'gm-family-progress-change';
const EMPTY: FamilyProgress = { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
const ADVENTURE_IDS = new Set(['knight', 'rook', 'bishop', 'pawn']);
const LESSON_IDS = new Set(['pieces', 'check', 'castling', 'values', 'centre']);
const PUZZLE_STAR_LIMITS: Record<string, number> = {
  fp01: 3,
  fp02: 3,
  fp03: 3,
  fp04: 2,
  fp05: 2,
  fp06: 2,
  fp07: 2,
  fp08: 2,
  fp09: 2,
  fp10: 3,
};

function normalise(value: unknown): FamilyProgress {
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

function load(): FamilyProgress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return normalise(JSON.parse(raw));
  } catch {}
  return { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
}

function publish(p: FamilyProgress) {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent<FamilyProgress>(CHANGE_EVENT, { detail: p }));
  });
}

export function useLocalProgress() {
  const [progress, setProgress] = useState<FamilyProgress>(() => ({ ...EMPTY }));

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === KEY) setProgress(load());
    };
    const syncFromApp = (event: Event) => {
      setProgress(normalise((event as CustomEvent<FamilyProgress>).detail));
    };

    setProgress(load());
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(CHANGE_EVENT, syncFromApp);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(CHANGE_EVENT, syncFromApp);
    };
  }, []);

  const markAdventureDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.adventuresDone.includes(id)) return prev;
      const next = { ...prev, adventuresDone: [...prev.adventuresDone, id] };
      publish(next);
      return next;
    });
  }, []);

  const markLessonDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.lessonsDone.includes(id)) return prev;
      const next = { ...prev, lessonsDone: [...prev.lessonsDone, id] };
      publish(next);
      return next;
    });
  }, []);

  const setPuzzleStars = useCallback((id: string, stars: number) => {
    setProgress(prev => {
      const existing = prev.puzzleStars[id] ?? 0;
      if (stars <= existing) return prev;
      const next = { ...prev, puzzleStars: { ...prev.puzzleStars, [id]: stars } };
      publish(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next: FamilyProgress = { adventuresDone: [], lessonsDone: [], puzzleStars: {} };
    setProgress(next);
    try { window.localStorage.removeItem(KEY); } catch {}
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent<FamilyProgress>(CHANGE_EVENT, { detail: next }));
    });
  }, []);

  return { progress, markAdventureDone, markLessonDone, setPuzzleStars, resetProgress };
}
