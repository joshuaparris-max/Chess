# Product Backlog

Last consolidated from repo docs: 2026-06-15.

## Play Screen

- [x] Play as White vs bot
- [x] Stockfish-powered bot play
- [x] Alpha Bot fallback
- [x] Promotion picker
- [x] Checkmate/game-over feedback
- [x] Play as Black option
- [x] Board flip/orientation control
- [x] Local time controls: untimed, 10+0, 5+0
- [x] Beginner onboarding: objective of chess, piece movement, first move guide
- [x] Explain legal move highlighting/selected-piece behavior
- [x] Better illegal move feedback with beginner explanations
- [ ] Position-aware hints from shallow Stockfish
- [ ] Difficulty progression suggestion after repeated wins
- [x] Opening recognition, e.g. "Italian Game" from move sequence
- [x] Local settings for player color, board orientation, piece set, time control, and bot level

## Bot Difficulty and Trust

- [x] Remove official-looking Elo/title claims from user-facing labels
- [x] Reword title-like bot labels if calibration remains unverified
- [x] Keep all levels described as practice/trainer levels, not official ratings
- [ ] Add player-testing notes for each bot level
- [ ] Track whether Street Beginner is actually beginner-friendly
- [ ] Add "try next level" guidance only after real results support it

## Post-Game Review and Coach

- [x] Quick Review API route
- [x] Key moments/detail mode
- [x] Review chat route
- [x] chess.js-grounded checkmate context
- [x] Prompt requires final move and main winning theme
- [ ] Production QA: Quick Review consistently mentions final move
- [ ] Production QA: Quick Review avoids filler and generic advice
- [ ] Production QA: "Why was that checkmate?" returns deterministic beginner explanation
- [ ] Production QA: "How specifically can I improve?" returns 2-3 concrete game-specific points
- [ ] Add engine-backed move classifications: blunder, mistake, missed tactic, good move
- [ ] Add retry-mistakes flow
- [x] Add local review caching
- [ ] Add server-side/queued Stockfish analysis later for deeper review
- [ ] Add cost/usage telemetry for AI review requests

## Puzzle Room

- [x] Basic puzzle room
- [x] Multi-move puzzle sequences with opponent auto-reply
- [x] Black-to-move board flip
- [x] Three-level progressive hints (gentle, directional, reveal)
- [x] Puzzle onboarding improvements (per-puzzle teaching points)
- [x] Clear motif explanations for complete beginners
- [x] Larger puzzle database or curated import pipeline (117 generated-and-verified adult puzzles)
- [x] License/attribution notes for imported puzzle sources (`docs/PUZZLE_SOURCES.md`)
- [x] Puzzle tags and difficulty estimates (themes, phase, five difficulty bands)
- [x] Puzzle attempt history (local attempt/solved tracking)
- [x] Difficulty filter
- [x] Puzzle streaks and spaced repetition
- [x] Additional filters: theme, phase, color, and length
- [ ] Practice modes (timed, by-theme drills)
- [x] Puzzle reset/next/wrong-move behavior tests
- [ ] Puzzle Rush/Battle-style modes later, after the base puzzle bank is solid

## Learn Room

- [x] Basic research-backed lesson cards
- [ ] Expand lessons beyond current cards
- [ ] Add interactive lessons instead of static cards
- [x] Add lesson completion tracking
- [ ] Add lesson drills that launch matching puzzles or practice positions
- [ ] Add spaced repetition for weak concepts
- [ ] Add endgame conversion earlier in the path

## Watch Room

- [x] Static model-player cards
- [x] Convert static cards into interactive PGN/model-game boards
- [ ] Add guided comments: one key idea per game
- [x] Add "practice this idea" handoff into puzzles or play
- [ ] Add curated model games for opening, middlegame, endgame, defense, and conversion themes
- [ ] Defer live broadcasts/video library until the core study mode works

## Progression and Persistence

- [x] Local daily goal/streak basics
- [x] Local game archive for last 20 games
- [x] Local review archive
- [x] Local puzzle attempt history
- [x] Local lesson completion state
- [x] Export local games/reviews as PGN or JSON
- [ ] Design local-to-cloud migration
- [ ] Accounts and cloud progress
- [ ] Cloud game history
- [ ] Cloud review history
- [ ] Synced streaks and training plans

## Navigation and App Structure

- [x] Route-based pages: `/play`, `/puzzles`, `/learn`, `/watch`, `/roadmap`, `/family`
- [ ] Deep links into rooms, reviews, lessons, and saved games
- [ ] Better browser back-button behavior
- [ ] Reduce one-page dashboard feel
- [ ] Keep Play as the first serious app surface, not a marketing landing page

## Design, Mobile, and Accessibility

- [x] Replace adult-board Unicode pieces with SVG-rendered pieces
- [x] Add board and piece theme selector (classic SVG, inverted, modern, outline, letters; persisted locally)
- [x] Verify board remains square on mobile
- [ ] Verify review/chat layout at about 390px width
- [ ] Ensure 48px minimum touch targets where practical
- [x] Add ARIA labels for squares and controls
- [ ] Add screen-reader status for turn, check, checkmate, selected piece, and legal targets
- [x] Add keyboard square navigation and selection
- [ ] Improve contrast and focus states
- [ ] Keep text inside controls from overflowing on mobile

## Analysis and Study Tools

- [x] PGN import/export
- [ ] Analysis board with arrows and annotations
- [ ] Best-move and missed-tactic detection
- [ ] Opening recognition from curated ECO/opening data
- [ ] Opening explorer lite for user's own games
- [ ] Endgame/tablebase lookup after analysis board exists
- [ ] Personal training plan from saved games and puzzle attempts

## Accounts, Data, and Privacy

- [ ] Choose Auth.js, Clerk, or Supabase Auth
- [ ] Choose Postgres provider: Supabase, Neon, or Vercel Postgres
- [ ] Add data models: users, games, reviews, puzzles, puzzle attempts, lessons, settings
- [ ] Add privacy/retention copy for saved games and AI review data
- [ ] Avoid storing unnecessary personal data
- [ ] Do not publish user games without explicit consent and anonymization

## Multiplayer and Community Later

- [ ] WebSocket prototype for unrated friend games
- [ ] Server-authoritative move validation
- [ ] Clock correctness with reconnect handling
- [ ] Match archive
- [ ] Rematches
- [ ] Basic chat with moderation/reporting
- [ ] Matchmaking and ratings
- [ ] Fair-play/reporting/moderation baseline
- [ ] Tournaments, clubs, leaderboards, events, and community features much later

## Research and Evidence Backlog

- [ ] Maintain evidence ledger for historical/platform claims
- [ ] Mark closed-source implementation details as Unknown unless sourced
- [ ] Inspect public Wayback snapshots for early Chess.com feature packaging
- [ ] Inspect public Wayback snapshots for Chesspark/chess24 public artifacts
- [ ] Keep Lichess as the technical architecture reference and Chess.com as product-sequencing reference
