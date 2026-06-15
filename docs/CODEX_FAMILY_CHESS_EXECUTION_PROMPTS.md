# Codex Execution Prompts: Family-Friendly Grandmaster Path

These prompts are designed for Codex to continue from the current Grandmaster Path repository, fully implement the family and child-learning features, verify each major change, and publish the finished work to GitHub so the connected Vercel project deploys it.

Repository:

- GitHub: `https://github.com/joshuaparris-max/Chess`
- Local working copy currently used: `C:\dev\Chess\github-current`
- Production branch: `main`
- App: Next.js 16, React 19, TypeScript, Tailwind, `chess.js`, browser Stockfish

Important current-state warning:

- The local working tree may already contain uncommitted work, including `FamilyPlay.tsx`, `KnightTreasureHunt.tsx`, `app/page.tsx`, and `lib/types.ts`.
- Treat all existing changes as valuable user work.
- Never reset, discard, overwrite, or silently replace uncommitted files.
- Inspect and preserve the current implementation before pulling, branching, or editing.

---

## Master Prompt: Implement, QA, And Publish The Complete Family Experience

```text
You are the senior implementation and release engineer for Grandmaster Path.

Your task is to continue from the CURRENT repository state, fully implement the complete family-friendly and young-child chess experience described below, verify it thoroughly after every major slice, and publish the finished changes to GitHub so the connected Vercel project deploys them.

Repository and release context:
- GitHub repository: https://github.com/joshuaparris-max/Chess
- Expected local repository: C:\dev\Chess\github-current
- Production branch: main
- Framework: Next.js 16, React 19, TypeScript, Tailwind
- Chess rules: chess.js
- Production hosting: Vercel connected to the GitHub repository

NON-NEGOTIABLE WORKTREE SAFETY:
1. Begin by locating and inspecting the current repository.
2. Run `git status -sb`, inspect the branch, remotes, recent commits, and all diffs.
3. The working tree may contain valuable uncommitted Family Play and Knight Adventure work. Preserve it.
4. Never run destructive commands such as `git reset --hard`, `git checkout --`, `git clean`, or anything that discards user work.
5. Do not blindly run `git pull` while the worktree is dirty.
6. Fetch the remote first. Compare local `main` with `origin/main`.
7. If remote changes exist, safely reconcile them without losing current work. Prefer creating a dedicated branch from the current state and carefully incorporating remote changes.
8. Do not stage unrelated files such as temporary folders, nested repository copies, generated build output, or personal scratch files.
9. Before publishing, explicitly list the files that belong to this feature and stage only those files.

PRIMARY PRODUCT GOAL:
Preserve the existing adult training experience while adding a polished, inviting family mode designed for Josh and his young daughter Sylvie. The result must support shared play, short child-sized chess adventures, beginner puzzles and lessons, child-friendly accessibility, spoken guidance, and simple shared progress.

EXISTING WORK TO AUDIT FIRST:
- Family Play / Josh & Sylvie same-device mode may already exist.
- Knight Treasure Hunt may already exist.
- Navigation entries for Family Play and Adventure may already exist.
- Legal move highlighting and pass-and-play may already exist elsewhere.

Do not assume existing work is complete. Inspect it, test it, retain good parts, and finish or repair missing behavior.

FEATURE REQUIREMENTS:

1. FAMILY-FRIENDLY PASS-AND-PLAY
- Provide a dedicated, clearly named Family Play room for Josh and Sylvie.
- Use a large, unmistakable “Sylvie’s turn” / “Dad’s turn” banner.
- Use player names throughout the experience instead of relying only on White and Black.
- Do not show bot difficulty or engine controls in Family Play.
- Allow both colors to move legally on the same device.
- Clearly highlight legal moves and captures for the selected piece.
- Include accessible controls for:
  - New game
  - Undo
  - Swap colors
  - Flip board
  - Friendly questions on/off
- Ensure undo restores the correct player turn, board state, and last-move state.
- Ensure swap colors resets or transitions in a clear, intentional way.
- Add optional simple conversational prompts, including position-aware prompts where practical:
  - “What can Sylvie capture?”
  - “Is Dad’s king in check?”
  - “Who will protect the queen?”
  - “What do you think Dad might do next?”
- Handle check, checkmate, stalemate, draws, castling, en passant, and promotion correctly.
- Promotion must show a child-friendly piece chooser.
- The board must work well for touch input and must not overflow on mobile.
- Preserve adult Play mode behavior and Stockfish integration.

2. CHILD-SIZED CHESS ADVENTURES
- Keep and polish Knight Treasure Hunt.
- Knight Treasure Hunt must:
  - Teach the knight’s L-shaped move.
  - Use large visual targets.
  - Accept only legal knight jumps.
  - Give friendly feedback for a legal jump to the wrong square.
  - Celebrate successful targets.
  - Finish with a cheerful completion screen.
  - Include a “Read aloud” button using browser speech synthesis where supported.
  - Include a final prompt to set up the activity on a real chessboard.
  - Allow replay/reset without stale timers, speech, or state.
- Add at least three more complete five-minute adventures:
  - Rook Race: teach straight-line movement and optionally simple blockers.
  - Bishop Diagonal Trail: teach diagonal movement and square-color behavior.
  - Pawn Promotion Journey: teach forward movement, captures, and promotion in a simplified guided sequence.
- Create a reusable adventure structure only where it genuinely reduces duplication. Do not over-engineer.
- Add an Adventure menu that shows each activity, its purpose, completion state, and earned stars.
- Each adventure must use one short instruction at a time, large tap targets, cheerful feedback, read-aloud support, restart, and completion celebration.
- Ensure all movement rules taught by the adventures are correct.

3. BEGINNER-FRIENDLY PUZZLES AND LESSONS
- Add a distinct child-friendly learning area without weakening or replacing adult puzzles and lessons.
- Include beginner activities such as:
  - “What squares can the bishop reach?”
  - “Which pieces can the rook capture?”
  - “Can the knight fork two pieces?”
  - “Can you keep the king safe?”
  - A simple castling lesson
  - A simple trading-pieces lesson
  - A simple using-the-centre lesson
- Favor interaction, animation, concise cards, and spoken instructions over long text.
- Reward completion with stars, badges, or a visible progress bar.
- Use gentle feedback. Never shame or punish wrong moves.
- Use plain language such as “Try to keep your king safe.”
- Include reminders about taking turns, thinking calmly, and enjoying the process.
- Keep adult Puzzle, Learn, Watch, Roadmap, and Play rooms fully functional.

4. ACCESSIBILITY, TONE, AND CHILD-FRIENDLY VISUAL MODE
- Add a bright, child-friendly visual option while preserving the existing dark adult theme.
- Make theme switching obvious and persist the preference locally.
- Use larger readable type, large controls, and at least 48px touch targets for child-facing primary actions.
- Increase board and piece clarity. Prefer existing project patterns, but use clearer assets if Unicode pieces are not reliable enough.
- Add board flip/orientation support where relevant, especially Family Play.
- Add clear ARIA labels and keyboard focus states.
- Respect reduced-motion preferences for celebrations and animations.
- Speech synthesis must be optional, must fail gracefully, and must not create runtime errors.
- Cancel active speech when changing activity or leaving a child-facing room.
- Use positive, simple language throughout child-facing experiences.

5. SHARED FAMILY PROGRESS
- Add a simple family progress area based on stars, badges, or activity completion rather than Elo.
- Store progress locally with safe hydration behavior.
- Show progress for completed adventures and child-friendly puzzles/lessons.
- Make reset-progress behavior deliberate and protected from accidental clicks.
- Do not add accounts, a database, analytics, or unnecessary AI for this slice.
- Do not imply that stars, badges, or activities measure chess rating.

6. NAVIGATION AND PRODUCT CLARITY
- Make it obvious how to enter adult training versus family/child activities.
- Avoid overcrowded navigation at mobile widths.
- Preserve all existing routes or mode switching behavior unless a carefully tested improvement is required.
- Update README, product backlog, roadmap, and QA documentation to accurately describe the new features and limitations.

IMPLEMENTATION APPROACH:
1. Audit existing code and write a concise implementation plan before editing.
2. Work in major slices:
   A. Baseline and existing-feature hardening
   B. Family Play completion
   C. Adventure system and all four adventures
   D. Child puzzles and lessons
   E. Child theme, accessibility, speech, and board orientation
   F. Family progress and navigation polish
   G. Documentation and release
3. After each major slice:
   - Run the TypeScript/typecheck command.
   - Run focused automated tests.
   - Run the production build.
   - Start or reuse the local app and perform browser QA.
   - Check the browser console and failed network requests.
   - Test desktop and mobile layouts.
   - Fix every regression before beginning the next slice.
4. Add focused automated tests where the project lacks coverage:
   - Extract pure movement/progress helpers when useful.
   - Test knight, rook, bishop, and pawn adventure rules.
   - Test progress persistence parsing and reset behavior.
   - Test critical Family Play state transitions where practical.
5. Keep edits scoped and compatible with the current architecture.

QA REQUIREMENTS AFTER EVERY MAJOR SLICE:
- `npm.cmd run lint` on Windows, or the equivalent available command.
- Relevant focused tests.
- `npm.cmd run build`.
- `git diff --check`.
- Browser smoke test at `http://localhost:3000`.
- Check for runtime exceptions, hydration warnings, React warnings, and failed requests.
- Test at approximately 390px, 768px, and 1366px widths.
- Verify no horizontal overflow.
- Verify keyboard focus and touch target usability for new controls.
- Record completed checks and discovered/fixed bugs in the QA report.

