# Roadmap: Phases to Production

## Phase 1: Solid Alpha (Current)
✓ Stockfish integration with levels
✓ Play trainer working locally
✓ Puzzle room with basic drills
✓ Learn room with research-backed lessons
✓ Watch room with model games
- [ ] Post-game AI review working and hardened
- [ ] Honest bot difficulty labels (see DIFFICULTY_HONESTY.md)
- [ ] Legal move highlighting
- [ ] Better beginner onboarding

**Goal:** One complete game flow end-to-end. Deploy to Vercel.

## Phase 2: Trust & Beginner UX (Q3 2026)
- [ ] Legal move highlighting reduces illegal move attempts
- [ ] Better beginner onboarding: piece movement, objectives, first move tips
- [ ] Honest difficulty calibration verified by player testing
- [ ] Mobile layout tested at 390px and up
- [ ] Difficulty progression suggestions after wins
- [ ] Board orientation / flip control

**Goal:** Beginner can sit down, understand the app, and play without confusion.

## Phase 3: Content & Puzzle Integration (Q4 2026)
- [ ] Better puzzle onboarding
- [ ] Lichess puzzle API or imported puzzle sets
- [ ] Opening recognition ("You're in the Italian Game")
- [ ] Expanded learn content

**Goal:** More varied practice options beyond just playing the bot.

## Phase 4: Cloud & Accounts (Q1 2027)
- [ ] Authentication (Auth.js)
- [ ] Database (Supabase or Vercel Postgres)
- [ ] Cloud game history
- [ ] Streak sync across devices
- [ ] Route-based navigation: `/play`, `/puzzles`, `/learn`, `/watch`

**Goal:** Player data persists; app feels like a real service, not a toy.

## Phase 5: Advanced Features (Q2 2027+)
- [ ] PGN import/export
- [ ] Timed games (rapid, blitz, untimed)
- [ ] Analysis board with engine suggestions
- [ ] Blunder detection and coaching feedback
- [ ] Keyboard input / move notation entry

**Goal:** App appeals to improving players, not just beginners.

## Trust Metrics
- Measure bot difficulty expectations vs player feedback
- Track "Why did the bot make that move?" questions
- Monitor trust signals: repeat visits, streak length, puzzle completion rate
- Avoid feature creep; prioritize honesty and stability

## Known Risks
1. **Bot Calibration**: If levels don't match player expectations, users leave
2. **Mobile UX**: If layout is unusable at 390px, we lose mobile players
3. **Slow Stockfish**: If browser WASM is too slow, fallback to Alpha limits gameplay
4. **Privacy**: If AI review sends more than disclosed, trust breaks
5. **Overclaiming**: "Grandmaster Engine" that plays weakly is worse than no engine claim

**Mitigation:** Test with real beginner players early and often. Measure trust, not just features.
