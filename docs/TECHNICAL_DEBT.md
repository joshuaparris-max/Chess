# Technical Debt & Improvements

## Engine Architecture
- [ ] Clean engine interface / strategy pattern
- [ ] Separate Stockfish engine, Alpha fallback, and future server engine behind one adapter
- [ ] Avoid engine jargon in UI (no FEN/PGN/UCI/centipawn/depth/NNUE/engine eval/SAN exposed to beginners)
- [ ] Server-side Stockfish option later if browser WASM is too limited
- [ ] Better performance/loading state for Stockfish
- [ ] Verify Stockfish multi-level calibration

## Configuration & Data
- [ ] Hardcoded `trainingData.ts` may need JSON/MDX/CMS later
- [ ] Bot difficulty labels need honest calibration (see DIFFICULTY_HONESTY.md)
- [ ] Review feature labels: avoid unverified strength claims

## Testing
- [ ] More automated tests for Play/Puzzles/promotion/checkmate
- [ ] E2E tests for mobile layout and game-over flows
- [ ] Regression tests after engine updates

## Performance
- [ ] Measure and optimize bundle size
- [ ] Lazy-load board rendering on mobile
- [ ] Cache Stockfish worker initialization

## Code Quality
- [ ] Consolidate button styles and spacing
- [ ] Reduce inline styles; use Tailwind consistently
- [ ] Extract magic numbers (promotion choices, piece unicode, etc.)
- [ ] Add JSDoc comments for complex game logic
