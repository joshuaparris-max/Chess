# Puzzle Sources

All puzzles in this project are original to Grandmaster Path Alpha. The family puzzles are hand-composed;
the adult puzzles are generated and verified by `scripts/generate-adult-puzzles.mjs`.

## Adult Puzzles (`lib/puzzles/adultPuzzles.ts`)

117 puzzles across five difficulty levels:

| Level | Count | Player moves | Focus |
|---|---|---|---|
| Intro | 24 | 1 | Mate in 1, hanging pieces, promotion |
| Beginner | 28 | 1–2 | Rook mates, hanging minor pieces, knight forks, promotion with capture |
| Intermediate | 27 | 1–2 | Knight/queen forks, skewers, queen mates |
| Advanced | 24 | 1–3 | Forced mate in two, skewers winning the queen |
| Expert | 14 | 3 | Forced mate in two, queen mating nets |

Titles and three-level hints are derived per puzzle from the actual move line (SAN), so no two
read alike. Mate and capture positions are also "decorated" with extra pawns — added and then
re-verified — so the boards look game-like rather than bare king-and-piece studies.

**Source:** `source: 'generated'`. Positions are produced by `scripts/generate-adult-puzzles.mjs`,
which uses chess.js to construct positions and confirm the tactical property by construction:
checkmates are verified with `isCheckmate()`, free captures are confirmed to be undefended,
forks/skewers are confirmed to win the target against every legal reply, and forced mates in two
require the in-between reply to be the opponent's only legal move. **The file is auto-generated —
regenerate it with the script rather than hand-editing.** Every FEN and solution line is replayed
through chess.js before the file is written, and again by `npm run validate:puzzles`.

These positions are composed for teaching; they are not taken from over-the-board games or external
puzzle databases.

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

## Regenerating / Adding Adult Puzzles

The adult puzzle file is auto-generated. To change counts, tactic mix, or templates:

1. Edit the generators or band assembly in `scripts/generate-adult-puzzles.mjs`
2. Run `node scripts/generate-adult-puzzles.mjs` to rewrite `lib/puzzles/adultPuzzles.ts`
3. Run `npm run validate:puzzles` to confirm every line is legal
4. Run `npm run lint` and `npm run build` before committing

To add a hand-composed family puzzle, edit `lib/familyPuzzles.ts` (and extend
`PUZZLE_STAR_LIMITS` in `lib/familyProgress.ts`); family puzzles are not auto-generated.
