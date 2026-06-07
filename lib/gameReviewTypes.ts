export type GameResult = 'win' | 'loss' | 'draw' | 'stalemate' | 'resignation' | 'checkmate';

export interface GameData {
  playerColor: 'white' | 'black';
  botColor?: 'white' | 'black';
  result: GameResult;
  moves: string[]; // SAN or simple move list for internal use
  finalFEN?: string;
  finalMove?: string;
  isCheckmate?: boolean;
  winner?: 'white' | 'black' | null;
  sideToMoveAfterGame?: 'white' | 'black';
  moveCount: number;
  botLevel?: number;
  endBy?: string; // e.g. 'checkmate', 'resignation'
}

export interface ReviewRequest {
  gameData: GameData;
  detail?: boolean;
}

export interface ReviewResponse {
  summary?: string;
  detail?: string;
}

export interface ChatRequest {
  gameData: GameData;
  summary?: string;
  question: string;
}

export interface ChatResponse {
  answer: string;
}
