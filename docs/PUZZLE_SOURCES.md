# Puzzle Sources

All puzzles in this project are original compositions created specifically for Grandmaster Path Alpha.

## Adult Puzzles (`lib/puzzles/adultPuzzles.ts`)

120 puzzles across five difficulty levels:

| Level | Count | Player moves | Focus |
|---|---|---|---|
| Intro | 24 | 1 | Mate in 1, hanging pieces, basic forks |
| Beginner | 28 | 1–2 | 2-move combinations, basic tactics |
| Intermediate | 28 | 2–3 | Multi-step sequences, positional themes |
| Advanced | 24 | 2–4 | Sacrifices, complex coordinates |
| Expert | 16 | 3–5 | Deep combinations, endgame technique |

**Source:** All positions are original compositions (`source: 'original'`). FEN positions were designed
to illustrate specific tactical or strategic concepts cleanly, without extraneous material.
They are not taken from over-the-board games or existing puzzle databases.

**Solution format:** The `solution` array interleaves player and opponent moves:
- Even indices (0, 2, 4…) = player's moves
- Odd indices (1, 3, 5…) = opponent's forced replies

Example: `['c4e5', 'g6h6', 'e5d7']` means player plays Ne5+, opponent replies King h6, player plays Nxd7.

## Family Puzzles (`lib/familyPuzzles.ts`)

24 child-friendly puzzles for family play (ages 4+):

| Range | Theme |
|---|---|
| fp01–fp03 | Checkmate finishes |
| fp04–fp07 | Free piece captures |
| fp08, fp15 | Pawn promotion |
| fp09–fp13, fp17–fp18, fp21–fp22, fp24 | Various captures |
| fp14 | Win the queen |
| fp16, fp19–fp20, fp23 | Checkmate patterns |

**Source:** All positions are original compositions. All FENs include both kings (required by chess.js).
No ratings, no pressure, encouraging language throughout. Designed for joint parent-child play.

## Validation

Run `npm run validate:puzzles` to verify all adult puzzle FENs and solution moves are
legal according to chess.js. This catches:
- Invalid FEN strings
- Illegal moves in solution sequences
- Duplicate puzzle IDs
- Side-to-move mismatches

## Adding New Puzzles

1. Add to `lib/puzzles/adultPuzzles.ts` following the `AdultPuzzle` type in `lib/puzzles/types.ts`
2. Assign a unique ID following the pattern: `i25`, `b29`, `m29`, `a25`, `e17`, etc.
3. Run `npm run validate:puzzles` to verify
4. Run `npm run lint` and `npm run build` before committing
