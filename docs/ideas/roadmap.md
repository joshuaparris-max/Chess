Grandmaster Path — Coder Roadmap
Goal: Fun family chess app for Josh, Sylvie, Elias and nephews. No accounts. No backend. localStorage only.  
Stack assumed: Next.js + TypeScript + Tailwind + chess.js + Stockfish (existing)  
Repo: https://chess-kappa-five.vercel.app/play
---
How to use this roadmap
Each feature is one self-contained ticket. Give the vibe coder one ticket at a time. Each ticket has:
What it is
Files to create or edit
Exact data shape (what goes in localStorage)
Vibe-coder prompt (paste this in)
Done when (acceptance criteria)
Never do two tickets at once. Commit after each one passes.
---
PHASE 1 — Make Sylvie light up
---
Ticket 1.1 — Fairy Piece Set
What it is: A new SVG piece style option called "Fairy" selectable from the existing piece-set picker. Queen = winged fairy, King = fairy king with crown, Pawns = flower sprites, Rooks = mushroom towers, Knights = unicorns, Bishops = wands.
Files to edit:
`components/chess/ChessBoard.tsx` — add `"fairy"` to the piece style type union
`lib/chess/pieceStyles.ts` (or wherever piece SVGs are mapped) — add fairy SVG paths
`components/ui/PieceStylePicker.tsx` — add Fairy option with a preview
Data shape: Already handled by existing piece style setting in localStorage. No new storage needed.
SVG approach: Use inline SVG components per piece. Keep them simple — 40×40 viewBox, flat pastel colours, no gradients. Example palette: `#f9a8d4` (pink), `#86efac` (green), `#fde68a` (yellow).
Vibe-coder prompt:
```
In my Next.js chess app, I have a piece style picker that currently supports "standard" and one or two other styles. Add a new "Fairy" piece style. 

Create a file at `lib/chess/fairyPieces.tsx` that exports one React component per piece (WhiteQueen, BlackQueen, WhitePawn, BlackPawn, WhiteKing, BlackKing, WhiteRook, BlackRook, WhiteKnight, BlackKnight, WhiteBishop, BlackBishop). 

Each component returns a simple inline SVG at 40×40. Use these designs:
- Queen/King: crown + wings shape, pink (#f9a8d4) fill
- Pawns: flower with circular head, green (#86efac) fill
- Rooks: mushroom cap shape, yellow (#fde68a) fill  
- Knights: simple unicorn horn on a horse head, purple (#c4b5fd) fill
- Bishops: magic wand with star tip, blue (#93c5fd) fill

Wire these into the existing piece renderer so selecting "Fairy" in the piece style picker uses these SVGs instead of the standard pieces. The picker should show a small fairy queen icon as the preview for this option.

Do not break the existing Standard piece style. Test by switching styles mid-game.
```
Done when:
Fairy option appears in piece style picker
All 12 piece types render correctly on the board
Switching to Fairy mid-game works without refresh
Switching back to Standard works
No TypeScript errors
---
Ticket 1.2 — Fairy Garden Board Theme
What it is: A new board colour theme called "Fairy Garden". Light squares = `#fdf4ff` (pale lavender), dark squares = `#e879f9` (soft magenta). Board border = `#f0abfc`. Optional: 6 small CSS flower/sparkle decorations in the board corners using pure CSS, no images.
Files to edit:
`lib/chess/boardThemes.ts` — add `fairyGarden` theme object
`components/chess/ChessBoard.tsx` — apply theme colours
`components/ui/BoardThemePicker.tsx` — add Fairy Garden option
Data shape:
```ts
// Add to existing board theme type
{ id: "fairyGarden", name: "Fairy Garden", light: "#fdf4ff", dark: "#e879f9", border: "#f0abfc" }
```
Vibe-coder prompt:
```
My chess app has a board theme picker with colour options for light and dark squares. Add a new theme called "Fairy Garden" with:
- Light squares: #fdf4ff
- Dark squares: #e879f9  
- Board border: #f0abfc
- Theme name displayed as "🌸 Fairy Garden"

Add it to the theme picker alongside existing options. Also add a subtle CSS animation to the board wrapper when this theme is active: 4 small ✨ emoji or CSS sparkle shapes positioned at the four corners of the board, gently pulsing with a CSS keyframe animation (opacity 0.4 → 1 → 0.4, 2s loop). These should be purely decorative and not affect board interaction.

Do not change any existing themes. Test on mobile that the sparkles don't overflow the board container.
```
Done when:
Fairy Garden appears in theme picker
Correct colours render on all 64 squares
Sparkle animation plays without layout shift
Existing themes unchanged
---
Ticket 1.3 — Magical Capture Sounds
What it is: Web Audio API sound effects triggered on chess events. No external audio files — all sounds generated via oscillators.
Sound design:
Pawn move: short soft pop (sine wave, 300hz, 80ms)
Piece move (non-pawn): gentle chime (triangle wave, 520hz, 150ms)
Capture: sparkle burst (sine wave sweep 400→800hz, 200ms)
Check: warning tone (square wave, 220hz, 300ms)
Checkmate: victory fanfare (three ascending tones: 400, 500, 600hz, 150ms each)
Fairy theme only: Queen move gets an extra sparkle layer
Files to create/edit:
`lib/audio/chessSounds.ts` — create AudioContext singleton + all sound functions
`components/chess/GameShell.tsx` — call sound functions on move events
Settings: add "Sound effects" toggle (default ON), stored in localStorage as `chessSounds: boolean`
Vibe-coder prompt:
```
Add sound effects to my chess app using only the Web Audio API (no audio files, no external libraries).

Create `lib/audio/chessSounds.ts` that exports:
- `initAudio()` — creates and returns a shared AudioContext (call on first user interaction)
- `playPawnMove()` — soft pop: sine wave, 300hz, 80ms, gain 0.3
- `playPieceMove()` — gentle chime: triangle wave, 520hz, 150ms, gain 0.25
- `playCapture()` — sparkle: sine wave sweep from 400hz to 800hz over 200ms, gain 0.35
- `playCheck()` — warning: square wave, 220hz, 300ms, gain 0.2
- `playCheckmate()` — fanfare: three sine tones (400hz, 500hz, 600hz) each 150ms sequential, gain 0.4

In the game component, call the right function after each move based on what happened (use chess.js flags: 'c' = capture, '+' = check, '#' = checkmate, otherwise pawn vs piece by piece type).

Add a sound toggle in the settings panel. Store the preference in localStorage as `chessSounds`. Default to true. When false, all sound functions are no-ops.

AudioContext must be created on first user gesture (click/tap), not on page load, to avoid browser autoplay policy errors.
```
Done when:
Sounds play correctly for move, capture, check, checkmate
No sounds play before user interaction
Toggle in settings works and persists across refresh
No errors in browser console
---
Ticket 1.4 — Princess Story Mode (3 Chapters)
What it is: A new route `/story` with 3 self-contained story chapters. Each chapter has: illustrated title card → story text → chess challenge → animated success → unlock next chapter.
Route: `/app/story/page.tsx` and `/app/story/[chapter]/page.tsx`
Chapter designs:
```
Chapter 1 — "The Stolen Crown"
Story: The Shadow King has stolen the Fairy Queen's crown! 
       The brave knight must jump over the castle wall.
Challenge: White Knight on g1. Move it to f3 in one move.
           (Teaches: how knights move)
Reward: 🌸 Rose sticker unlocked

Chapter 2 — "The Enchanted Forest"  
Story: The path through the forest is blocked by shadow pawns.
       Only the fairy bishops can light the way.
Challenge: White Bishop on c1. Capture the black pawn on f4.
           (Teaches: how bishops move + capture)
Reward: 🦋 Butterfly sticker unlocked

Chapter 3 — "The Shadow King's Castle"
Story: The Fairy Queen has been found! Give checkmate to free her.
Challenge: Load FEN: 4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1
           Find checkmate in 1 (Qe8#)
           (Teaches: checkmate concept)
Reward: 👑 Crown sticker unlocked + "Story Complete!" screen
```
Data shape:
```ts
// localStorage key: "storyProgress"
{
  chaptersComplete: number[], // e.g. [1, 2]
  stickersEarned: string[]    // e.g. ["rose", "butterfly"]
}
```
Files to create:
`app/story/page.tsx` — chapter select screen showing 3 chapters with lock/unlock state
`app/story/[chapter]/page.tsx` — story + challenge view
`components/story/StoryCard.tsx` — title card with emoji illustration and story text
`components/story/ChessChallenge.tsx` — minimal board with the specific position loaded
`components/story/SuccessScreen.tsx` — celebration with sticker earned
`lib/story/chapters.ts` — chapter data (story text, FEN, solution move, reward)
Navigation: Add "Princess Story 👑" link to main nav or home page.
Vibe-coder prompt:
```
Add a Princess Story Mode to my Next.js chess app at the route /story.

Create the chapter data file at `lib/story/chapters.ts`:

```ts
export const chapters = [
  {
    id: 1,
    title: "The Stolen Crown",
    story: "The Shadow King has stolen the Fairy Queen's crown! The brave knight must jump over the castle wall to begin the rescue.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    instruction: "Move the White Knight from g1 to f3.",
    solutionMove: { from: "g1", to: "f3" },
    rewardEmoji: "🌸",
    rewardName: "Rose"
  },
  {
    id: 2,
    title: "The Enchanted Forest",
    story: "The path through the enchanted forest is blocked! Only the fairy bishop can light the way through.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    instruction: "Move the White Bishop from c1 to capture the black pawn on f4. Wait — first move a pawn to open the diagonal! Move pawn from e2 to e4, then bishop from f1 to... actually: move pawn e2-e4 to start.",
    solutionMove: { from: "e2", to: "e4" },
    rewardEmoji: "🦋",
    rewardName: "Butterfly"
  },
  {
    id: 3,
    title: "The Shadow King's Castle",
    story: "The Fairy Queen is inside the castle! One magical move will set her free forever.",
    fen: "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1",
    instruction: "Move the White Queen to give checkmate and free the Fairy Queen!",
    solutionMove: { from: "e2", to: "e8" },
    rewardEmoji: "👑",
    rewardName: "Crown"
  }
]
```
Create `app/story/page.tsx` — a chapter select screen showing 3 large cards. Each card shows the chapter emoji, title, and either "Play" (if unlocked) or a lock icon. Chapter 1 is always unlocked. Chapter 2 unlocks after chapter 1 complete. Chapter 3 unlocks after chapter 2 complete. Read progress from localStorage key "storyProgress".
Create `app/story/[chapter]/page.tsx` — the chapter experience:
Story card: big emoji, chapter title, story text in a friendly font
"Start Challenge" button
Chess board with the chapter FEN loaded (use the existing ChessBoard component)
Instruction text below the board
When the player makes the correct move (match solutionMove from+to), show a success screen
Success screen: big reward emoji bouncing, "You earned the [name] sticker!", "Next Chapter" or "Back to Stories" button
On success, update localStorage storyProgress
Style it warmly — soft pink/purple background, rounded cards, large friendly text suitable for a young child.
Add a "Princess Story 👑" link to the main navigation.
```

