'use client';

import { useCallback, useEffect, useState } from 'react';

export type FamilyProgress = {
  adventuresDone: string[];
  lessonsDone: string[];
  puzzleStars: Record<string, number>;
};

const KEY = 'gm-family-progress';
const EMPTY: FamilyProgress = { adventuresDone: [], lessonsDone: [], puzzleStars: {} };

function load(): FamilyProgress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  return EMPTY;
}

function save(p: FamilyProgress) {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function useLocalProgress() {
  const [progress, setProgress] = useState<FamilyProgress>(EMPTY);

  useEffect(() => { setProgress(load()); }, []);

  const markAdventureDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.adventuresDone.includes(id)) return prev;
      const next = { ...prev, adventuresDone: [...prev.adventuresDone, id] };
      save(next);
      return next;
    });
  }, []);

  const markLessonDone = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.lessonsDone.includes(id)) return prev;
      const next = { ...prev, lessonsDone: [...prev.lessonsDone, id] };
      save(next);
      return next;
    });
  }, []);

  const setPuzzleStars = useCallback((id: string, stars: number) => {
    setProgress(prev => {
      const existing = prev.puzzleStars[id] ?? 0;
      if (stars <= existing) return prev;
      const next = { ...prev, puzzleStars: { ...prev.puzzleStars, [id]: stars } };
      save(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next = EMPTY;
    setProgress(next);
    try { window.localStorage.removeItem(KEY); } catch {}
  }, []);

  return { progress, markAdventureDone, markLessonDone, setPuzzleStars, resetProgress };
}