MANDATORY END-TO-END ACCEPTANCE TESTS:

Family Play:
- Enter Family Play from navigation.
- Confirm no bot difficulty controls appear.
- Confirm correct named turn banner.
- Play legal White and Black moves on the same device.
- Confirm legal moves and captures highlight.
- Confirm illegal moves do not change state.
- Undo and confirm board and named turn restore correctly.
- Swap colors and confirm names/labels update.
- Flip the board and confirm interaction remains logically correct.
- Toggle friendly questions.
- Verify promotion chooser.
- Verify at least one check/checkmate or validated terminal-position flow.

Adventures:
- Open every adventure.
- Confirm movement targets are rule-correct.
- Try a wrong target and confirm friendly feedback.
- Complete every adventure.
- Confirm stars/progress update once without duplication.
- Replay/reset every adventure.
- Confirm read-aloud works when available and fails gracefully when unavailable.
- Confirm changing rooms cancels active speech/timers.

Child Learning:
- Complete each new child puzzle/lesson.
- Confirm wrong answers are gentle and do not corrupt state.
- Confirm progress and badges update.
- Reload and confirm progress persists.
- Reset progress through the protected reset flow.

Accessibility and responsive behavior:
- Switch between adult dark theme and child bright theme.
- Reload and confirm preference persists.
- Test keyboard navigation and visible focus.
- Test reduced-motion behavior.
- Confirm no overflow or unusably small controls at 390px.
- Confirm adult Play, Puzzles, Learn, Watch, Roadmap, and AI Review behavior still work.

