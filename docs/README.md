# Grandmaster Path Alpha

A first playable slice of a Chess.com-style training platform designed to take a learner from complete beginner toward serious chess strength.

This is **not yet a full grandmaster engine platform**. It is an alpha foundation that can run locally, push to GitHub, and deploy to Vercel.

## What is included now

- Next.js + TypeScript + Tailwind app
- Play room: human as White or Black vs Stockfish-powered bot levels, with a lightweight Alpha Bot fallback, board flip, selectable piece sets, and local time controls (untimed, 10+0, 5+0)
- Puzzle room: 120 original adult tactics puzzles across five difficulty bands, with themes/phase tags, multi-move sequences and opponent auto-reply, black-to-move board flip, three-level hints, a difficulty filter, and local attempt/solved tracking
- Learn room: short lessons based on peak-Elo player research, with completion tracking
- Watch room: interactive PGN/model-game boards for Carlsen, Kasparov, Caruana, Aronian and So
- Roadmap: beginner-to-master training bands
- Family mode: pass-and-play, four adventures, 24 child-friendly puzzles, lessons, progress, read-aloud, and celebrations
- Post-game AI review and chat grounded in `chess.js` facts, with local caching
- Local progress: daily goal and streak, 20-game archive, PGN import/export, all saved in browser local storage
- Optional Supabase email accounts and explicit cloud snapshot upload/restore with row-level security
- Legal move validation with `chess.js`

## Important alpha limitation

Bot levels are powered by Stockfish (Web Worker) with a lightweight alpha-beta fallback if the
engine fails to load. Displayed Elo bands are practice targets, not measured bot ratings, and have
not yet been calibrated through real beginner testing.

## Run locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Build check

```bash
npm run build
npm start
```

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial alpha: Grandmaster Path chess training app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grandmaster-path-alpha.git
git push -u origin main
```

## Deploy to Vercel

1. Go to Vercel.
2. Add New Project.
3. Import the GitHub repo.
4. Keep the defaults.
5. Deploy.

## Suggested next slices

### Slice 2 — Real Stockfish

- Add a `public/stockfish/` folder or install a maintained Stockfish WASM package.
- Run the engine inside a Web Worker.
- Add UCI commands:
  - `uci`
  - `isready`
  - `ucinewgame`
  - `setoption name Skill Level value X`
  - `position fen ...`
  - `go depth ...` or `go movetime ...`
- Keep the existing bot-level UI but map each level to Stockfish skill, depth, and move time.

### Slice 3 — Accounts and saved progress

- Add NextAuth/Auth.js.
- Add Vercel Postgres or Supabase.
- Save games, puzzle attempts, streaks, and lesson completion.

### Slice 4 — Real puzzle database

- Add puzzle tags: fork, pin, skewer, mate, endgame, defence, conversion.
- Add spaced repetition.
- Add puzzle rating and puzzle history.

### Slice 5 — PGN study room

- Add PGN import.
- Add move-by-move annotated boards.
- Add model games for the five peak-Elo players.

### Slice 6 — Coach reports

- Analyse games by missed tactics, hanging pieces, opening neglect, endgame errors, time-use habits, and resilience.
- Produce a weekly training plan.

## Research ideas built into the app

The training model uses these findings from the peak-Elo report:

- Pattern recognition matters early and constantly.
- Calculation under pressure separates serious players from casual players.
- Practical resilience matters because high Elo is partly low loss rate.
- Endgame conversion should be taught early, not left until advanced levels.
- Different elite styles can all work: Carlsen pressure, Kasparov preparation, Caruana calculation, Aronian creativity, So solidity.

## Project structure

```txt
app/
  globals.css
  layout.tsx
  page.tsx
  [room]/            route-based pages: play, puzzles, learn, watch, roadmap, family
  api/               game-review and review-chat routes
components/
  ChessBoard.tsx
  PlayTrainer.tsx
  PuzzleTrainer.tsx     multi-move adult tactics trainer
  LearnPath.tsx
  Roadmap.tsx
  WatchRoom.tsx
  FamilyHub.tsx
  family/              family play, adventures, puzzles, lessons, progress
lib/
  engine.ts
  trainingData.ts
  types.ts
  puzzles/             adult puzzle data + types
  familyPuzzles.ts     family puzzle data
  familyProgress.ts    family localStorage progress
  learningProgress.ts  adult lesson/puzzle progress
scripts/
  validate-puzzles.mjs  chess.js validation for adult puzzles
docs/
  ROADMAP.md, PRODUCT_BACKLOG.md, TECHNICAL_DEBT.md, PUZZLE_SOURCES.md, ...
```
