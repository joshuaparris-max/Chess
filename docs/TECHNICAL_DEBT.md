# Technical Debt and Engineering Improvements

Last consolidated from repo docs: 2026-06-08.

## Engine Architecture

- [ ] Keep one engine adapter boundary for Stockfish, Alpha fallback, and future server analysis
- [ ] Separate browser Stockfish play from future queued/deeper analysis
- [ ] Verify stale engine cancellation after New Game, Undo, level change, and game over
- [ ] Cache or warm Stockfish worker initialization where useful
- [ ] Add clearer loading/fallback states when WASM fails
- [ ] Calibrate Stockfish levels through real games, not assumed Elo/title labels
- [ ] Keep engine jargon out of beginner UI: FEN, UCI, centipawns, depth, NNUE, raw SAN/PGN unless explained

## Chess Rules and State

- [ ] Keep chess.js as deterministic source of truth for legal moves, check, mate, draw, and promotion
- [ ] Add a reducer/state-machine model for play state before PlayTrainer grows further
- [ ] Make promotion, undo, new game, engine thinking, timeout, game over, and review clearing explicit states
- [ ] Keep ChessBoard rendering separate from Stockfish and review lifecycle
- [ ] Add server-side validation mirror before saved cloud games or multiplayer
- [ ] Store future games as versioned records, e.g. LocalGameRecordV1

## Post-Game Review and AI

- [x] Ground checkmate facts with chess.js
- [x] Pass final move and main theme into review prompts
- [ ] Add deterministic move facts beyond checkmate: captures, checks, promotion, material, legal replies
- [ ] Add engine-backed facts: best move, eval swing, blunder/mistake/good move
- [ ] Prevent LLM from inventing lines or engine certainty
- [ ] Add prompt tests for summary, detail, and chat
- [ ] Add regression test for "Why was that checkmate?"
- [ ] Add regression test for "How specifically can I improve?"
- [ ] Keep raw FEN/PGN out of visible UI unless user explicitly exports it
- [ ] Track AI request cost, token usage, failures, and fallback behavior

## API, Security, and Rate Limiting

- [ ] Move in-memory rate limiting to Redis, Vercel KV, Upstash, or another shared store for multi-instance production
- [ ] Keep Groq keys server-only
- [ ] Validate request size, move count, and chat question length
- [ ] Add structured API error responses for missing config, rate limit, provider failure, and validation failure
- [ ] Add per-feature quotas or cooldowns before broader alpha testing
- [ ] Log provider failure by key index only; never log actual keys
- [ ] Add privacy/retention notes for AI review payloads

## Data and Configuration

- [ ] Move hardcoded training data toward JSON, MDX, or another editable content format when content grows
- [ ] Keep bot labels, descriptions, and levels centralized
- [ ] Add versioned localStorage schemas and migration helpers
- [ ] Cap local game/review archive size
- [ ] Add explicit export/import paths for local games before cloud accounts
- [ ] Document licenses for any imported puzzle/game datasets

## Frontend Structure

- [ ] Split PlayTrainer into smaller modules/hooks: board state, engine state, clock state, review state, archive state
- [ ] Consolidate button styles and spacing
- [ ] Reduce inline styles; use Tailwind or shared components consistently
- [ ] Extract magic numbers for promotion choices, move timings, board sizes, archive caps, and rate limits
- [ ] Keep route/page layout ready for `/play`, `/puzzles`, `/learn`, `/watch`, `/roadmap`
- [ ] Avoid nested cards and keep app screens dense but readable

## Mobile and Accessibility

- [ ] Add automated or documented mobile checks around 390px width
- [ ] Ensure board remains square and controls do not overflow
- [ ] Ensure review/chat does not crowd the board on mobile
- [ ] Add ARIA labels for board squares and controls
- [ ] Add keyboard selection or notation input
- [ ] Add screen-reader announcements for selected piece, legal moves, check, checkmate, and bot thinking
- [ ] Improve focus states and contrast

## Testing

- [ ] Unit tests: gameStatus, review context, bot label mapping, clock reducer
- [ ] Chess-rule tests: promotion, checkmate, stalemate, repetition, insufficient material, draw
- [ ] Engine integration tests: Stockfish parsing, cancellation, fallback
- [ ] API tests: missing Groq key, rate limit, validation, prompt boundaries
- [ ] Puzzle tests: solution lines, wrong move behavior, reset/next
- [ ] E2E desktop: play full game, review game, ask why checkmate
- [ ] E2E mobile: 390px board, tap targets, promotion modal, no overflow
- [ ] Regression tests after engine or review prompt changes

## Performance and Observability

- [ ] Measure bundle size and page load
- [ ] Lazy-load heavy review/engine code where practical
- [ ] Monitor Stockfish worker load time and failures
- [ ] Add Sentry or equivalent error tracking
- [ ] Add lightweight analytics for game completion, review usage, puzzle completion, and return visits
- [ ] Watch for AI cost drift before broader release

## Future Multiplayer Readiness

- [ ] Do not bolt multiplayer onto client-only game state
- [ ] Design authoritative server move validation before live play
- [ ] Define clock policy for reconnect, disconnect, browser sleep, and flag timing
- [ ] Plan append-only move events for audit/recovery
- [ ] Add moderation/reporting requirements before chat or rated play
- [ ] Add rating and fair-play systems only after reliable live-game infrastructure exists
