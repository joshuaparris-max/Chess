export type PuzzleDifficulty = 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PuzzleTheme =
  | 'mateIn1' | 'mateIn2' | 'mateIn3' | 'backRankMate'
  | 'fork' | 'pin' | 'skewer' | 'discoveredAttack'
  | 'hangingPiece' | 'deflection' | 'interference'
  | 'sacrifice' | 'promotion' | 'endgame' | 'opening';

export type PuzzlePhase = 'opening' | 'middlegame' | 'endgame';

export type AdultPuzzle = {
  id: string;
  title: string;
  difficulty: PuzzleDifficulty;
  themes: PuzzleTheme[];
  phase: PuzzlePhase;
  fen: string;
  sideToMove: 'w' | 'b';
  // All moves in UCI: player, opponent-reply, player, ... (even index = player, odd = opponent)
  solution: string[];
  hints: { gentle: string; directional: string; reveal: string };
  teachingPoint: string;
  source: string;
};
