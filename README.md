# Post-game AI review (feature branch)

This feature adds a simple post-game coaching UI and server-side Next.js API routes that call Groq. It is implemented as a separate feature branch and is intended to be kept isolated from the Stockfish QA work until Codex finishes.

Environment variables (see `.env.example`):

- `GROQ_API_KEYS` — comma-separated Groq API key(s). The server will try keys in order and rotate if one returns 401/429.
- `GROQ_MODEL` — the Groq model to call.

Files added (high level):

- `components/PostGameReview.tsx` — client component that requests a short review and optionally a move-by-move review.
- `components/GameReviewChat.tsx` — a small chat UI to ask follow-up questions.
- `lib/gameReviewPrompts.ts` — builds the system and user prompt for Groq.
- `lib/gameReviewTypes.ts` — TypeScript types for the feature.
- `app/api/game-review/route.ts` — server API route that returns a concise review.
- `app/api/game-review-chat/route.ts` — server API route that answers chat questions.
- `.env.example` — example env file.

Usage notes:

- The client components call the local Next.js API routes; API keys must be configured server-side only.
- The UI intentionally avoids exposing raw FEN/PGN to beginners; internal prompts use move lists but the UI shows friendly text.

Testing:

1. Set `GROQ_API_KEYS` and `GROQ_MODEL` in your deployment or local `.env`.
2. Run the app and finish a game. Click "Review my game" near your game-over banner.
# Grandmaster Path Alpha

A first playable slice of a Chess.com-style training platform designed to take a learner from complete beginner toward serious chess strength.

This is **not yet a full grandmaster engine platform**. It is an alpha foundation that can run locally, push to GitHub, and deploy to Vercel.

## What is included now

- Next.js + TypeScript + Tailwind app
- Play room: human as White vs adjustable Stockfish training levels
- Puzzle room: tactical and principle-based training positions
- Learn room: short lessons based on peak-Elo player research
- Watch room: model-game study cards for Carlsen, Kasparov, Caruana, Aronian and So
- Roadmap: beginner-to-master training bands
- Local progress: daily goal and streak saved in browser local storage
- Legal move validation with `chess.js`
- Browser Web Worker Stockfish engine with a lightweight Alpha Bot fallback
- Human promotion choice for Queen, Rook, Bishop, or Knight

## Important alpha limitation

The computer opponent uses the lite single-threaded Stockfish browser engine. Its displayed levels are practice targets, not measured bot ratings. If the worker cannot load, the app falls back to the lightweight local trainer.

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
components/
  ChessBoard.tsx
  LearnPath.tsx
  PlayTrainer.tsx
  PuzzleTrainer.tsx
  Roadmap.tsx
  WatchRoom.tsx
lib/
  engine.ts
  stockfishClient.ts
  trainingData.ts
  types.ts
public/
  stockfish/
```