**Done when:**
- `/story` shows 3 chapter cards with correct lock/unlock state
- Each chapter loads correct FEN on the board
- Correct move triggers success screen
- Sticker reward displays
- Progress persists across refresh
- Next chapter unlocks correctly after completing previous
- Works on mobile (large tap targets, readable text)

---

# PHASE 2 — Keep kids coming back

---

## Ticket 2.1 — Sticker Book

**What it is:** A `/stickers` page showing a grid of 20 sticker slots. Stickers earned from Story Mode and puzzle completions fill in slots. Unearned stickers show as grey outlines.

**Files to create:**
- `app/stickers/page.tsx`
- `lib/stickers/stickerCatalog.ts` — all 20 sticker definitions
- `lib/stickers/awardSticker.ts` — call this from story/puzzle completion

**Data shape:**
```ts
// localStorage key: "earnedStickers"
string[] // array of sticker IDs e.g. ["rose", "butterfly", "crown"]

// stickerCatalog.ts
export const stickers = [
  { id: "rose", emoji: "🌸", name: "Rose", hint: "Complete Chapter 1" },
  { id: "butterfly", emoji: "🦋", name: "Butterfly", hint: "Complete Chapter 2" },
  { id: "crown", emoji: "👑", name: "Crown", hint: "Complete Chapter 3" },
  { id: "star", emoji: "⭐", name: "Star", hint: "Solve 5 puzzles" },
  { id: "heart", emoji: "💜", name: "Heart", hint: "Play 3 games" },
  { id: "rainbow", emoji: "🌈", name: "Rainbow", hint: "Win a game" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn", hint: "Use fairy pieces" },
  { id: "magic", emoji: "✨", name: "Magic", hint: "Find a checkmate" },
  // ... fill remaining 12 with fun emoji
]
```
Vibe-coder prompt:
```
Add a Sticker Book page at /stickers.

Create `lib/stickers/stickerCatalog.ts` with 20 sticker objects: { id, emoji, name, hint }. First three are rose 🌸, butterfly 🦋, crown 👑. Fill the rest with fun emojis like ⭐ 💜 🌈 🦄 ✨ 🎀 🌺 🍄 🌙 🎠 🏰 🐉 🌟 🎪 🦚 🎭 🎨.

Create `lib/stickers/awardSticker.ts` that exports `awardSticker(id: string)` — reads "earnedStickers" from localStorage, adds the id if not already present, saves back.

Create `app/stickers/page.tsx` showing a 4-column grid of sticker cards. Earned stickers show the emoji large (text-5xl) with the sticker name below. Unearned stickers show a grey circle with a ? and the hint text below in small grey text.

At the top show "X / 20 stickers collected" in a friendly heading.

Style with soft pink/purple colours to match story mode.

Add "Sticker Book 📚" to the main navigation.

Also call awardSticker("rose") at the end of Story Chapter 1 success screen (and butterfly/crown for chapters 2 and 3).
```
Done when:
Sticker book shows 20 slots
Earned stickers show emoji + name
Unearned show grey ? + hint
Counter at top is accurate
Story mode awards stickers correctly
Persists across refresh
---
Ticket 2.2 — Bedtime Mode
What it is: A toggle in settings. When on: soft dark purple theme, board colours change to muted navy/lavender, all text goes cream, sounds get quieter, default time control becomes 10+0.
Files to edit:
`components/ui/SettingsPanel.tsx` — add Bedtime Mode toggle
`app/layout.tsx` or root CSS — add `data-bedtime="true"` to `<body>` + CSS vars
`lib/chess/boardThemes.ts` — add bedtime board colours
`lib/audio/chessSounds.ts` — halve gain values when bedtime mode active
Data shape:
```ts
// localStorage key: "bedtimeMode"
boolean
```
CSS vars for bedtime mode:
```css
[data-bedtime="true"] {
  --bg-primary: #1e1b4b;
  --bg-secondary: #312e81;
  --text-primary: #ede9fe;
  --text-secondary: #c4b5fd;
  --accent: #7c3aed;
}
```
Vibe-coder prompt:
```
Add a Bedtime Mode toggle to my chess app settings.

Store the preference in localStorage as "bedtimeMode" (boolean, default false).

When bedtime mode is active:
1. Add data-bedtime="true" to the document body
2. Apply these CSS custom property overrides to create a soft dark purple theme:
   --bg-primary: #1e1b4b
   --bg-secondary: #312e81  
   --text-primary: #ede9fe
   --text-muted: #c4b5fd
3. Switch the board to a muted theme: dark squares #4c1d95, light squares #ede9fe
4. Reduce all Web Audio gain values by 50%
5. If a time control hasn't been explicitly set this session, default to 10+0

Add a 🌙 Bedtime Mode toggle to the settings panel with a moon icon. Show "Sweet dreams mode" as the label. Toggle persists across refresh.

The toggle should work immediately without page reload.
```
Done when:
Toggle in settings applies theme instantly
Board colours change
Sounds are quieter
Persists across refresh
Toggle off restores normal theme
---
Ticket 2.3 — Emoji Reactions
What it is: In pass-and-play mode (2 player), show a row of 8 emoji buttons below the board. Tapping one shows a large floating emoji animation above the board for 2 seconds then fades.
Emojis: 👏 🎉 😮 🤔 😄 🙈 ❤️ ⭐
Files to edit:
`components/chess/GameShell.tsx` — add emoji bar below board in 2-player mode
`components/chess/EmojiReaction.tsx` — create floating animation component
Vibe-coder prompt:
```
In pass-and-play (2-player) mode in my chess app, add an emoji reaction bar below the chess board.

Create `components/chess/EmojiReaction.tsx` — a component that takes an emoji prop and animates it: appears at board centre, floats upward 60px over 1.5 seconds, then fades out. Use CSS keyframes. Only one emoji shows at a time (new one replaces existing).

In GameShell.tsx, detect when mode is "pass-and-play" (or equivalent). When true, render a row of 8 emoji buttons below the board: 👏 🎉 😮 🤔 😄 🙈 ❤️ ⭐

Each button is a large touchable area (min 44×44px) with the emoji at text-2xl. Tapping triggers the EmojiReaction animation. No text labels needed.

Style the bar with a soft border-top, padding 8px, centred flex row with gap-3.
```
Done when:
Emoji bar only shows in pass-and-play mode
Tapping emoji shows floating animation
Animation plays once and disappears
Works on mobile touch
---
Ticket 2.4 — Parent Report Card
What it is: A `/report` page showing this week's activity pulled from localStorage. Shows puzzles solved, games played, win rate, and which stickers were earned this week.
Files to create:
`app/report/page.tsx`
`lib/stats/weeklyStats.ts` — reads and aggregates localStorage data
Data this reads: game archive, puzzle attempts, earnedStickers (with timestamps)
Vibe-coder prompt:
```
Create a Parent Report Card page at /report.

It reads from localStorage and shows a weekly summary (last 7 days):

1. "This Week" heading with the date range
2. Stat cards in a 2×2 grid:
   - Games Played (count)
   - Puzzles Solved (count)  
   - Win Rate (% of games won)
   - Stickers Earned (count this week)
3. A "Highlights" section listing any stickers earned this week with their emoji and name
4. A "Keep going!" encouragement message

Create `lib/stats/weeklyStats.ts` that exports `getWeeklyStats()`. It should:
- Read the game archive from localStorage (key: whatever the existing game history uses)
- Read puzzle attempts from localStorage
- Filter to last 7 days using timestamps
- Return { gamesPlayed, puzzlesSolved, winRate, newStickers }

If there's no timestamp on existing records, note that in the UI gracefully ("Stats tracked from today onwards").

Style the page cleanly — white cards, green accent colour, suitable for a parent to glance at. Add a print button that calls window.print().

Add "📊 Report" to the navigation (can be subtle, small link in footer).
```
Done when:
Report page loads without errors
Stats reflect actual localStorage data
Print button works
Handles empty state gracefully (no data yet)
---
PHASE 3 — Hook Josh and the nephews
---
Ticket 3.1 — XP and Levelling
What it is: XP earned for games and puzzles. 4 levels displayed as a badge in the nav.
Levels:
```
0–99 XP      → Pawn ♟
100–299 XP   → Knight ♞
300–699 XP   → Bishop ♝
700–1499 XP  → Rook ♜
1500–2999 XP → Queen ♛
3000+ XP     → Grandmaster ⭐
```
XP awards:
```
Complete a puzzle: +10 XP
Solve puzzle first try: +5 bonus XP
Win a game vs bot: +25 XP
Complete a story chapter: +30 XP
Play any game (finish): +10 XP
```
Data shape:
```ts
// localStorage key: "playerProgress"
{
  xp: number,
  level: string,
  gamesPlayed: number,
  puzzlesSolved: number
}
```
Files to create/edit:
`lib/progression/xp.ts` — `awardXP(amount, reason)`, `getLevel(xp)`, `getProgress()`
`components/ui/XpBadge.tsx` — level icon + XP bar shown in nav
Wire into: puzzle completion, game end, story chapter complete
Vibe-coder prompt:
```
Add an XP and levelling system to my chess app. No accounts — all localStorage.

Create `lib/progression/xp.ts` with:

```ts
export const LEVELS = [
  { name: "Pawn", symbol: "♟", minXp: 0 },
  { name: "Knight", symbol: "♞", minXp: 100 },
  { name: "Bishop", symbol: "♝", minXp: 300 },
  { name: "Rook", symbol: "♜", minXp: 700 },
  { name: "Queen", symbol: "♛", minXp: 1500 },
  { name: "Grandmaster", symbol: "⭐", minXp: 3000 },
]

