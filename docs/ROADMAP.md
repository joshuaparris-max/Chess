# Roadmap: Grandmaster Path Alpha to Trustworthy Trainer

Last consolidated from repo docs: 2026-06-15.

## What Is Done

- [x] Next.js/Vercel-ready alpha shell
- [x] Play as White against Stockfish-powered bot levels
- [x] Alpha Bot fallback if Stockfish fails
- [x] Legal move validation with chess.js
- [x] Promotion selection for human moves
- [x] Checkmate/game-over feedback
- [x] Basic puzzle room
- [x] Basic learn room
- [x] Static watch/model-player room
- [x] Beginner-to-advanced roadmap room
- [x] Local streak/daily goal
- [x] Post-game AI review and chat
- [x] chess.js-grounded checkmate facts for post-game review/chat
- [x] Review prompt requires final move and main winning theme

## Phase 1: Trustworthy Beginner Trainer

Goal: a complete beginner can play, understand what happened, and get useful feedback without external explanation.

- [x] Remove or soften all rating/title-like bot overclaims in labels and copy
- [ ] Calibrate bot levels with real beginner testing
- [x] Add play-as-Black option
- [x] Add board flip/orientation control
- [x] Add local time controls: untimed, 10+0, 5+0
- [x] Explain legal move dots, selected-piece state, and illegal moves in beginner language
- [x] Add first-game onboarding overlay: goal of chess, how pieces move, how to start
- [ ] Add position-aware hints using shallow Stockfish facts
- [x] Add local game archive for the last 10-20 games
- [ ] Save local review summaries with archived games
- [ ] Verify Quick Review on production is specific, short, readable, and free of raw Markdown/debug text
- [x] Add puzzle onboarding and clearer motif explanations (per-puzzle teaching points and three-level hints)
- [x] Replace adult-board Unicode pieces with SVG-rendered pieces
- [x] Add board/theme settings saved locally (selectable piece sets persisted to localStorage)
- [~] Run mobile QA at about 390px width (automated board, controls, onboarding, clocks, and settings checks pass; review/chat/promotion coverage remains)

## Phase 2: Content, Review Depth, and Local Progress

Goal: the app teaches more than "play a bot" and starts forming a real improvement loop.

- [x] Import or curate a larger legal puzzle dataset with license/attribution notes (117 generated-and-verified adult puzzles + `docs/PUZZLE_SOURCES.md`)
- [x] Add puzzle tags, difficulty estimates, and attempt history (themes/phase tags, five difficulty bands, local attempt/solved tracking)
- [x] Add multi-move puzzle sequences with opponent auto-reply and three-level hints
- [ ] Add puzzle streaks and spaced repetition
- [ ] Add engine-backed review categories: blunder, mistake, missed tactic, good move
- [ ] Add retry-mistakes flow after review
- [x] Add opening recognition from a small curated opening table
- [x] Add PGN import/export
- [ ] Add analysis board with arrows/annotations
- [x] Turn Watch cards into interactive PGN/model-game boards
- [x] Add structured lessons with completion tracking
- [ ] Add spaced repetition basics for puzzles/lessons
- [x] Add route-based pages: `/play`, `/puzzles`, `/learn`, `/watch`, `/roadmap`, `/family`
- [ ] Add deep links and better browser back-button behavior

## Phase 3: Cloud Learning App

Goal: progress survives devices and the app can support durable training history.

- [ ] Design local-to-cloud migration before adding accounts
- [x] Add optional Supabase email authentication integration
- [x] Add Supabase progress schema and row-level security migration
- [ ] Save games, reviews, puzzle attempts, lesson progress, and settings
- [ ] Sync streaks and training plans across devices
- [ ] Add privacy/retention policy for saved games and AI review data
- [ ] Move rate limiting to Redis, Vercel KV, or another shared store for multi-instance production
- [ ] Add basic observability: Sentry plus Vercel logs/PostHog or Umami events

## Phase 4: Advanced Training

Goal: reviews become objective enough for improving club players, not just motivational summaries.

- [ ] Add server-side Stockfish worker or queued analysis for deeper reviews
- [ ] Store move annotations with engine score, best move, and human explanation
- [ ] Add opening explorer lite for the user's own games
- [ ] Add endgame/tablebase lookup after analysis board exists
- [ ] Generate personalized training plans from saved games and puzzle attempts
- [ ] Add study mode with annotated chapters
- [~] Add keyboard move input and stronger accessibility flows (arrow-key board navigation and richer square labels shipped)

## Phase 5: Multiplayer and Platform Work

Goal: only begin platform work after the single-player learning loop shows retention.

- [ ] Build a WebSocket prototype for unrated friend games
- [ ] Make the server authoritative for moves, clocks, resignations, draw offers, and reconnects
- [ ] Add clocks, rematches, saved multiplayer archive, and basic chat
- [ ] Add matchmaking and ratings
- [ ] Add fair-play/reporting/moderation baseline before public rated play
- [ ] Add tournaments, clubs, leaderboards, and community features later
- [ ] Add public API/export pipeline only after data models stabilize
- [ ] Consider PWA/native mobile strategy after mobile web retention is proven

## Research Backlog

These are useful for future evidence quality, but they should not block Phase 1 product work.

- [ ] Build an evidence ledger for historical claims with artifact ids and source confidence
- [ ] Wayback review: Chess.com founder posts, tactics, livechess, membership, and computer-workouts pages from 2007-2012
- [ ] Wayback review: Chesspark and chess24 public artifacts before/after acquisition
- [ ] Verify early Lichess commit-history claims against public repository artifacts
- [ ] Keep closed-source backend claims marked Unknown unless supported by public evidence

## Current Guardrails

- Do not chase multiplayer before the beginner trainer is trustworthy.
- Do not market official Elo, title strength, or grandmaster-level coaching without calibration.
- Do not let the LLM invent chess facts; compute facts with chess.js and Stockfish first.
- Do not publish user games publicly without accounts, consent, privacy review, and anonymization.
