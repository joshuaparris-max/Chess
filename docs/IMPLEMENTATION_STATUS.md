# Implementation Status

Updated: 2026-06-15

## Completed

- Neutral bot labels, play as Black, adult board flip, SVG-rendered pieces, legal-target explanation
- Untimed, 10-minute, and 5-minute delta-time clocks
- Vitest rule/progress/resilience tests and Playwright desktop/mobile regression tests
- Local 20-game archive, PGN import/export, and route-based rooms
- Opening recognition, local lesson completion, puzzle attempt history, and interactive model games
- Deterministic post-game review facts, local review cache, retries, circuit breaker, validation, and rate limiting
- Family pass-and-play, four adventures, family puzzles/lessons/progress, read aloud, celebrations, and persistent bright theme
- Optional Supabase email accounts and explicit cloud snapshot upload/restore with row-level security
- 117-puzzle adult tactics trainer: five difficulty bands, themes and phase tags, multi-move sequences with opponent auto-reply, black-to-move board flip, three-level progressive hints, difficulty filter, and local attempt/solved tracking; puzzles are generated and verified by `scripts/generate-adult-puzzles.mjs`
- Family puzzle bank expanded to 24 curated child-friendly positions
- Puzzle validator (`npm run validate:puzzles`) plus authorship/attribution notes in `docs/PUZZLE_SOURCES.md`
- Selectable, locally persisted adult board piece sets (classic SVG, inverted, modern, outline, letters)
- **Lichess puzzle integration (NEW):**
  - Live Daily Puzzle tab (cached 1 hour, Lichess's curated puzzle)
  - Live Random Puzzle tab (fresh on-demand, with angle/difficulty filters)
  - Accumulated Archive tab (paginated, stable 20-puzzle pages, filterable by rating/theme/date)
  - Daily scheduled cron job (Sydney timezone, 12-attempt retry loop, quality filters: minRating 1600, minPlays 100, no 'opening' theme)
  - Idempotent puzzle import (UNIQUE(puzzle_date), UNIQUE(lichess_id), automatically skips if already imported)
  - Attempt logging (all 12 retry attempts tracked in daily_puzzle_imports, reason for each rejection)
  - Server-only admin access (Supabase service-role key protected with 'server-only' directive, never in browser)
  - FEN reconstruction from Lichess PGN (auto-determines starting position using chess.js, handles white/black to-move)
  - Comprehensive test coverage (46 tests: 7 date/timezone, 9 FEN parser, 14 cron logic, 16 existing)
  - Build validation (npm run build passes, npm run lint passes, npm run validate:puzzles passes)

## Next Production Work

- Deploy Lichess integration to production: run Supabase migration, set environment variables in Vercel, verify first cron execution (24 hours after deploy)
- Browser testing of Lichess puzzle tabs (Daily, Random, Archive) on desktop and mobile viewports
- Configure authentication and Postgres for user progress cloud sync (beyond current test setup)
- Add puzzle streaks and spaced repetition on top of the curated library
- Add server-side Stockfish analysis and objective move classifications
- Add deeper accessibility testing and keyboard move input
- Add production observability and shared rate limiting

## Deferred Platform Work

Live multiplayer, matchmaking, ratings, moderation, anti-cheat, tournaments, clubs, and community features remain deferred until the single-player learning loop has proven retention.