export function awardXP(amount: number, reason: string): void
// Reads "playerProgress" from localStorage, adds XP, saves back
// Also logs { amount, reason, timestamp } to "xpHistory" array (max 50 entries)

export function getLevel(xp: number): typeof LEVELS[0]
// Returns the highest level the XP qualifies for

export function getPlayerProgress(): { xp: number, level: string, symbol: string, nextLevelXp: number, progressPercent: number }
```
Create `components/ui/XpBadge.tsx` — a compact badge for the nav showing:
The level symbol (large)
Level name
A thin XP progress bar (coloured, shows % to next level)
On hover/tap: shows "X XP — Y XP to next level"
XP awards (call awardXP in these places):
Puzzle solved: +10 XP (find where puzzle completion is handled)
Puzzle solved first try: +5 bonus
Game completed vs bot: +10 XP
Game won vs bot: +25 XP total (so +15 bonus for win)
Story chapter complete: +30 XP
Show a toast notification when XP is awarded: "+10 XP — Puzzle solved!" using the existing toast system or a simple fixed-position div that fades after 2 seconds.
Show a level-up modal when the player crosses a level threshold: big symbol, "You reached Knight!" with a brief celebration.
Add XpBadge to the main navigation header.
```

**Done when:**
- XP awards on all specified events
- Level badge shows correctly in nav
- XP bar fills as XP increases
- Level-up modal triggers at correct thresholds
- Toast shows on XP award
- All persists across refresh

