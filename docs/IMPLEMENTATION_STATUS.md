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
- First-game beginner onboarding, persistent Play settings, keyboard board navigation, richer screen-reader square labels, and read-aloud lesson/coach/model-game content
- Advanced local puzzle filters for theme, phase, side to move, and line length
- Model-game prediction prompts and direct handoff into Play or Puzzles
- Local puzzle solve streaks and spaced-repetition review scheduling with backward-compatible progress migration
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
- Complete deeper accessibility testing and add optional notation move input
- Add production observability and shared rate limiting

## Deferred Platform Work

Live multiplayer, matchmaking, ratings, moderation, anti-cheat, tournaments, clubs, and community features remain deferred until the single-player learning loop has proven retention.

## Ticket Implementation Status (integration QA snapshot)

| Ticket | Owner | Commit | Present on origin/main | Lint | Tests | Build | Manual QA | Live Vercel | Notes |
|--------|-------|--------|------------------------:|:----:|:-----:|:-----:|:---------:|:-----------:|:------|
| 1.1    | Codex | 7bcab20 | Yes | ✅ | n/a | ✅ | Pending | Pending | Fairy piece set added (SVG) |
| 1.2    | Claude | 41fce37 | Yes | ✅ | n/a | ✅ | Requires live verification | Pending | Fairy Garden theme present — mark for live check |
| 1.3    | Codex | b3ceed9 | Yes | ✅ | ? | ✅ | Pending | Pending | Magical Sounds commit present on origin/main (verify audio UX) |
| 1.4    | Claude | 3f7afc9 / (recovery branch f10d79e) | NOT merged (recovery/ticket-1.4-wip) | n/a (WIP) | n/a | n/a | PRESERVED IN recovery/ticket-1.4-wip (do not merge) | Pending | Overlapping Copilot edits — compare Claude's branch before merging |
| 2.1    | Codex | cc32ba6 | Yes | ✅ | ? | ✅ | Pending | Pending | Sticker Book present on origin/main; verify sticker UI and storage handling |
| 2.3    | Codex | 4d556e2 | Yes | ✅ | ? | ✅ | Pending | Pending | Emoji reactions commit present on origin/main; verify pass-and-play behavior |

Notes:
- This table is an initial QA snapshot created by the integration manager. "?" indicates tests not yet fully observed in the clean integration worktree run (vitest results require re-run capture).  
- Ticket 1.4 work has been preserved on a local recovery branch (`recovery/ticket-1.4-wip`) and MUST NOT be force-pushed, reset, or merged until Claude's branch is reviewed and reconciled.  
- Next steps: run focused manual QA for tickets 1.3, 2.1, 2.3 in the integration worktree, capture vitest output, and perform browser checks (desktop + 390px mobile).  

## Grandmaster Path Family Roadmap — COMPLETE (2026-06-16)

All 19 roadmap tickets implemented, built green, and shipped to `main`:

- **Phase 1:** 1.1 Fairy piece set · 1.2 Fairy Garden board · 1.3 Magical sounds · 1.4 Princess Story Mode (interactive, awards stickers + XP)
- **Phase 2:** 2.1 Sticker Book · 2.2 Bedtime Mode · 2.3 Emoji reactions · 2.4 Parent Report Card (`/report`)
- **Phase 3:** 3.1 XP & levelling (badge + toast + level-up modal) · 3.2 Daily Quest Log · 3.3 Loot Drops (`+` Ocean/Forest/Sunset themes) · 3.4 Puzzle Rush (`/puzzles/rush`) · 3.5 Puzzle Streak (`/puzzles/streak`)
- **Phase 4:** 4.1 Spell Slots (True Sight / Rewind / Shield, daily-limited, classic toggle) · 4.2 Boss Battles (`/bosses`) · 4.3 Character Sheet (`/profile`)
- **Phase 5:** 5.1 Family Leaderboard (`/family/leaderboard`) · 5.2 Family Puzzle Duel (`/puzzles/duel`)
- **6.1 Navigation:** Explore-more links bar wiring all new routes.
- **Polish:** milestone stickers auto-award from real progress; XP feeds quests, loot, and the leaderboard.

Verification: `tsc --noEmit` + `next build` green; 130 Vitest tests pass; all 8 new routes return 200 with no console errors.