RELEASE DOCUMENTATION:
- Update README with the family experience and local run/build instructions.
- Update `docs/PRODUCT_BACKLOG.md`.
- Update `docs/ROADMAP.md`.
- Update the appropriate QA report with:
  - Date
  - Environment
  - Commands run
  - Features tested
  - Bugs found and fixed
  - Remaining limitations
  - Vercel readiness

GITHUB AND VERCEL RELEASE:
1. Before staging, run `git status -sb` and inspect the final diff.
2. Exclude unrelated files and generated artifacts.
3. Ensure all required QA gates pass.
4. Confirm GitHub CLI exists and authentication is valid.
5. Safely incorporate the latest `origin/main` without losing work.
6. Commit the complete feature with a clear message such as:
   `Add complete family chess learning experience`
7. Push the finished work to GitHub.
8. Because the user explicitly wants the finished version deployed through Vercel, ensure the final approved changes land on the repository’s Vercel production branch, expected to be `main`.
9. If branch protection requires a pull request, open the PR, complete required checks, merge it, then verify `main` contains the commit.
10. Verify the Vercel deployment succeeds using the available Vercel/GitHub checks or deployment URL.
11. Smoke-test the deployed production site, including Family Play and all adventures.
12. Report:
   - Final commit SHA
   - GitHub branch/PR
   - Vercel deployment status and URL
   - Checks run
   - Any known limitations

Do not stop after writing a plan. Continue through implementation, QA, fixes, documentation, GitHub publishing, and Vercel production verification unless an external credential or permission issue makes further progress impossible.
```

---

## Prompt 1: Safely Pull Current State And Establish The Baseline

```text
Continue Grandmaster Path from the current repository state.

Repository:
- Local: C:\dev\Chess\github-current
- Remote: https://github.com/joshuaparris-max/Chess
- Production branch: main