---

## Ticket 3.2 — Quest Log

**What it is:** A daily quest panel (sidebar or modal) showing 3 quests that reset at midnight.

**Daily quest pool (randomly pick 3 per day):**
```
"Play any game" — Play 1 game → +15 XP
"Win a game" — Beat the bot → +30 XP
"Puzzle solver" — Solve 3 puzzles → +25 XP
"Speed chess" — Finish a 5-minute game → +20 XP
"First try" — Solve a puzzle on first attempt → +20 XP
"Checkmate hunter" — Win by checkmate (not resign) → +25 XP
"Night owl" — Play in bedtime mode → +15 XP
"Story time" — Complete a story chapter → +30 XP
```

**Data shape:**
```ts
// localStorage key: "dailyQuests"
{
  date: string, // "2026-06-15"
  quests: [
    { id: string, title: string, description: string, xpReward: number, progress: number, required: number, complete: boolean }
  ]
}
```
Vibe-coder prompt:
```
Add a Daily Quest system to my chess app.

Create `lib/quests/dailyQuests.ts`:

Define a pool of 8 possible quests (objects with id, title, description, xpReward, required count). Each day, deterministically pick 3 quests using the date as a seed (so the same 3 show all day even on refresh). Store in localStorage as "dailyQuests" with today's date. If stored date !== today, regenerate.

Quest tracking: each quest has a progress counter. Increment the right quest when the matching game event occurs (listen to the same places where XP is awarded — puzzle solved, game won, etc).

When a quest completes: award the XP via awardXP(), mark it complete, show a toast "Quest complete! +25 XP 🎉".

Create `components/ui/QuestLog.tsx` — a panel showing today's 3 quests as cards:
- Quest title (bold)
- Description
- Progress bar (e.g. "2 / 3 puzzles")
- XP reward badge
- Green checkmark when complete

Add a 📜 Quest Log button to the nav that opens the panel as a slide-in drawer or modal. Show a notification dot on the button when quests are available and incomplete.
```
Done when:
3 quests appear daily, same ones all day
Progress increments correctly on matching events
Completion awards XP and shows toast
Quest log accessible from nav
Resets correctly at midnight (new day = new quests)
---
Ticket 3.3 — Loot Drops
What it is: After winning a game, show a chest-opening animation. Randomly award one cosmetic from a pool. Cosmetics are board themes and piece styles (not pay-to-win, purely visual).
Loot pool:
```ts
const lootPool = [
  { id: "theme_ocean", type: "board_theme", name: "Ocean Theme", emoji: "🌊" },
  { id: "theme_forest", type: "board_theme", name: "Forest Theme", emoji: "🌲" },
  { id: "theme_sunset", type: "board_theme", name: "Sunset Theme", emoji: "🌅" },
  { id: "theme_midnight", type: "board_theme", name: "Midnight Theme", emoji: "🌙" },
  { id: "sticker_dragon", type: "sticker", name: "Dragon", emoji: "🐉" },
  { id: "sticker_castle", type: "sticker", name: "Castle", emoji: "🏰" },
  { id: "sticker_gem", type: "sticker", name: "Gem", emoji: "💎" },
  // Only award items not already owned
]
```
Vibe-coder prompt:
```
Add loot drops to my chess app. When the player wins a game against the bot, show a chest-opening sequence and award a random cosmetic.

Create `lib/loot/lootSystem.ts`:
- Define the loot pool array (board themes and stickers as above)
- Export `getRandomLoot(ownedIds: string[])` — picks a random item the player doesn't already own. If they own everything, return a "bonus XP" reward.
- Export `awardLoot(item)` — saves to localStorage "ownedCosmetics" string array

Create `components/ui/LootModal.tsx`:
- Triggered after a bot game win
- Shows a chest emoji (🎁) that "shakes" with a CSS animation for 1 second
- Player taps/clicks to open
- Reveals the item with big emoji, item name, "You unlocked [name]!"
- Close button or auto-close after 3 seconds
- If it's a board theme, add an "Apply now" button that sets it as active theme

Wire the loot modal into the game-over flow (after the existing result modal, or replace part of it).

Store board theme colours in `lib/chess/boardThemes.ts`:
- Ocean: light #e0f2fe, dark #0369a1
- Forest: light #dcfce7, dark #166534
- Sunset: light #fff7ed, dark #c2410c
- Midnight: light #1e1b4b, dark #4338ca
```
Done when:
Loot modal triggers on bot game win
Chest animation plays before reveal
Random item awarded from unowned pool
Item saved to localStorage
Board themes apply correctly
"Apply now" works for themes
---
Ticket 3.4 — Puzzle Rush
What it is: A new mode at `/puzzles/rush`. 3-minute countdown. Puzzles auto-advance on correct answer. Wrong answer costs 10 seconds. Score = correct puzzles. Personal best saved.
Files to create:
`app/puzzles/rush/page.tsx`
`components/puzzles/PuzzleRushHUD.tsx` — timer, score, streak display
Vibe-coder prompt:
```
Add a Puzzle Rush mode at /puzzles/rush.

The mode:
- 3:00 countdown timer (displayed large, turns red under 30 seconds)
- Puzzles load from the existing puzzle bank, starting easy and getting harder
- Correct first move: advance to next puzzle immediately, +1 score
- Wrong move: -10 seconds from timer, flash red, show correct move for 1.5 seconds, then advance
- Timer hits 0: game over screen

Game over screen shows:
- Final score (puzzles solved)
- Personal best (from localStorage "puzzleRushBest")
- If new PB: "New Personal Best! 🎉" celebration
- Time lost to mistakes
- "Play Again" and "Back to Puzzles" buttons

Create `components/puzzles/PuzzleRushHUD.tsx` — overlays the puzzle board with:
- Large timer top-left
- Score counter top-right  
- Current streak (consecutive correct) below score
- Thin XP progress bar at very top

Add a "⚡ Puzzle Rush" card to the puzzles page linking to /puzzles/rush.

The timer must use Date.now() intervals, not render-cycle counting, to stay accurate.
```
Done when:
Timer counts down accurately
Correct answer advances puzzle
Wrong answer deducts time and shows correct move briefly
Personal best saves and displays
Game over screen works
Mobile-friendly (large board, readable timer)
---
Ticket 3.5 — Puzzle Streak
What it is: At `/puzzles/streak`. Solve puzzles until you make one mistake. Track longest streak. Puzzles get harder every 5 correct.
Vibe-coder prompt:
```
Add a Puzzle Streak mode at /puzzles/streak.

Rules:
- Solve puzzles in a row
- One wrong first move ends the streak immediately
- Show the correct answer, then "Run over" screen
- Puzzles start at easiest difficulty, increase every 5 correct answers
- Track current streak and all-time best streak in localStorage "puzzleStreakBest"

Run-over screen:
- "Streak ended at X puzzles"
- All-time best
- "Study this position" button (keeps board loaded for analysis)
- "Try again" button

Add a "🔥 Streak" card to the puzzles page.

Show a flame counter above the board tracking current streak number. At streaks of 5, 10, 20, show a brief emoji burst animation (🔥🔥🔥).
```
Done when:
One wrong move ends streak
Correct answer auto-advances
Difficulty increases every 5 correct
Best streak saves and displays
Mobile friendly
---
PHASE 4 — DnD Flavour
---
Ticket 4.1 — Spell Slots (Daily Hints)
What it is: Replace unlimited hints/undos with 3 daily "spell slots" shown as potion icons. Resets at midnight.
Spells:
🔮 True Sight (was: Hint) — highlights best move square
⏪ Rewind (was: Undo) — takes back last move
🛡️ Shield — warns if your next move blunders a piece (one-time analysis)
Data shape:
```ts
// localStorage key: "spellSlots"
{ date: string, slots: { truesight: number, rewind: number, shield: number } }
// Each starts at 1 per day (or 3 shared, your call)
```
Vibe-coder prompt:
```
Replace the existing Hint and Undo buttons in my chess app with a Spell Slot system.

Create `lib/spells/spellSlots.ts`:
- 3 spell types: truesight (hint), rewind (undo), shield (blunder warning)
- Each player gets 1 use of each per day
- Stored in localStorage "spellSlots" with date; resets daily
- Export: getSlots(), useSpell(type: SpellType): boolean (returns false if no uses left)

Update the game UI to show 3 potion-style buttons instead of Hint/Undo:
- 🔮 True Sight — same as existing hint behaviour
- ⏪ Rewind — same as existing undo behaviour  
- 🛡️ Shield — new: when activated, run a quick Stockfish analysis on current position, if the player's last moved piece is now hanging, show a warning overlay "⚠️ Your [piece] is in danger!" for 2 seconds

Each button shows:
- The emoji
- Spell name
- "1 left" or "Used" below it
- Greyed out and unclickable when 0 uses remain

When a player tries to use a depleted spell: show tooltip "Spell recharges tomorrow ✨"

Keep the same chess logic underneath — only the UI and daily limit changes.
```
Done when:
3 spell buttons replace hint/undo
Each has 1 use per day
Resets at midnight
Shield spell gives basic blunder warning
Depleted spells show correctly
Existing hint/undo logic unchanged underneath
---
Ticket 4.2 — Boss Battles
What it is: A `/bosses` page with 5 named chess bots with monster personalities and health bars. Beating a boss unlocks a cosmetic.
Bosses:
```ts
const bosses = [
  { id: "goblin", name: "Goblin Snatcher", emoji: "👺", depth: 2, description: "Greedy and chaotic. Will grab any piece it can.", reward: "theme_forest", defeated: false },
  { id: "orc", name: "Orc Crusher", emoji: "👹", depth: 4, description: "Aggressive attacker. Always pushes pawns forward.", reward: "sticker_dragon", defeated: false },
  { id: "witch", name: "Chess Witch", emoji: "🧙", depth: 6, description: "Tricky and unpredictable. Loves forks.", reward: "theme_midnight", defeated: false },
  { id: "dragon", name: "Elder Dragon", emoji: "🐉", depth: 8, description: "Sacrifices pieces for brutal attacks.", reward: "sticker_gem", defeated: false },
  { id: "lich", name: "Ancient Lich", emoji: "💀", depth: 12, description: "The endgame master. Coldly efficient.", reward: "theme_midnight", defeated: false },
]
```
Vibe-coder prompt:
```
Add a Boss Battles page at /bosses.

Create `app/bosses/page.tsx` showing 5 boss cards in a grid. Each card shows:
- Boss emoji (large)
- Boss name
- Flavour description
- Difficulty indicator (1-5 skulls)
- "⚔️ Challenge" button
- If defeated: "✅ Defeated" badge + reward shown

Create `app/bosses/[bossId]/page.tsx` — a boss battle screen:
1. Show boss emoji + name in a header with a health bar (starts full, green→yellow→red)
2. Load the normal chess game but vs Stockfish at the boss's engine depth
3. The health bar is purely cosmetic — it represents (100 - material_disadvantage_percentage)
4. Update health bar after each move using material count (each pawn=1, knight/bishop=3, rook=5, queen=9)
5. Boss health = (boss material / starting material) * 100
6. On checkmate win: boss "explodes" (emoji does a spin animation), show "Boss Defeated!" modal with the unlocked cosmetic
7. On loss: "The [boss name] defeated you... try again?" with retry button

Store defeated bosses in localStorage "defeatedBosses" as string array of boss IDs.

Add "⚔️ Bosses" to the navigation.

Note: The health bar is visual flavour only. The actual chess game uses standard rules.
```
Done when:
5 bosses listed with correct info
Boss battle loads correct Stockfish depth
Health bar updates after moves
Win triggers celebration + cosmetic unlock
Defeated status persists
Loss allows retry
---
Ticket 4.3 — Character Sheet Profile
What it is: A `/profile` page styled like a DnD character sheet showing chess stats as "ability scores".
Stats to show:
```
Tactical Vision    — puzzles solved
Endgame Power      — games won  
Opening Knowledge  — unique openings played
Speed              — fastest checkmate (moves)
Wisdom             — XP total
Prestige           — level + symbol
```
Vibe-coder prompt:
```
Create a /profile page styled loosely like a D&D character sheet.

Read all data from localStorage (playerProgress, game archive, puzzle attempts, defeatedBosses, earnedStickers, ownedCosmetics).

Layout (single column, parchment-style feel with #fef9c3 background, dark brown text #713f12):

Header section:
- Large level symbol and name (from XP system)
- "Player since [date of first game]"
- Total XP with progress to next level

"Ability Scores" section — 6 stat boxes in a 2×3 grid (styled like D&D ability boxes):
- ⚔️ Tactical Vision: puzzles solved
- 🏰 Endgame Power: games won
- 📖 Opening Lore: (placeholder "Coming soon" for now)
- ⚡ Speed: fewest moves to checkmate (from game archive)
- 🧠 Wisdom: total XP
- 👑 Prestige: current level name

"Achievements" section — show earned stickers in a row

"Boss Record" section — list beaten bosses with their emoji

Add "📜 Profile" to the navigation.
```
Done when:
Profile page loads all real data from localStorage
All 6 stats show correct values
Stickers and bosses display
Page has the themed parchment look
Mobile friendly
---
PHASE 5 — Family Multiplayer
---
Ticket 5.1 — Family Leaderboard
What it is: A local leaderboard where each family member has a profile. No accounts. Just named local profiles stored in localStorage.
Data shape:
```ts
// localStorage key: "familyProfiles"
[
  { name: "Josh", emoji: "👨", xp: 450, gamesWon: 12, puzzlesSolved: 34 },
  { name: "Sylvie", emoji: "👧", xp: 120, gamesWon: 3, puzzlesSolved: 15 },
]
```
Vibe-coder prompt:
```
Add a Family Leaderboard at /family/leaderboard.

Create a profile switcher: on first visit, prompt "Who's playing?" with a simple name + emoji picker. Store the active profile in localStorage "activeProfile". Store all profiles in "familyProfiles".

The leaderboard page shows all family profiles ranked by XP in a table with columns: Rank, Name, Level, XP, Games Won, Puzzles Solved.

Add a "Switch Player" button that shows the profile switcher again (modal).

Add an "Add Player" button to create a new profile (just needs a name and emoji choice from a set of 10 options).

When a profile is active, all XP/quest/puzzle awards go to that profile's record.

Add "👨‍👩‍👧 Family" to the navigation.
```
Done when:
Profile switcher works
Multiple profiles can be created
Active profile receives XP
Leaderboard ranks correctly
Persists across refresh
---
Ticket 5.2 — Family Puzzle Duel
What it is: Two players on one device take turns solving the same puzzle. Whoever solves it first (or gets it right when the other doesn't) wins the round. First to 3 wins the duel.
Vibe-coder prompt:
```
Add a Family Puzzle Duel mode at /puzzles/duel.

Two-player mode, one device, alternating turns.

Setup screen: "Player 1" and "Player 2" enter names (or pick from family profiles). Choose number of rounds (3, 5, or 7).

Each round:
1. Load the same puzzle for both players
2. Player 1 attempts it first (Player 2 looks away / covers screen)
3. Show result: ✅ Solved or ❌ Missed
4. Player 2 attempts the same puzzle
5. Award round point: both solved = draw, one solved = that player's point, neither = no point

After all rounds: show winner with celebration, scores, "Play Again" and "Back to Puzzles".

Show a scoreboard at the top (P1: 2 — P2: 1) throughout the duel.

Note: this is fully local, no network needed.
```
Done when:
Setup screen works
Same puzzle loads for both players
Round scoring is correct
Final screen shows winner
Works entirely offline
---
Navigation and Housekeeping
Ticket 6.1 — Navigation Update
After all features are built, update the main nav to include all new routes cleanly.
Vibe-coder prompt:
```
Update the main navigation of my chess app to include all new pages.

Organise nav into sections or a clean dropdown:

Play section: Play, Pass & Play, Boss Battles ⚔️
Learn section: Puzzles, Puzzle Rush ⚡, Puzzle Streak 🔥, Puzzle Duel 👥
Story section: Princess Story 👑, Sticker Book 📚
Progress section: Profile 📜, Quest Log 📜, Family 👨‍👩‍👧

On mobile: hamburger menu that slides in a drawer with the same sections.

Keep the existing nav items working. Do not remove any existing routes.
```
---
Build Order Summary
Order	Ticket	Time estimate
1	1.1 Fairy Piece Set	2–3 hours
2	1.2 Fairy Garden Board	1 hour
3	1.3 Magical Sounds	1–2 hours
4	1.4 Princess Story Mode	3–4 hours
5	2.1 Sticker Book	1–2 hours
6	3.1 XP and Levelling	2–3 hours
7	3.4 Puzzle Rush	2 hours
8	3.5 Puzzle Streak	1 hour
9	3.2 Quest Log	2 hours
10	3.3 Loot Drops	2 hours
11	4.2 Boss Battles	3 hours
12	4.1 Spell Slots	1–2 hours
13	4.3 Character Sheet	2 hours
14	2.2 Bedtime Mode	1 hour
15	2.3 Emoji Reactions	1 hour
16	2.4 Parent Report Card	1–2 hours
17	5.1 Family Leaderboard	2 hours
18	5.2 Family Puzzle Duel	2 hours
19	6.1 Navigation	1 hour
Total estimate: ~35 hours of vibe-coding sessions
---
Rules for the vibe coder
One ticket at a time. Do not start ticket 1.2 until 1.1 passes its "Done when" criteria.
No accounts, no backend, no Supabase. Everything in localStorage.
Never remove existing chess functionality.
All new routes work on mobile (390px wide minimum).
No external audio files, fonts, or images. Use Web Audio API, system emoji, and CSS only.
Each ticket ends with: lint passes, no TypeScript errors, tested on mobile viewport.
Feature flags are optional — at this scale, just ship it.