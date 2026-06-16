export type StoryChapter = {
  id: number;
  title: string;
  emoji: string;
  story: string;
  fen: string;
  instruction: string;
  solutionMove: { from: string; to: string };
  rewardEmoji: string;
  rewardName: string;
  stickerId: string;
};

export const chapters: StoryChapter[] = [
  {
    id: 1,
    title: 'The Stolen Crown',
    emoji: '👑',
    story:
      "The Shadow King has stolen the Fairy Queen's crown! The brave knight must jump over the castle wall to begin the rescue.",
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    instruction: 'Move the White Knight from g1 to f3.',
    solutionMove: { from: 'g1', to: 'f3' },
    rewardEmoji: '🌸',
    rewardName: 'Rose',
    stickerId: 'rose',
  },
  {
    id: 2,
    title: 'The Enchanted Forest',
    emoji: '🦋',
    story:
      'The path through the enchanted forest is blocked by shadow pawns! Open the way for the fairy bishop by pushing a pawn into the centre.',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    instruction: 'Move the pawn from e2 to e4 to light the bishop’s path.',
    solutionMove: { from: 'e2', to: 'e4' },
    rewardEmoji: '🦋',
    rewardName: 'Butterfly',
    stickerId: 'butterfly',
  },
  {
    id: 3,
    title: "The Shadow King's Castle",
    emoji: '🏰',
    story:
      'The Fairy Queen is inside the castle! One magical move will set her free forever. Give checkmate!',
    fen: '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
    instruction: 'Move the White Queen from e2 to e8 to give checkmate and free the Fairy Queen!',
    solutionMove: { from: 'e2', to: 'e8' },
    rewardEmoji: '👑',
    rewardName: 'Crown',
    stickerId: 'crown',
  },
];

export type StoryProgress = {
  chaptersComplete: number[];
  stickersEarned: string[];
};

const STORAGE_KEY = 'storyProgress';

export function loadStoryProgress(): StoryProgress {
  if (typeof window === 'undefined') return { chaptersComplete: [], stickersEarned: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { chaptersComplete: [], stickersEarned: [] };
    const parsed = JSON.parse(raw) as Partial<StoryProgress>;
    return {
      chaptersComplete: Array.isArray(parsed.chaptersComplete) ? parsed.chaptersComplete : [],
      stickersEarned: Array.isArray(parsed.stickersEarned) ? parsed.stickersEarned : [],
    };
  } catch {
    return { chaptersComplete: [], stickersEarned: [] };
  }
}

export function saveStoryProgress(progress: StoryProgress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage may be unavailable; the session still works.
  }
}

export function completeStoryChapter(progress: StoryProgress, chapterId: number): StoryProgress {
  const nextProgress = {
    ...progress,
    chaptersComplete: Array.from(new Set([...progress.chaptersComplete, chapterId])).sort((a, b) => a - b),
  };
  saveStoryProgress(nextProgress);
  return nextProgress;
}

export function awardSticker(progress: StoryProgress, stickerId: string): StoryProgress {
  const nextProgress = {
    ...progress,
    stickersEarned: Array.from(new Set([...progress.stickersEarned, stickerId])),
  };
  saveStoryProgress(nextProgress);
  try {
    const raw = window.localStorage.getItem('earnedStickers');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(stickerId)) {
      list.push(stickerId);
      window.localStorage.setItem('earnedStickers', JSON.stringify(list));
    }
  } catch {
    // Ignore.
  }
  return nextProgress;
}

export function isChapterUnlocked(chapterId: number, complete: number[]): boolean {
  if (chapterId === 1) return true;
  return complete.includes(chapterId - 1);
}
