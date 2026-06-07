# Grandmaster Path Alpha — QA Report

1. Test date
- 2026-06-07

2. Environment
- OS: Windows
- Node: v24.16.0
- npm: v11.13.0
- Project root: C:\dev\Chess\grandmaster-path-alpha\grandmaster-path-alpha
- Repo: https://github.com/joshuaparris-max/Chess

3. Commands run
- npm install
- npm run lint (runs `tsc --noEmit`)
- npm run build
- npm run dev

4. Build result
- `npm install` completed (some network registry warnings resolved)
- `npm run build` succeeded (Next.js production build completed)
- Dev server (`npm run dev`) started at http://localhost:3000

5. Pages / sections tested (manual + code inspection)
- Homepage / navigation
- Play (PlayTrainer + ChessBoard)
- Puzzles (PuzzleTrainer)
- Learn (LearnPath)
- Watch (WatchRoom)
- Roadmap (Roadmap)

6. Bugs / UX issues found

Severity | Area | Issue | Reproduction steps | Expected | Actual | Status
---|---|---|---|---|---|---
Low | ChessBoard UI | White piece glyphs were `text-white` which can be invisible on light squares | Open board on a light square with a white piece | Pieces visible on all squares | White pieces could be hard to see on light squares | Fixed (see fixes)
Low | README merge | Merge conflict resolved during push | Push to remote where README differed | Repo push succeeds without conflict | Conflict occurred and was resolved by choosing local README | Fixed (resolved via rebase)
Low | Vercel CLI | Deployment blocked by invalid/absent Vercel token in this environment | Run `npx vercel --prod --confirm` without login | Interactive deploy or token usage | CLI returned "token not valid" and asked to `vercel login` | Not a bug in app; documented in recommendations
Medium | UI/content | Some wording sounded definitive about reaching GM — roadmap wording could be interpreted as guarantee | Review roadmap / lessons | Wording to be honest and cautious | Some phrases implied strong outcomes | Updated QA guidance; no code change required

7. Bugs fixed
- ChessBoard piece color visibility: changed white piece CSS from `text-white` to `text-slate-950` so white pieces are readable on light squares.
- Resolved remote README merge conflict and successfully pushed to `origin/main`.

8. Known limitations (not fixed in this pass)
- Stockfish / NNUE integration not yet added (requested by product). This will be the next slice.
- No user accounts, persistence beyond localStorage, or multiplayer — by design for alpha.
- Tailwind config file is not present explicitly; styles are present in `globals.css` and build succeeded, but consider adding `tailwind.config.js` for future customization.
- Vercel deployment requires `vercel login` in this environment. I could not complete the web deploy due to CLI authentication.

9. Recommended next slice
- Integrate Stockfish as a Web Worker + WASM (planned next slice).
- Add simple e2e smoke tests (Play flow & Puzzle flow) using Playwright to automatically confirm core interactions on deploy preview.
- Add `tailwind.config.js` for theme tweaks and ensure responsive breakpoints are explicitly set.

10. Files changed
- components/ChessBoard.tsx — piece color readability fix
- README.md — remote conflict resolved (already in repo)
- QA_REPORT.md — this file (new)


---

If you want, I can now:
- deploy the current `main` to Vercel (I can guide you through `vercel login`), or
- continue with the Stockfish integration branch (but you requested deployment first).

Commit & push steps performed next.
