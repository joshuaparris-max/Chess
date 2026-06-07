# Grandmaster Path Alpha QA Report

## Summary

Grandmaster Path Alpha completed an end-to-end alpha QA pass covering installation, type checking, production build, browser gameplay, puzzles, content rooms, local progress, responsive layouts, and runtime console health.

The app is suitable for an alpha Vercel deployment. The Play room, Puzzles, Learn, Watch, and Roadmap sections are functional. The current bot remains a lightweight local minimax trainer and its displayed bands are not measured ratings.

## Environment

- QA date: June 7, 2026
- OS: Windows
- Node.js: 24.16.0
- npm: 11.13.0
- Next.js: 16.2.7
- Browser: Playwright Chromium
- Tested widths: 390px, 768px, 1366px

## Commands Run

```bash
npm install
npm run lint
npm run build
npm run dev
npm start
```

Additional checks included `git diff --check`, puzzle legality validation with `chess.js`, production HTTP smoke testing, and automated browser interaction.

## Build Status

- Install: Passed
- Typecheck (`npm run lint`): Passed
- Production build (`npm run build`): Passed
- Development server (`npm run dev`): Passed
- Production server (`npm start`): Passed
- Homepage HTTP response: 200
- Static Vercel-compatible route: Passed
- Browser console errors: None
- Failed browser requests: None

`npm audit` reports two moderate transitive advisories through the installed Next.js/PostCSS dependency tree. The suggested automated fix is an inappropriate major downgrade, so no forced audit fix was applied.

## Manual Play-Test Results

### Play

- Legal moves work and the bot replies.
- Illegal moves are rejected with beginner-friendly feedback.
- Full move history now remains intact across player and bot moves.
- Undo Pair correctly removes the latest player/bot turn.
- New Game resets the board and move history.
- Street Beginner, Club Bot, and Low-noise Alpha Trainer settings replied successfully.
- After the responsiveness fix, the highest alpha band replied in about 1.6 seconds during the final mobile production-browser check.
- Difficulty wording clearly states that bands are practice targets, not measured ratings.
- The interface prevents moves while the bot is thinking and prevents empty-history undo.
- Checkmate and draw status branches were inspected; mate positions were also validated through the puzzle set.

### Puzzles

- All five puzzle positions and listed solutions are legal.
- Both mate-in-one puzzles resolve as checkmate.
- Wrong legal moves leave the position unchanged and show clear feedback.
- Correct moves show the teaching point.
- Reset and Next work repeatedly without crashes.

### Learn

- All five lesson cards render.
- Lessons contain specific drills and practical explanations.
- Wording is readable for beginners while advanced cards are clearly level-labelled.

### Watch

All five required player cards render:

- Magnus Carlsen
- Garry Kasparov
- Fabiano Caruana
- Levon Aronian
- Wesley So

Each card provides a practical position lesson and training takeaway. Claims are framed as teaching observations rather than guarantees.

### Roadmap And Progress

- Six beginner-to-advanced stages render.
- Roadmap wording no longer implies a guaranteed title or rating.
- Daily goal and streak persist in local storage.
- A daily check-in can only be recorded once per local calendar day.

### Responsiveness And Runtime

- No horizontal overflow at 390px, 768px, or 1366px.
- Board, navigation, cards, controls, and mobile action bar remain readable at tested widths.
- White and black piece glyphs remain visible on both square colors.
- No hydration errors, unhandled exceptions, React key warnings, broken asset requests, or runtime console errors were observed.

## Bugs Found

| Severity | Area | Issue | Steps to Reproduce | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| High | Play | Each move rebuilt the game from FEN and discarded prior move history | Play two full turns and inspect move list | Four plies remain visible | Only the latest move remained | Fixed |
| High | Play | Undo Pair could not reliably undo a player/bot pair because history was discarded | Play multiple turns, then select Undo Pair | Latest two plies are removed | History reset behavior was incorrect | Fixed |
| Medium | Play | Highest alpha settings could block the main thread for about six seconds | Select highest setting and make a move | Alpha remains reasonably responsive | Depth-3 minimax caused a noticeable pause | Fixed |
| Medium | Progress | Repeated clicks could artificially increase the study streak on the same day | Click Mark today trained repeatedly | One check-in per day | Streak increased on every click | Fixed |
| Medium | Product wording | Bot labels implied approximate measured Elo and a grandmaster simulation | Read difficulty selector and highest bot card | Alpha limitations are explicit | Strength claims were too confident | Fixed |
| Low | Chessboard | White piece glyphs lacked reliable contrast on light squares | Open the starting board | All pieces remain visible | White pieces were hard to see | Fixed |
| Low | Mobile layout | Board viewport sizing ignored parent padding and caused horizontal overflow | Open Play at 390px | No horizontal scrolling | Page exceeded the viewport width | Fixed |
| Low | Puzzles | Wrong-move message told the player to reset although the position had not changed | Make a legal but incorrect puzzle move | Feedback matches behavior | Message unnecessarily requested reset | Fixed |
| Low | Roadmap | Heading could imply a guaranteed route to Grandmaster | Open Roadmap | Realistic training-path wording | Wording was overly ambitious | Fixed |

## Bugs Fixed

- Preserved complete Play-room history by cloning games through PGN before applying moves.
- Corrected Undo Pair behavior and disabled it while unavailable.
- Reduced the strongest synchronous alpha searches to a responsive depth.
- Added once-per-day streak handling and protected local progress hydration.
- Reframed bot Elo values as unmeasured training bands.
- Renamed the highest bot to Low-noise Alpha Trainer.
- Improved chess-piece contrast and mobile board controls.
- Constrained the mobile board to its parent container to prevent horizontal overflow.
- Clarified wrong-puzzle feedback.
- Reworded the roadmap as beginner-to-advanced and explicitly removed title/rating promises.

## Known Limitations

- Current bot is an alpha trainer engine, not Stockfish.
- No user accounts.
- No saved cloud progress.
- No real rating system yet.
- No multiplayer.
- Puzzle library is minimal.
- Bot search runs in the browser main thread; depth is deliberately limited for responsiveness.
- Watch currently contains study cards rather than video or interactive PGN playback.
- Full checkmate/draw game flows were not exhaustively played through every possible ending during this pass.

## Vercel Readiness

Ready for Vercel alpha deployment. The app builds successfully as a static Next.js route, requires no environment variables, and has no database or server dependency.

## Recommended Next Slice

1. Deploy current alpha to Vercel.
2. Add real Stockfish Web Worker integration.
3. Expand puzzle library.
4. Add PGN/game review.
5. Add user progress model.
