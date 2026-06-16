import { Chess } from 'chess.js';

export const ENDGAME_DRILL_PROGRESS_KEY = 'gm-endgame-drills-progress-v1';

export type EndgameDrill = {
  id: string;
  title: string;
  theme: string;
  level: 'beginner' | 'developing' | 'practice';
  fen: string;
  goal: string;
  teachingPoint: string;
  successText: string;
  solution: string[];
};

export type EndgameDrillProgress = {
  completedIds: string[];
  attemptsById: Record<string, number>;
};

export type EndgameMoveResult =
  | { status: 'correct'; fen: string; completed: boolean; nextPly: number; san: string }
  | { status: 'incorrect'; reason: string }
  | { status: 'illegal'; reason: string };

export const endgameDrills: EndgameDrill[] = [
  {
    id: 'king-box',
    title: 'Box the king',
    theme: 'Queen and king mate',
    level: 'beginner',
    fen: '8/8/8/8/7k/8/6Q1/6K1 w - - 0 1',
    goal: 'Use the queen to gently reduce the black king\'s space.',
    teachingPoint: 'In queen endings, keep your queen a knight move away from the king so it controls escape squares without being captured.',
    successText: 'Great box. The queen took away the king\'s room without stepping too close.',
    solution: ['g2b7'],
  },
  {
    id: 'rook-ladder',
    title: 'Build the ladder',
    theme: 'Rook mate pattern',
    level: 'beginner',
    fen: '8/8/8/8/8/5k2/6R1/6K1 w - - 0 1',
    goal: 'Check from the side and start pushing the king toward the edge.',
    teachingPoint: 'Rooks win by cutting the king off rank by rank or file by file. Give checks from a safe distance.',
    successText: 'That rook check starts the ladder. The king has fewer files to run to now.',
    solution: ['g2f2'],
  },
  {
    id: 'outside-passer',
    title: 'Create the runner',
    theme: 'Pawn breakthrough',
    level: 'developing',
    fen: '8/8/4k3/8/1pP5/1P6/P7/4K3 w - - 0 1',
    goal: 'Find the pawn break that creates a passed pawn.',
    teachingPoint: 'When pawns face each other, a sacrifice can clear the road for the pawn behind it.',
    successText: 'Nice breakthrough. That sacrifice turns the queenside pawns into a real runner.',
    solution: ['a2a4'],
  },
  {
    id: 'opposition',
    title: 'Take the opposition',
    theme: 'King and pawn ending',
    level: 'practice',
    fen: '8/8/8/4k3/8/4K3/4P3/8 w - - 0 1',
    goal: 'Move your king so the enemy king has to give ground.',
    teachingPoint: 'Opposition means putting the kings face to face with one square between them, forcing the other king to step aside.',
    successText: 'You took the opposition. That is the key idea in many king-and-pawn endings.',
    solution: ['e3d3'],
  },
];

export const emptyEndgameProgress: EndgameDrillProgress = {
  completedIds: [],
  attemptsById: {},
};

export function normaliseEndgameProgress(value: unknown): EndgameDrillProgress {
  const raw = (value ?? {}) as Partial<EndgameDrillProgress>;
  const completedIds = Array.isArray(raw.completedIds)
    ? raw.completedIds.filter((id): id is string => typeof id === 'string')
    : [];
  const attemptsById: Record<string, number> = {};

  if (raw.attemptsById && typeof raw.attemptsById === 'object') {
    Object.entries(raw.attemptsById).forEach(([id, attempts]) => {
      const count = Number(attempts);
      attemptsById[id] = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    });
  }

  return {
    completedIds: Array.from(new Set(completedIds)),
    attemptsById,
  };
}

export function recordEndgameAttempt(
  progress: EndgameDrillProgress,
  drillId: string,
  completed: boolean,
): EndgameDrillProgress {
  return {
    completedIds: completed
      ? Array.from(new Set([...progress.completedIds, drillId]))
      : progress.completedIds,
    attemptsById: {
      ...progress.attemptsById,
      [drillId]: (progress.attemptsById[drillId] ?? 0) + 1,
    },
  };
}

export function tryEndgameMove(drill: EndgameDrill, fen: string, ply: number, from: string, to: string): EndgameMoveResult {
  const expected = drill.solution[ply];
  if (!expected) return { status: 'incorrect', reason: 'This drill is already complete.' };

  const game = new Chess(fen);
  let move;
  try {
    move = game.move({ from, to, promotion: expected.length > 4 ? expected[4] : undefined });
  } catch {
    move = null;
  }

  if (!move) {
    return { status: 'illegal', reason: 'That move is not legal in this position.' };
  }

  const uci = `${move.from}${move.to}${move.promotion ?? ''}`;
  if (uci !== expected) {
    return {
      status: 'incorrect',
      reason: 'That is legal, but it misses the endgame idea for this drill.',
    };
  }

  const nextPly = ply + 1;
  return {
    status: 'correct',
    fen: game.fen(),
    completed: nextPly >= drill.solution.length,
    nextPly,
    san: move.san,
  };
}
