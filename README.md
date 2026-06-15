# Grandmaster Path

Grandmaster Path is a beginner-first chess training app built with Next.js, TypeScript, Tailwind, `chess.js`, browser Stockfish, and an optional Groq-powered post-game coach.

## Current Features

- Play as White or Black against neutral practice-level bots
- Untimed, 10-minute, and 5-minute games
- Board flip, legal-move highlighting, promotion choice, hints, and local pass-and-play
- Browser Stockfish with a lightweight local fallback
- Local archive for the latest 20 completed games
- PGN import and export
- Opening recognition for a curated set of common openings
- Adult puzzles with local attempt history
- Lessons with local completion tracking
- Interactive model-game viewers
- Post-game review, key moments, and follow-up chat
- Dedicated Family Chess area with shared play, four adventures, puzzles, lessons, read-aloud support, celebrations, and local progress
- Persistent adult and bright family themes
- Route-based rooms: `/play`, `/puzzles`, `/learn`, `/watch`, `/roadmap`, `/family`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Optional AI Review

Set these server-side environment variables:

```txt
GROQ_API_KEYS=comma-separated-key-list
GROQ_MODEL=your-model-name
```

Game reviews are user-triggered. The app sends moves and basic game details, not personal information. Review output is grounded with deterministic `chess.js` facts, cached locally, rate-limited, retried on transient failures, and protected by a short circuit breaker.

## Optional Accounts And Cloud Sync

Create a Supabase project, run [`supabase/migrations/20260615_user_progress.sql`](supabase/migrations/20260615_user_progress.sql), and configure:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without these variables the app remains fully usable with local progress. With them, users can sign in through an email magic link and explicitly upload or restore their progress snapshot. Row-level security restricts each snapshot to its owner.

## Current Limitations

- Bot levels are practice levels, not measured ratings.
- Game, lesson, puzzle, and family progress currently persist only on the device.
- The opening recognizer and model-game library are intentionally small curated sets.
- Deeper move classification still requires a server-side Stockfish analysis queue.
- Accounts and cloud synchronization require a configured database/auth provider.
- Multiplayer, matchmaking, ratings, moderation, and anti-cheat remain deliberately deferred.
