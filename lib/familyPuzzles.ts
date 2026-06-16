import type { Square } from 'chess.js';

export interface FamilyPuzzle {
  id: string;
  label: string;
  theme: string;
  fen: string;
  from: Square;
  to: Square;
  hint: string;
  celebrate: string;
  maxStars: 1 | 2 | 3;
  isPromotion?: true;
}

export const FAMILY_PUZZLES: FamilyPuzzle[] = [
  {
    id: 'fp01', label: "Queen's Finish", theme: 'Checkmate', maxStars: 3,
    fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1',
    from: 'f5', to: 'f8',
    hint: 'Slide the queen all the way up the f-file to the last row!',
    celebrate: "Checkmate! The queen slid to f8 and the black king had nowhere to run.",
  },
  {
    id: 'fp02', label: "Rook's Finish", theme: 'Checkmate', maxStars: 3,
    fen: '7k/8/4B3/8/8/3B4/8/K5R1 w - - 0 1',
    from: 'g1', to: 'g8',
    hint: 'Zoom the rook straight up the g-file!',
    celebrate: "Checkmate! The rook zoomed all the way up and trapped the king.",
  },
  {
    id: 'fp03', label: "Pawn's Checkmate", theme: 'Promotion + Mate', maxStars: 3,
    fen: 'k7/2P5/1K6/8/8/8/8/8 w - - 0 1',
    from: 'c7', to: 'c8',
    hint: 'March the pawn one step forward to c8 — it becomes a queen AND gives checkmate!',
    celebrate: "Amazing! The pawn promoted to a queen on c8 — instant checkmate!",
    isPromotion: true,
  },
  {
    id: 'fp04', label: 'Win the Rook', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/3Q3r/8/8/8/K7 w - - 0 1',
    from: 'd5', to: 'h5',
    hint: 'The queen can slide all the way along row 5 to reach the rook!',
    celebrate: "Got it! The queen slid right across the rank and took the rook for free.",
  },
  {
    id: 'fp05', label: 'Win the Queen', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/8/4q3/8/8/K3R3 w - - 0 1',
    from: 'e1', to: 'e4',
    hint: 'The rook and the black queen share the same column — slide up and take it!',
    celebrate: "The rook captured the queen. The queen was sitting on the same file with nothing to protect it!",
  },
  {
    id: 'fp06', label: 'Win the Bishop', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/3Q1b2/8/8/8/K7 w - - 0 1',
    from: 'd5', to: 'f5',
    hint: 'Slide the queen two squares to the right along row 5!',
    celebrate: "The queen slid right over to f5 and took the bishop. Always look for undefended pieces!",
  },
  {
    id: 'fp07', label: 'Win the Knight', theme: 'Free Capture', maxStars: 2,
    fen: '7k/8/8/Q2n4/8/8/8/K7 w - - 0 1',
    from: 'a5', to: 'd5',
    hint: 'The queen and knight are on the same row — slide across and take it!',
    celebrate: "The queen captured the knight. The knight had no protection!",
  },
  {
    id: 'fp08', label: 'Pawn Becomes a Queen', theme: 'Promotion', maxStars: 2,
    fen: '7k/1P6/8/8/8/8/8/K7 w - - 0 1',
    from: 'b7', to: 'b8',
    hint: 'One step forward and the pawn reaches the last row — it can become a queen!',
    celebrate: "The pawn marched all the way to b8 and became a queen! Any pawn can do this.",
    isPromotion: true,
  },
  {
    id: 'fp09', label: 'Rook Hunts the Bishop', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/2R3b1/8/8/8/8/K7 w - - 0 1',
    from: 'c6', to: 'g6',
    hint: 'Slide the rook along row 6 all the way to the bishop!',
    celebrate: "The rook slid along rank 6 and captured the bishop. The bishop had nowhere to hide!",
  },
  {
    id: 'fp10', label: 'Pawn Takes the Rook', theme: 'Pawn Capture', maxStars: 3,
    fen: 'k7/8/8/3r4/4P3/8/8/K7 w - - 0 1',
    from: 'e4', to: 'd5',
    hint: 'Pawns capture diagonally — one step forward and to the side. The rook is right there!',
    celebrate: "The pawn captured the rook diagonally! Pawns are sneaky — they capture on the diagonal.",
  },

  // ── New puzzles fp11–fp24 ─────────────────────────────────────────────────

  {
    id: 'fp11', label: 'Bishop Hunts the Rook', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/8/8/5r2/8/8/K1B5 w - - 0 1',
    from: 'c1', to: 'f4',
    hint: 'Slide the bishop along its diagonal — it can reach the rook in one move!',
    celebrate: "The bishop slid along the diagonal all the way to f4 and took the rook for free!",
  },
  {
    id: 'fp12', label: 'Queen Captures the Rook', theme: 'Free Capture', maxStars: 2,
    fen: '7k/3r4/8/8/8/8/8/3QK3 w - - 0 1',
    from: 'd1', to: 'd7',
    hint: 'The queen and the black rook share the d-column — slide all the way up!',
    celebrate: "The queen zoomed up the d-file and captured the rook. Well spotted!",
  },
  {
    id: 'fp13', label: 'Pawn Takes the Bishop', theme: 'Pawn Capture', maxStars: 2,
    fen: '7k/8/8/3b4/4P3/8/8/7K w - - 0 1',
    from: 'e4', to: 'd5',
    hint: 'The pawn captures diagonally — one step forward and to the left lands on the bishop!',
    celebrate: "The pawn captured the bishop diagonally! Pawns are small but sneaky.",
  },
  {
    id: 'fp14', label: 'Rook Captures the Queen!', theme: 'Free Capture', maxStars: 3,
    fen: '7k/3q4/8/8/8/8/8/3RK3 w - - 0 1',
    from: 'd1', to: 'd7',
    hint: 'The rook and the black queen share the d-column — slide all the way up and take the queen!',
    celebrate: "Amazing! The rook captured the queen — that is the best piece capture possible!",
  },
  {
    id: 'fp15', label: 'Pawn Races to the Top', theme: 'Promotion', maxStars: 2,
    fen: '7k/1P6/8/8/8/8/8/7K w - - 0 1',
    from: 'b7', to: 'b8',
    hint: 'One more step and the pawn reaches the last row. It becomes a queen!',
    celebrate: "The pawn reached the top and became a brand new queen! Pawns can always do this.",
    isPromotion: true,
  },
  {
    id: 'fp16', label: 'Rook Sweeps to Checkmate', theme: 'Checkmate', maxStars: 3,
    fen: '1k6/8/1K6/8/8/8/8/R7 w - - 0 1',
    from: 'a1', to: 'a8',
    hint: 'Slide the rook all the way up the a-file to the last row — the king is trapped!',
    celebrate: "Checkmate! The rook on a8 covered the whole back rank and the white king covered every escape!",
  },
  {
    id: 'fp17', label: 'Bishop Takes the Knight', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/8/8/6B1/5n2/8/K7 w - - 0 1',
    from: 'g4', to: 'f3',
    hint: 'The bishop is one diagonal step away from the knight — take it!',
    celebrate: "The bishop stepped diagonally to f3 and captured the knight. The knight was unprotected!",
  },
  {
    id: 'fp18', label: 'Bishop Wins the Rook', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/8/8/8/8/3r4/K3B3 w - - 0 1',
    from: 'e1', to: 'd2',
    hint: 'The bishop is right next to the rook diagonally — step over and take it!',
    celebrate: "The bishop captured the rook on d2. One diagonal step and a free rook!",
  },
  {
    id: 'fp19', label: 'Queen Sweeps to Checkmate', theme: 'Checkmate', maxStars: 3,
    fen: '1k6/8/1K6/8/8/8/8/3Q4 w - - 0 1',
    from: 'd1', to: 'd8',
    hint: 'Slide the queen all the way up the d-file to d8. The king is completely trapped!',
    celebrate: "Checkmate! The queen on d8 covered the whole back rank and the white king stopped every escape!",
  },
  {
    id: 'fp20', label: 'Queen Crashes Through!', theme: 'Checkmate', maxStars: 3,
    fen: '6k1/5ppp/8/8/8/8/8/K5Q1 w - - 0 1',
    from: 'g1', to: 'g7',
    hint: 'Move the queen to g7 — the black king\'s own pawns will trap it in!',
    celebrate: "Checkmate! The queen crashed into g7 and the king had no escape — its own pawns blocked it!",
  },
  {
    id: 'fp21', label: 'Rook Captures the Queen', theme: 'Free Capture', maxStars: 3,
    fen: '6k1/8/8/q6R/8/8/8/6K1 w - - 0 1',
    from: 'h5', to: 'a5',
    hint: 'The rook and the queen share the same row — slide all the way across and take the queen!',
    celebrate: "Incredible! The rook slid across the whole rank and captured the queen for free. Huge win!",
  },
  {
    id: 'fp22', label: 'Knight Catches the Bishop', theme: 'Free Capture', maxStars: 2,
    fen: 'k7/8/2b5/8/3N4/8/8/K7 w - - 0 1',
    from: 'd4', to: 'c6',
    hint: 'Knights jump in an L-shape. Jump from d4 to c6 — that is where the bishop is sitting!',
    celebrate: "The knight leapt to c6 and captured the bishop! Knights jump over everything in their L-shape.",
  },
  {
    id: 'fp23', label: 'Rook Delivers Checkmate', theme: 'Checkmate', maxStars: 3,
    fen: '7k/5ppp/5K2/8/8/8/8/6R1 w - - 0 1',
    from: 'g1', to: 'g7',
    hint: 'Slide the rook up the g-file and capture the pawn next to the king!',
    celebrate: "Checkmate! The rook on g7 gave check, the pawns blocked every escape, and the white king protected the rook.",
  },
  {
    id: 'fp24', label: 'Pawn Takes the Knight', theme: 'Pawn Capture', maxStars: 2,
    fen: '7k/8/8/3n4/4P3/8/8/7K w - - 0 1',
    from: 'e4', to: 'd5',
    hint: 'Pawns capture diagonally — step forward and to the left to take the knight!',
    celebrate: "The pawn captured the knight diagonally! Even small pawns can take powerful pieces.",
  },
];
