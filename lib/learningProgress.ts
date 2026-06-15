export type LearningProgress = {
  lessonsDone: string[];
  puzzleAttempts: Record<string, { attempts: number; solved: number; lastAttemptIso: string }>;
};

const KEY = 'gmp.learningProgress.v1';
const EMPTY: LearningProgress = { lessonsDone: [], puzzleAttempts: {} };

export function normaliseLearningProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== 'object') return { ...EMPTY };
  const candidate = value as Partial<LearningProgress>;
  return {
    lessonsDone: Array.isArray(candidate.lessonsDone) ? [...new Set(candidate.lessonsDone.filter((id): id is string => typeof id === 'string'))] : [],
    puzzleAttempts: candidate.puzzleAttempts && typeof candidate.puzzleAttempts === 'object' ? candidate.puzzleAttempts : {},
  };
}

export function loadLearningProgress(): LearningProgress {
  try { return normaliseLearningProgress(JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { return { ...EMPTY }; }
}

export function saveLearningProgress(progress: LearningProgress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent('gmp-learning-progress-change', { detail: progress }));
}
