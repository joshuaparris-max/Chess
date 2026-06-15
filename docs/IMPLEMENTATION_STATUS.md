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
- 114-puzzle adult tactics trainer: five difficulty bands, themes and phase tags, multi-move sequences with opponent auto-reply, black-to-move board flip, three-level progressive hints, difficulty filter, and local attempt/solved tracking; puzzles are generated and verified by `scripts/generate-adult-puzzles.mjs`
- Family puzzle bank expanded to 24 curated child-friendly positions
- Puzzle validator (`npm run validate:puzzles`) plus authorship/attribution notes in `docs/PUZZLE_SOURCES.md`
- Selectable, locally persisted adult board piece sets (classic SVG, inverted, modern, outline, letters)

## Next Production Work

- Configure authentication and Postgres, then migrate local games/progress to cloud sync
- Add puzzle streaks and spaced repetition on top of the curated library, and consider an attributed external import
- Add server-side Stockfish analysis and objective move classifications
- Add deeper accessibility testing and keyboard move input
- Add production observability and shared rate limiting

## Deferred Platform Work

Live multiplayer, matchmaking, ratings, moderation, anti-cheat, tournaments, clubs, and community features remain deferred until the single-player learning loop has proven retention.
