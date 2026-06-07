export type AppMode = 'play' | 'puzzles' | 'learn' | 'watch' | 'roadmap';

export type BotLevel = {
  id: string;
  label: string;
  elo: number;
  style: string;
  depth: number;
  noise: number;
  blunderChance: number;
  description: string;
};

export type Lesson = {
  id: string;
  title: string;
  pillar: string;
  level: string;
  minutes: number;
  summary: string;
  whyItMatters: string;
  drill: string[];
  playerLink: string;
};

export type Puzzle = {
  id: string;
  title: string;
  motif: string;
  level: string;
  fen: string;
  sideToMove: 'w' | 'b';
  solution: string[];
  hint: string;
  teachingPoint: string;
};

export type WatchCard = {
  id: string;
  player: string;
  title: string;
  idea: string;
  positionLesson: string;
  trainingTakeaway: string;
};

export type RoadmapStage = {
  band: string;
  title: string;
  focus: string;
  unlocks: string[];
  habits: string[];
};