First, protect existing work:
- Inspect `git status -sb`, current branch, remotes, recent commits, and the full diff.
- There may be uncommitted Family Play and Knight Treasure Hunt work. Preserve it exactly unless a tested fix is required.
- Never discard, reset, clean, or overwrite user changes.
- Fetch `origin`, compare local and remote main, and safely incorporate current remote work without losing local changes.
- Create a sensible feature branch if needed.
- Identify unrelated/untracked files that must not be included.

Then establish a baseline:
- Read the app architecture and relevant documentation.
- Audit Family Play, Knight Treasure Hunt, navigation, chessboard behavior, theme, local persistence, and existing adult modes.
- Run typecheck, current tests, production build, `git diff --check`, and a browser smoke test.
- Test at 390px, 768px, and 1366px.
- Record baseline failures and current partially completed features.

Produce a concise implementation plan grouped into major slices, then proceed immediately into the first implementation slice. Do not stop after planning.
```

---

## Prompt 2: Finish And Harden Family Play

```text
Fully finish the Family Play experience for Josh and Sylvie while preserving adult Play mode.

Start by inspecting the existing `FamilyPlay` implementation and shared `ChessBoard`. Retain good existing work.

Required behavior:
- Large named turn banner: “Sylvie’s turn” / “Dad’s turn”.
- Both players move on one device with all chess rules enforced by chess.js.
- No bot/engine difficulty controls.
- Clear legal-move and capture highlighting.
- Controls: New game, Undo, Swap colors, Flip board, Friendly questions.
- Player names used throughout.
- Friendly prompts are short, positive, and position-aware where practical.
- Correct undo behavior after any normal move and pending promotion.
- Correct handling for check, checkmate, stalemate, draw, castling, en passant, and promotion.
- Child-friendly promotion chooser.
- Mobile-safe board with large touch controls.
- Accessible labels, visible focus, and keyboard operation.

Add board orientation support without breaking existing board consumers. Prefer a backward-compatible prop or shared helper.

After implementation:
- Add focused tests for any extracted pure state/orientation helpers.
- Run typecheck, tests, production build, and `git diff --check`.
- Browser-test the complete Family Play acceptance path at desktop and mobile widths.
- Check console/network errors.
- Fix all failures before continuing.
- Update QA notes for this slice.
```

---

## Prompt 3: Build The Complete Child Adventure Suite

```text
Build a polished child Adventure area, starting from the existing Knight Treasure Hunt.

Required adventures:
1. Knight Treasure Hunt
2. Rook Race
3. Bishop Diagonal Trail
4. Pawn Promotion Journey

Requirements for every adventure:
- One short instruction at a time.
- Large board, pieces, targets, and touch controls.
- Rule-correct legal movement.
- Friendly wrong-target feedback with no state corruption.
- Cheerful success feedback and final celebration.
- Read-aloud using browser speech synthesis when available.
- Graceful fallback when speech is unavailable.
- Restart/replay support.
- Final prompt to try the activity on a real chessboard.
- Correct cleanup of speech, timers, and temporary effects when resetting or navigating away.
- Respect reduced-motion preferences.

Add an Adventure menu showing each activity, what it teaches, earned stars, and completion state.

Use a small reusable adventure shell only if it meaningfully removes duplication. Keep movement-rule helpers pure and testable.

Add focused automated tests for:
- Knight legal jumps.
- Rook straight-line movement and blockers.
- Bishop diagonal movement and blockers.
- Pawn forward movement, captures, and promotion flow.
- Completion and replay behavior where practical.

After this slice:
- Run typecheck, all focused tests, production build, and `git diff --check`.
- Browser-test every wrong-target, success, completion, replay, and read-aloud path.
- Test mobile and desktop layouts.
- Check console/network errors.
- Fix all failures before continuing.
- Update QA notes.
```

---

## Prompt 4: Add Child Puzzles, Lessons, And Shared Progress

```text
Add a distinct child-friendly learning area while preserving the existing adult Puzzle and Learn rooms.

Implement interactive child activities covering at least:
- What squares can the bishop reach?
- Which pieces can the rook capture?
- Can the knight fork two pieces?
- Can you keep the king safe?
- Simple castling.
- Simple trading pieces.
- Simple use of the centre.

Experience requirements:
- Minimal reading and plain language.
- One instruction at a time.
- Optional read-aloud.
- Gentle wrong-answer feedback.
- Stars, badges, or a visible progress bar.
- Calm reminders such as “Take a breath and look again.”
- No Elo or rating implication.

