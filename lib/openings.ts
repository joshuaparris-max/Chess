export const OPENINGS = [
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], name: 'Italian Game', idea: 'Develop quickly and prepare to castle.' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], name: 'Ruy Lopez', idea: 'Pressure the knight that protects the centre.' },
  { moves: ['e4', 'c5'], name: 'Sicilian Defence', idea: 'Black fights for the centre from the side.' },
  { moves: ['e4', 'e6'], name: 'French Defence', idea: 'Black prepares a strong pawn challenge with d5.' },
  { moves: ['d4', 'd5', 'c4'], name: "Queen's Gambit", idea: 'White offers a flank pawn to gain central influence.' },
  { moves: ['d4', 'Nf6', 'c4', 'g6'], name: "King's Indian Defence", idea: 'Black lets White build a centre, then attacks it.' },
];

export function recogniseOpening(history: string[]) {
  const matches = OPENINGS.filter((opening) => opening.moves.every((move, index) => history[index] === move));
  return matches.sort((a, b) => b.moves.length - a.moves.length)[0] ?? null;
}