Implement shared family progress:
- Store completed adventures and child activities locally.
- Use safe client-side hydration.
- Prevent duplicate rewards for repeatedly completing the same activity.
- Show progress clearly in a Family Progress view.
- Add a deliberate protected reset-progress flow.
- Do not add accounts, databases, analytics, or unnecessary AI.

Add tests for progress parsing, persistence, deduplication, and reset behavior.

After this slice:
- Run typecheck, tests, production build, and `git diff --check`.
- Complete every new activity in the browser.
- Verify progress persists after reload and reset works safely.
- Test mobile and desktop layouts.
- Check console/network errors.
- Fix all failures before continuing.
- Update QA notes.
```

---

## Prompt 5: Complete Child Theme, Accessibility, And Navigation

```text
Polish Grandmaster Path so adult training and family learning are both clear, accessible, and inviting.

Implement:
- A bright child-friendly visual theme while retaining the adult dark theme.
- An obvious theme switch with locally persisted preference.
- Larger child-facing typography and controls.
- Minimum 48px primary touch targets.
- Strong board/piece contrast.
- Visible keyboard focus states.
- Useful ARIA labels.
- Reduced-motion support for celebrations and transitions.
- Speech cancellation when leaving activities.
- Clear navigation grouping that separates adult training from family/child activities without overcrowding mobile.
- Board flip/orientation support where relevant.

Review all child-facing copy and simplify intimidating or adult-centric language. Preserve accurate adult-facing language in adult modes.

Regression-test all existing adult areas:
- Play and Stockfish/fallback behavior.
- Puzzles.
- Learn.
- Watch.
- Roadmap.
- Post-game AI review surfaces.
- Local daily goal and streak.

After this slice:
- Run typecheck, all tests, production build, and `git diff --check`.
- Browser-test both themes, persistence, keyboard focus, reduced motion, and responsive navigation.
- Check 390px, 768px, and 1366px widths.
- Confirm no horizontal overflow.
- Check console/network errors.
- Fix all failures before continuing.
- Update QA notes.
```

---

## Prompt 6: Final QA, GitHub Publish, And Vercel Production Verification

```text
Prepare and publish the completed Grandmaster Path family experience.

Do not implement new scope unless required to fix a release-blocking issue.

Final repository review:
- Inspect `git status -sb`, branch, remotes, and full diff.
- Confirm only intended feature, test, and documentation files will be published.
- Exclude unrelated scratch files, nested repositories, generated output, and personal configuration.
- Safely reconcile with the latest `origin/main` without losing work.

Run the full release gate:
- Clean dependency install if needed.
- Typecheck/lint.
- All automated tests.
- Production build.
- `git diff --check`.
- Local production-server smoke test.
- Browser QA at 390px, 768px, and 1366px.
- Check console errors, hydration warnings, failed requests, overflow, focus states, and touch targets.

Mandatory final scenarios:
- Family Play legal alternating moves, undo, swap colors, flip board, friendly questions, and promotion.
- Complete Knight, Rook, Bishop, and Pawn adventures.
- Wrong-target feedback and replay for every adventure.
- Read-aloud availability and graceful fallback.
- Complete child puzzles/lessons.
- Verify family progress persists and protected reset works.
- Verify child/adult theme persistence.
- Verify existing adult modes remain functional.

Documentation:
- Update README, product backlog, roadmap, and QA report.
- Clearly list known limitations and Vercel readiness.

Publish:
- Verify `gh` is installed and authenticated.
- Stage only intended files.
- Commit with a clear message such as `Add complete family chess learning experience`.
- Push to GitHub.
- Ensure the final approved commit lands on the Vercel production branch, expected to be `main`.
- If branch protection requires a pull request, create it, satisfy checks, merge it, and confirm main contains the commit.
- Verify the Vercel production deployment succeeds.
- Open and smoke-test the deployed production URL.

Final report:
- Summarize implemented features.
- List checks and QA scenarios passed.
- Provide final commit SHA.
- Provide GitHub branch and PR link if applicable.
- Provide Vercel deployment status and production URL.
- List any remaining known limitations.

Do not stop before GitHub publishing and Vercel verification unless blocked by missing credentials, permissions, or an external service failure. If blocked, report the exact blocker and preserve the completed local work.
```

