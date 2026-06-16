# Grandmaster Path — Canonical Implementation Roadmap

**Document purpose:** one source of truth for taking the current Grandmaster Path alpha from a capable single-player chess trainer into a reliable, personalised, family-friendly chess learning platform.

**Prepared from:** the current implementation status, roadmap, product backlog, technical debt register, QA reports, Lichess integration notes, security notes, family execution prompts, research documents, and the 30-feature brainstorm supplied with the project.

**Roadmap rule:** build in dependency order, not excitement order. Every phase must pass its exit gate before the next major system begins.

---

## 1. Product North Star

Grandmaster Path should become:

> A trustworthy chess-learning app that helps an adult learner and their family improve through play, puzzles, understandable review, personalised practice, and gentle fantasy-style progression.

The product should remain:

- useful before it is spectacular;
- truthful about chess strength and engine certainty;
- safe and understandable for children;
- private by default;
- playable on mobile and desktop;
- resilient when AI, Stockfish, Supabase, or Lichess is unavailable;
- structured so new modes reuse shared systems instead of duplicating them.

It should **not** try to become Chess.com, Lichess, Duolingo, D&D Beyond, and a multiplayer social network at the same time.

---

## 2. Source-of-Truth Rules

The existing documentation contains overlapping and occasionally contradictory status claims. Use this precedence order whenever documents disagree:

1. **Observed production behaviour**
2. **Passing automated tests against the current main branch**
3. **`IMPLEMENTATION_STATUS.md`**
4. **Latest dated QA report**
5. **`ROADMAP.md`**
6. **`PRODUCT_BACKLOG.md`**
7. **Older audit/master-plan documents**
8. **Brainstorm documents and research notes**

### Required documentation cleanup

Create and maintain these canonical files:

```text
docs/
  CURRENT_STATE.md
  ROADMAP_CANONICAL.md
  ARCHITECTURE.md
  DATA_MODEL.md
  SECURITY_AND_PRIVACY.md
  QA_RELEASE_CHECKLIST.md
  DECISIONS/
```

After this roadmap is adopted:

- archive superseded roadmap files under `docs/archive/`;
- do not delete research reports;
- mark old master plans as historical;
- update `CURRENT_STATE.md` after every merged feature;
- never mark a feature complete merely because code exists—production behaviour and tests must agree.

---

## 3. Confirmed Current Baseline

The latest implementation notes indicate that the app already includes:

- Next.js, TypeScript, Tailwind, Vercel deployment;
- legal chess rules through `chess.js`;
- browser Stockfish with fallback engine behaviour;
- play as White or Black;
- board flip and multiple SVG piece sets;
- untimed, 10-minute, and 5-minute play;
- beginner onboarding and legal-move explanations;
- local 20-game archive;
- PGN import and export;
- opening recognition;
- post-game AI review with deterministic chess facts, caching, retries, validation, rate limiting, and circuit breaking;
- 117 verified adult puzzles with difficulty, themes, phases, filters, multi-move lines, progressive hints, attempt history, streaks, and spaced review;
- Lichess Daily, Random, and accumulated Archive integration in code;
- lesson completion and interactive model games;
- family pass-and-play, four adventures, family puzzles, lessons, progress, read-aloud, and celebrations;
- optional Supabase email accounts and explicit snapshot upload/restore;
- automated unit and browser tests.

This is already beyond a throwaway prototype. The next work should protect what exists rather than rewriting everything.

---

# PART I — FOUNDATIONAL DELIVERY ORDER

## Phase 0 — Reconcile, Deploy, and Establish a Clean Baseline

### Goal

Know exactly what is deployed, what is only implemented locally, what is broken, and what is genuinely complete.

### Work

#### 0.1 Reconcile documentation

- Produce `CURRENT_STATE.md`.
- Compare main branch, Vercel production, Supabase schema, and all status docs.
- Remove stale unchecked items that are already complete.
- Reopen anything marked complete that fails production testing.
- Give each feature one canonical identifier, such as:
  - `PUZ-001 Merciful puzzle retries`
  - `REV-004 Objective move classification`
  - `FAM-003 Child profiles`

#### 0.2 Finish Lichess production rollout

- Apply the required Supabase migration.
- Verify all Vercel environment variables.
- Verify the cron secret and service-role key remain server-only.
- Trigger and inspect the first daily import.
- Confirm Sydney-date handling around UTC day boundaries.
- Test Daily, Random, and Archive tabs on desktop and mobile.
- Confirm empty archive behaviour when no daily records exist.
- Confirm retries and rejection reasons appear in import logs.
- Confirm the UI still works when Lichess or Supabase is unavailable.

#### 0.3 Production regression sweep

Test:

- new game;
- undo while Stockfish is thinking;
- changing bot level while Stockfish is thinking;
- play as Black;
- promotion;
- timeout;
- resignation;
- checkmate, stalemate, repetition, insufficient material;
- puzzle wrong move, reset, next puzzle, hint progression;
- post-game review loading, failure, retry, chat, and cache;
- login, logout, snapshot upload, and restore;
- family mode;
- 390px mobile layout;
- keyboard navigation;
- screen-reader status text.

#### 0.4 Establish release discipline

Add:

- branch protection;
- required lint, type-check, unit-test, puzzle-validation, and Playwright checks;
- preview deployments for every pull request;
- feature flags for incomplete work;
- changelog entries;
- a rollback note for migrations and risky releases.

### Exit gate

Do not begin major new product systems until:

- production and main branch match;
- the Lichess integration is verified;
- no critical or high-severity QA defect remains open;
- all current tests pass;
- `CURRENT_STATE.md` is accurate.

---

## Phase 1 — Stabilise the Chess and Application Architecture

### Goal

Create shared foundations so all future modes use the same chess state, engine lifecycle, events, persistence, and UI primitives.

### 1.1 Introduce a formal game state machine

Move the play flow away from scattered component booleans.

Suggested states:

```text
idle
configuring
player_turn
engine_thinking
promotion_required
paused
game_over
review_loading
review_ready
recoverable_error
```

Transitions must explicitly handle:

- new game;
- undo;
- engine cancellation;
- time expiration;
- promotion;
- game end;
- review reset;
- route change;
- component unmount.

### 1.2 Create one engine adapter boundary

Use a shared interface for:

- browser Stockfish used for bot play;
- lightweight fallback engine;
- shallow hint analysis;
- future server-side deep analysis.

```ts
interface ChessEngine {
  initialise(): Promise<void>;
  chooseMove(position: EnginePosition, limits: EngineLimits): Promise<EngineMove>;
  analyse(position: EnginePosition, limits: EngineLimits): Promise<EngineAnalysis>;
  stop(): void;
  dispose(): void;
}
```

The engine adapter must prevent stale moves after undo, new game, level change, route change, or unmount.

### 1.3 Separate board rendering from game logic

Create reusable layers:

```text
ChessBoardView
GameController
ClockController
EngineController
MoveHistory
TrainingOverlay
CoachPanel
ResultPanel
```

No feature should directly splice Stockfish lifecycle logic into board rendering.

### 1.4 Add a typed domain-event system

All major activity should emit a standard event:

```ts
type DomainEvent =
  | GameStarted
  | MovePlayed
  | GameCompleted
  | HintUsed
  | PuzzleAttempted
  | PuzzleSolved
  | LessonCompleted
  | ReviewCompleted
  | RewardGranted
  | QuestProgressed;
```

This event stream later powers:

- XP;
- quests;
- reports;
- skill estimates;
- achievements;
- daily dungeons;
- family progress;
- analytics.

### 1.5 Centralise configuration and content

Move these into typed configuration modules:

- bot labels and parameters;
- reward values;
- puzzle-mode rules;
- feature flags;
- class definitions;
- spell definitions;
- quest templates;
- companion definitions;
- content-node schemas.

### 1.6 Version all local data

Every localStorage record must include a schema version and migration path.

Examples:

```text
gmp.games.v2
gmp.puzzleProgress.v3
gmp.settings.v2
gmp.familyProgress.v2
```

Add:

- safe parsing;
- corrupt-data recovery;
- export before migration;
- migration tests;
- archive caps.

### 1.7 Shared responsive shell

Create shared:

- app navigation;
- page header;
- settings drawer;
- board layout;
- status panel;
- empty state;
- loading state;
- error state;
- confirmation dialog;
- reward modal.

### Exit gate

- stale Stockfish moves cannot appear after cancellation;
- play, puzzles, model games, and family boards reuse the intended shared components;
- state transitions have automated tests;
- local data migrations are tested;
- feature flags can hide unfinished routes without code removal.

---

## Phase 2 — Durable Accounts, Cloud Sync, Privacy, and Family Profiles

### Goal

Make progress safely survive browsers and devices before building systems that depend on long-term history.

### Why this comes early

XP, quests, skill trees, opening repetition, personalised puzzles, reports, pets, inventory, and multiplayer all become fragile if progress is still split between unrelated localStorage keys and manual snapshots.

### 2.1 Finalise the Supabase data model

Use authenticated user IDs and row-level security for all user-owned records.

Core tables:

```text
profiles
settings
games
game_moves
game_reviews
puzzle_attempts
puzzle_mastery
lesson_progress
training_sessions
streaks
family_profiles
content_nodes
content_progress
skills
player_skills
quests
player_quests
reward_catalog
player_inventory
companions
player_companions
opening_cards
opening_reviews
```

Do **not** add multiplayer tables yet.

### 2.2 Build automatic local-to-cloud migration

Requirements:

- local-only use remains possible;
- sign-in offers a clear merge preview;
- local and cloud records deduplicate using stable IDs;
- no silent destructive overwrite;
- signed-out progress queues locally;
- reconnect performs safe sync;
- user may export before merge;
- sync conflicts have deterministic rules.

### 2.3 Child and family profiles

One adult account may manage local child profiles without giving children email accounts.

Each child profile needs:

- display name or nickname;
- age mode;
- reading level;
- preferred theme;
- sound/read-aloud preference;
- difficulty band;
- accessibility preferences;
- progress;
- parent-visible play-time summary.

Do not collect unnecessary personal information.

### 2.4 Privacy and retention

Publish plain-language information covering:

- what game and puzzle data is stored;
- what is sent to AI providers;
- how long review data is retained;
- how to export data;
- how to delete an account;
- how child-profile data is handled;
- that user games are private by default.

### 2.5 Observability and shared controls

Add:

- Sentry or equivalent error reporting;
- structured server logs;
- shared rate limiting such as Upstash/Redis/KV;
- AI request counts and failure rates;
- Lichess import health;
- Supabase sync errors;
- privacy-safe product analytics for key funnels.

### Exit gate

- progress syncs between two test browsers;
- local-only mode still works;
- account deletion and export work;
- every user-owned table has tested row-level security;
- AI and cloud outages do not destroy local progress;
- child profiles require no public identity.

---

## Phase 3 — Perfect the Core Puzzle Learning Loop

### Goal

Make puzzles forgiving, instructive, replayable, and reusable as the foundation for many later modes.

### 3.1 Merciful Puzzle Mode

This is the first new user-facing feature.

Rules:

- a wrong move returns the piece;
- the same puzzle remains active;
- the user receives a concise explanation or progressive hint;
- the user chooses Retry, Show Line, Skip, or Next;
- wrong attempts are recorded without labelling the whole puzzle “failed forever”.

Modes:

```text
Learn      unlimited retries
Challenge  three lives
Hardcore   first mistake ends the run
```

### 3.2 Unify all puzzle sources

Local, Lichess Daily, Lichess Random, Archive, personalised, opening, endgame, and family puzzles should enter one normalised puzzle model.

```ts
interface NormalisedPuzzle {
  id: string;
  source: "local" | "lichess" | "personal" | "opening" | "endgame" | "family";
  initialFen: string;
  solution: string[];
  sideToMove: "w" | "b";
  themes: string[];
  difficulty?: number;
  explanation?: PuzzleExplanation;
  attribution?: Attribution;
}
```

### 3.3 One puzzle-runner state machine

Suggested states:

```text
loading
ready
player_turn
opponent_reply
incorrect
hinting
solved
revealing
complete
error
```

Puzzle Rush, Streak, themed drills, daily dungeons, duels, and Mistake Forge should configure this runner rather than fork it.

### 3.4 Practice modes

Implement in this order:

1. **Theme Drill**
2. **Difficulty Drill**
3. **Phase Drill**
4. **Puzzle Streak**
5. **Puzzle Rush**
6. **Saving Throw / second-chance rules**
7. **Family Puzzle Duel**

### 3.5 Spaced repetition v2

Replace fixed simplistic intervals with a consistent mastery system.

Track:

- first-try success;
- number of retries;
- hints used;
- response time;
- recency;
- repeated theme weakness.

Use the same scheduler later for lessons, openings, endgames, and mistake puzzles.

### 3.6 Puzzle accessibility and QA

- no timer required in learning mode;
- pause timers when the tab is hidden where appropriate;
- all feedback available visually and through screen-reader status;
- no colour-only indication;
- correct orientation for black-to-move puzzles;
- all external puzzle attribution preserved.

### Exit gate

- an incorrect move never forces an unwanted new puzzle in Learn mode;
- all puzzle sources use the same runner;
- attempts sync correctly;
- Rush and Streak cannot duplicate rewards by refreshing;
- puzzle validation passes for every bundled position.

---

## Phase 4 — Objective Analysis, Review, and Mistake Forge

### Goal

Make post-game feedback accurate enough to drive personalised improvement.

### 4.1 Server-side or queued Stockfish analysis

Keep browser Stockfish for immediate bot play. Use a separate server/worker path for deeper review.

Analyse:

- evaluation before and after each move;
- best move;
- principal variation;
- mate scores;
- material changes;
- checks;
- captures;
- promotions;
- opening departure;
- tactical motifs where confidently detectable.

### 4.2 Honest move classification

Do not classify only by a fixed centipawn-loss threshold.

Classification should consider:

- mover perspective;
- mate transitions;
- draw-to-loss and win-to-draw changes;
- position advantage;
- tactical uniqueness;
- engine depth consistency.

User-facing language should remain gentle:

```text
Best
Strong
Playable
Inaccuracy
Mistake
Big mistake
Missed chance
```

Avoid false precision.

### 4.3 Analysis board

Build before advanced reports.

Features:

- move navigation;
- evaluation graph;
- best-line arrows;
- annotations;
- retry position;
- copy FEN;
- export annotated PGN;
- hide raw engine details by default for beginners.

### 4.4 Retry Mistakes

From the review, allow the player to replay positions where they made meaningful errors.

The flow:

```text
Review moment
→ Try again from this position
→ Play the better move
→ See concise explanation
→ Mark concept for review
```

### 4.5 Mistake Forge

Automatically create up to three personalised puzzles from a completed game.

Each generated puzzle must:

- use the position before the mistake;
- have a stable solution checked by engine analysis;
- include the player’s attempted move;
- link back to the original game;
- avoid ambiguous positions with many equally good moves;
- enter spaced repetition;
- expire or be revalidated if analysis settings change.

### 4.6 AI explanation remains downstream

The LLM receives a deterministic fact packet. It does not decide:

- whether a move was legal;
- whether the game ended in mate;
- which move was best;
- how much the evaluation changed;
- which line the engine selected.

The LLM may explain those facts in beginner-friendly language.

### Exit gate

- move classifications pass a labelled regression set;
- review never contradicts chess.js game results;
- Mistake Forge puzzles are reproducible;
- every AI explanation can be traced to deterministic facts;
- failures show useful static review rather than an endless loader.

---

## Phase 5 — Structured Learning: Lessons, Openings, Endgames, and Model Games

### Goal

Connect playing and reviewing to a coherent learning pathway.

### 5.1 Interactive lessons

Convert static lesson cards into reusable lesson blocks:

```text
explanation
demonstration
guided move
independent challenge
reflection
linked practice
```

Every lesson ends with an action:

- solve matching puzzles;
- play a practice position;
- study a model-game moment;
- add the concept to spaced review.

### 5.2 Endgame Trainer

Implement before elaborate opening breadth.

Initial modules:

1. king and queen versus king;
2. king and rook versus king;
3. opposition;
4. key squares;
5. passed-pawn races;
6. basic rook activity;
7. converting an extra piece.

Each module needs:

- explanation;
- guided demonstration;
- goal position;
- move limit only where pedagogically useful;
- hints;
- mastery tracking.

### 5.3 Opening Spellbook

Build a small repertoire trainer using position cards and spaced repetition.

Initial scope:

- opening principles;
- one White repertoire;
- one reply to `1.e4`;
- one reply to `1.d4`;
- common early traps explained safely;
- “where did I leave my repertoire?” links from saved games.

Do not begin with a giant opening database.

### 5.4 Model-game study mode

Improve Watch with:

- one key idea per game;
- move-by-move prompts;
- prediction moments;
- annotations;
- thematic tags;
- handoff to relevant lesson, puzzle, opening, or endgame position.

### 5.5 Personal training plan

Generate a weekly plan from:

- puzzle weaknesses;
- missed concepts in games;
- incomplete lessons;
- opening review due dates;
- endgame mastery;
- available session length.

The plan should be explainable, editable, and achievable.

### Exit gate

- every lesson connects to practice;
- opening and endgame cards use the shared spaced-review engine;
- model games launch relevant training;
- the training plan is based on stored evidence rather than generic AI prose.

---

# PART II — GAMIFICATION AND FAMILY FEATURES

## Phase 6 — Progression Framework

### Goal

Add motivation only after learning actions and mastery are measured reliably.

### 6.1 XP and levels

Award XP server-side or through idempotent sync events.

Reward:

- completing training;
- reviewing mistakes;
- showing persistence;
- finishing games;
- mastering concepts.

Do not heavily reward:

- repeatedly farming the easiest activity;
- winning against trivial bots;
- refreshing reward screens.

Suggested level structure:

```text
Pawn Recruit
Knight Scout
Castle Guardian
Tactical Adept
Chess Mage
Board Champion
Grandmaster Pathfinder
```

These are fantasy progression titles, not chess ratings or official titles.

### 6.2 Quest Log

Start with deterministic quests:

- finish one game;
- review one mistake;
- solve three puzzles;
- practise one weak theme;
- complete one lesson;
- play one family activity.

Support:

- daily quests;
- weekly quests;
- one optional stretch quest;
- reroll without manipulative monetisation.

### 6.3 Skill Tree

Use demonstrated skill, not XP alone.

Branches:

```text
Board Vision
Tactics
Calculation
Opening Principles
King Safety
Defence
Pawn Play
Endgames
Practical Play
```

### 6.4 Chess Classes

Classes customise presentation and recommendations:

- Guardian — defence and king safety;
- Trickster — forks, pins, and tactical opportunities;
- Seer — calculation and visualisation;
- Explorer — openings and development;
- Champion — balanced path.

Classes must not create unfair competitive powers.

### 6.5 Inventory and cosmetics

Unlock:

- board themes;
- piece sets;
- profile frames;
- titles;
- map decorations;
- companion accessories;
- spell animations.

Avoid randomised paid loot boxes. If chests exist, make them free, transparent, and cosmetic.

### 6.6 Character Sheet

Build the profile from real data:

- level and class;
- current quests;
- strongest themes;
- growth areas;
- completed adventures;
- puzzle mastery;
- endgame badges;
- opening spellbook;
- companions;
- recent activity.

### 6.7 Prestige

Implement only after the base progression has enough content.

Prestige should:

- preserve all learned progress;
- preserve inventory;
- reset only a cosmetic seasonal track;
- never erase genuine mastery data.

### Exit gate

- rewards are idempotent;
- progress cannot be farmed by reload;
- XP and skills are clearly different;
- no fantasy title resembles a measured Elo claim;
- users can turn off animations and gamification clutter.

---

## Phase 7 — Adventure, Daily Dungeon, Spells, Bots, and Bosses

### Goal

Wrap existing chess content in a distinctive fantasy structure without changing chess truth.

### 7.1 Adventure Quest Map

Create a content-graph engine.

Node types:

```text
story
lesson
puzzle
practice_position
mini_game
bot_game
boss
reward
```

Each node declares:

- prerequisites;
- learning objective;
- content reference;
- completion rule;
- rewards;
- age mode;
- difficulty.

The same engine should power adult fantasy campaigns and family stories.

### 7.2 Daily Dungeon

Daily sequence:

1. warm-up;
2. puzzle;
3. short lesson;
4. practice position or mini-game;
5. boss encounter.

Requirements:

- generated deterministically for the Sydney calendar date;
- saved once generated;
- no easier reroll through refresh;
- accessible untimed mode;
- reward granted once.

### 7.3 Chess Spellbook

Training-only powers:

- Detect Magic — show attacked squares;
- True Sight — reveal hanging pieces;
- Shield — warn before a likely serious mistake;
- Rewind — undo;
- Time Stop — pause a training timer;
- Oracle — suggest candidate moves.

Rules:

- spells are learning aids;
- clearly mark games where assistance was used;
- disable in rated or competitive contexts;
- do not claim engine certainty when analysis is shallow.

### 7.4 Fantasy Bot Personalities

Use Stockfish MultiPV and controlled move selection.

Initial bots:

- Goblin — greedy and erratic;
- Dwarf — solid and defensive;
- Elf — positional;
- Orc — aggressive;
- Dragon — initiative and sacrifices;
- Ancient Sage — endgame-focused.

Bot strength and style must be separated:

```text
strength profile
style preference
mistake model
opening preferences
personality copy
```

### 7.5 Boss Battles and health bars

Boss battles reuse normal chess positions and objective rules.

Possible objectives:

- deliver checkmate;
- survive a fixed number of moves;
- win material;
- promote a pawn;
- hold a draw;
- find a forced tactic.

Health is a visual metaphor derived from move quality and objective progress. The chess result remains authoritative.

### Exit gate

- adventure nodes use existing lesson/puzzle/game systems;
- spells cannot leak into competitive modes;
- bot personality does not create illegal or frozen games;
- boss health never contradicts the underlying result;
- daily rewards are granted once.

---

## Phase 8 — Family World and Sylvie-Friendly Experience

### Goal

Create a warm child mode that teaches chess through short, safe, playful sessions.

### Product and IP rule

Use original characters, names, art, sounds, and branding.

Do not ship:

- Bluey characters, logos, or recognisable copies;
- LEGO logos, minifigure designs, or branded names;
- official Dungeons & Dragons classes, monsters, artwork, or rule text.

It is safe to use broad ideas such as:

- an original energetic blue dog;
- generic interlocking building bricks;
- fantasy classes, dragons, fairies, princesses, and spellbooks.

### 8.1 Family Puzzle Duel

Build first because it reuses the puzzle runner and family profiles.

Modes:

- pass-and-play;
- cooperative family score;
- handicap difficulty;
- untimed;
- parent selects activity length.

### 8.2 Fairy Garden Campaign

Progress restores:

- flowers;
- butterflies;
- ponds;
- fairy houses;
- trees;
- a castle.

Activities begin with:

- identify a piece;
- move legally;
- capture safely;
- protect a piece;
- give check;
- simple mate patterns.

### 8.3 Princess Adventure

Story chapters reuse content nodes.

Keep characters active and capable. Avoid every story being “rescue the helpless princess”.

### 8.4 Brick-Built Kingdom

A generic snap-to-grid building canvas.

Rewards grant:

- bricks;
- roofs;
- windows;
- flags;
- trees;
- characters.

Save layouts as simple JSON.

### 8.5 Original dog coach

Use a wholly original dog family and visual identity.

Coach reactions must be:

- prewritten;
- kind;
- brief;
- age-appropriate;
- non-shaming;
- optional;
- available as text and read-aloud.

### 8.6 Chess Piece Pets

Companions:

- gain cosmetic XP;
- evolve visually;
- wear accessories;
- sit beside the board;
- celebrate effort.

They must not become needy mechanics that punish a child for taking a break.

### 8.7 Storytime Chess

Translate game events into simple narration:

- movement;
- capture;
- defence;
- check;
- promotion;
- checkmate.

Keep narration factual and short.

### 8.8 Magical sounds and gentle celebration

Add:

- optional piece sounds;
- reduced-motion mode;
- volume controls;
- no sudden loud audio;
- no autoplay until the user interacts.

### 8.9 Bedtime Mode

Provide:

- low-stimulation palette;
- reduced animation;
- no countdown pressure;
- quiet audio;
- short suggested session;
- an easy ending ritual.

Do not market screen use at bedtime as beneficial; frame this as a calmer display option when the app is already being used.

### 8.10 Sticker Book

Use original sticker art or simple in-house vector art.

Reward:

- finishing an activity;
- trying again;
- learning a new piece;
- completing a story chapter.

### 8.11 Parent Report

Include:

- sessions completed;
- time spent;
- pieces and concepts practised;
- puzzle attempts;
- persistence;
- suggested next activity.

Avoid ranking children or presenting weak evidence as a diagnosis or formal assessment.

### 8.12 Safe reactions

For local or private family play:

- preset emojis;
- preset encouraging phrases;
- no free-text child chat;
- parent-controlled availability.

### Exit gate

- child profiles remain private;
- no copyrighted franchise assets are used;
- every child activity is playable without reading;
- sounds and narration are optional;
- the experience rewards effort rather than only winning;
- parent reports use plain, non-clinical language.

---

## Phase 9 — Chess Mini-Games

### Goal

Teach specific chess skills through short games built on shared board and objective systems.

Implement in dependency order:

### 9.1 Knight’s Journey

Teaches knight movement and planning.

### 9.2 Capture the Treasure

Teaches legal movement, attacked squares, and shortest paths.

### 9.3 Queen’s Laser Maze

Teaches sliding-piece rays, blockers, and board vision.

### 9.4 Pawn Parade

Teaches promotion, captures, passed pawns, and opposition.

### 9.5 Vanishing Board

Teaches memory and visualisation.

### 9.6 Castle Defence

Teaches defence, exchanges, king safety, and survival.

### Shared mini-game architecture

```ts
interface ChallengeDefinition {
  id: string;
  initialPosition: string;
  objective: ChallengeObjective;
  rules: ChallengeRules;
  grading: ChallengeGrading;
  hints: ChallengeHint[];
}
```

All mini-games must use:

- the shared board;
- deterministic legal movement;
- the objective checker;
- shared rewards;
- shared accessibility;
- shared progress storage.

### Exit gate

- no mini-game duplicates its own chess board implementation;
- levels are data-driven;
- every generated level is solvable;
- mini-games state their learning purpose;
- keyboard and touch controls both work.

---

# PART III — ADVANCED PLATFORM FEATURES

## Phase 10 — Private Family Multiplayer

### Goal

Enable safe games with known people before any public multiplayer platform.

### Initial scope

- private invite link;
- authenticated host;
- guest or authenticated invitee;
- standard chess only;
- server-authoritative moves;
- clocks;
- reconnect;
- resign;
- draw offer;
- rematch;
- game archive;
- preset reactions only.

### Architecture

Use Supabase Realtime or a dedicated WebSocket service, but the server must validate:

- current player;
- legal move;
- clock state;
- game result;
- room access;
- replayed or duplicated requests.

Tables:

```text
multiplayer_rooms
multiplayer_members
multiplayer_games
multiplayer_moves
multiplayer_clock_events
```

### Security

- unguessable expiring invites;
- rate limits;
- no public room directory;
- no child discoverability;
- no arbitrary free-text chat;
- no client-authoritative board state.

### Exit gate

- reconnect restores authoritative state;
- simultaneous moves cannot corrupt a game;
- clocks remain credible;
- invite links expire;
- users cannot access rooms they were not invited to.

---

## Phase 11 — Variant Arcade

### Goal

Add alternative chess only after standard chess architecture and private multiplayer are stable.

### Required rules adapter

```ts
interface RulesAdapter {
  load(position: string): void;
  legalMoves(): Move[];
  makeMove(move: Move): MoveResult;
  status(): GameStatus;
  serialize(): string;
}
```

### Variant order

1. custom objective positions;
2. King of the Hill;
3. Three-check;
4. Chess960;
5. Fog of War;
6. Horde or more complex variants only if the rules engine supports them robustly.

Each variant requires:

- rules explanation;
- independent tests;
- result detection;
- replay/export strategy;
- clear separation from normal chess progress and ratings.

### Exit gate

- variants cannot corrupt normal-game records;
- each variant has full legality and end-condition tests;
- unsupported PGN/FEN differences are documented;
- Fog of War does not leak hidden information through APIs or client state.

---

## Phase 12 — Public Competitive and Community Platform Work

### Goal

Only consider this after retention proves that users value the single-player learning loop.

Possible future systems:

- friend lists;
- unrated matchmaking;
- ratings;
- leaderboards;
- tournaments;
- clubs;
- teams or parties;
- seasonal events;
- community studies;
- moderated chat;
- anti-cheat;
- reporting;
- appeals;
- public profiles;
- public API.

### Mandatory prerequisites

Before public rated play:

- server-authoritative games;
- robust reconnect and clocks;
- moderation policy;
- child-safety policy;
- reporting;
- privacy controls;
- anti-cheat strategy;
- account abuse controls;
- fair-play review process;
- operational monitoring.

This phase is intentionally last. It is a separate product and operational commitment, not merely another feature.

---

# PART IV — EXACT ORDER OF THE 30 NEW FEATURE IDEAS

This list gives the recommended implementation sequence for the brainstormed features, after accounting for technical dependencies.

| Order | Feature | Build after |
|---:|---|---|
| 1 | Merciful Puzzle Mode | Phase 0 baseline |
| 2 | Puzzle Streak with Saving Throws | Shared puzzle runner |
| 3 | Puzzle Rush | Shared puzzle runner |
| 4 | Family Puzzle Duel | Family profiles + puzzle runner |
| 5 | Mistake Forge | Objective engine analysis |
| 6 | Opening Spellbook | Shared spaced repetition |
| 7 | Chess XP and Character Levels | Cloud events + idempotent rewards |
| 8 | Adventure Quest Map | Content-node engine |
| 9 | Quest Log | Domain events + XP |
| 10 | Personal Skill Tree | Reliable skill evidence |
| 11 | Chess Classes | Skill/recommendation model |
| 12 | Loot and Equipment | Inventory + rewards |
| 13 | Character Sheet | Profiles + progression data |
| 14 | Daily Dungeon | Content nodes + puzzle/lesson runners |
| 15 | Chess Spellbook | Shared training overlays |
| 16 | Fantasy Bot Personalities | Engine adapter + MultiPV |
| 17 | Boss Battles | Bot personalities + objectives |
| 18 | Boss Health Bars | Objective and analysis events |
| 19 | Knight’s Journey | Shared mini-game shell |
| 20 | Capture the Treasure | Shared objective checker |
| 21 | Queen’s Laser Maze | Shared board geometry |
| 22 | Pawn Parade | Shared challenge rules |
| 23 | Vanishing Board | Shared mini-game shell |
| 24 | Castle Defence | Objective positions + bot play |
| 25 | Fairy Garden Campaign | Adventure engine + family profiles |
| 26 | Princess Story Mode | Adventure engine |
| 27 | Brick-Built Kingdom | Inventory + family persistence |
| 28 | Original Dog Coach, Pets, and Storytime | Coach event system + family profiles |
| 29 | Private Family Multiplayer | Cloud persistence + authoritative server |
| 30 | Variant Arcade | Rules adapter + multiplayer stability |

### Features from the older brainstorm that remain optional

- Prestige System — add after progression has substantial content.
- Party/Guild Mode — defer to public platform phase.
- Resurrection Token — implement as one Spellbook ability, not a separate system.
- Fairy piece set, garden board, sounds, stickers, bedtime mode, emoji reactions, and parent reports — include within the Family World phase.
- Zen Mode — low-risk polish that may be added during Phase 1.
- Chess Clock Overlay — independent utility that may be added during Phase 1 or 5.
- Blunder Reaction Voices — add only after objective move classification and make them optional and supportive.
- Adaptive AI — add after bot calibration and engine architecture.
- Post-Game Report — covered by the objective review phase.
- Endgame Trainer — covered by Structured Learning.
- Fog of War — covered by Variant Arcade.

---

# PART V — CROSS-CUTTING QUALITY REQUIREMENTS

## Accessibility

Every phase must preserve:

- visible focus;
- keyboard navigation;
- meaningful square labels;
- screen-reader updates for turn, check, selection, errors, and results;
- reduced motion;
- sufficient contrast;
- scalable text;
- touch targets close to 48px where practical;
- no information conveyed only by colour, sound, or animation.

## Mobile

At minimum test:

```text
390 × 844
768 × 1024
desktop wide viewport
```

Verify:

- board remains square;
- controls do not overflow;
- modals remain reachable;
- the keyboard does not obscure inputs;
- landscape works where useful;
- timers and review panels remain readable.

## Security

- server-only secrets;
- row-level security;
- request validation;
- shared rate limits;
- bounded payload sizes;
- no service-role keys in client bundles;
- no raw provider errors exposed;
- no child public profiles by default;
- sanitised content;
- no trusting client reward calculations;
- no trusting client multiplayer moves.

## AI honesty

The app must distinguish:

- deterministic chess facts;
- engine evaluation;
- heuristic classification;
- LLM explanation;
- unknown or uncertain interpretation.

Do not call a bot “1800 Elo” unless measured.  
Do not call feedback “grandmaster coaching” unless justified.  
Do not let an LLM invent legal lines.

## Performance

Set budgets for:

- initial JavaScript;
- Stockfish worker load;
- puzzle-page interaction;
- route transitions;
- image assets;
- animation;
- database query count;
- AI review latency and fallback.

Lazy-load:

- Stockfish where it is not needed;
- family illustrations;
- analysis graphs;
- mini-games;
- variant engines.

## Testing pyramid

### Unit tests

- rules adapters;
- event handlers;
- reward idempotency;
- schedulers;
- migrations;
- objective checks;
- puzzle validation;
- quest conditions;
- XP thresholds;
- privacy helpers.

### Integration tests

- game controller plus engine;
- puzzle runner plus persistence;
- cloud merge;
- review pipeline;
- daily dungeon generation;
- adventure node completion;
- Supabase RLS.

### Browser tests

- core play;
- puzzles;
- review;
- mobile;
- login and sync;
- family mode;
- multiplayer later;
- accessibility smoke tests.

### Manual release checks

- sound;
- screen reader;
- touch;
- slow network;
- offline;
- expired authentication;
- corrupted local data;
- provider outage;
- migration rollback.

---

# PART VI — FEATURE DELIVERY TEMPLATE FOR VIBE CODING

Every coding-agent ticket should use this structure.

## Ticket header

```text
Feature ID:
Feature name:
Phase:
User problem:
Dependencies:
Out of scope:
Feature flag:
Migration required:
```

## Required workflow

1. Read `CURRENT_STATE.md`, `ARCHITECTURE.md`, and the relevant feature spec.
2. Inspect the current code before proposing changes.
3. List exact files that will be changed.
4. Identify reusable existing components.
5. State database and security implications.
6. State failure and offline behaviour.
7. Write or update tests first where practical.
8. Implement the smallest complete vertical slice.
9. Run:
   - lint;
   - type-check;
   - unit tests;
   - puzzle validation where relevant;
   - production build;
   - Playwright regression.
10. Perform mobile and accessibility checks.
11. Update canonical documentation.
12. Produce one focused commit.

## Definition of Done

A ticket is complete only when:

- acceptance criteria pass;
- error, loading, empty, and offline states exist;
- existing play and puzzle behaviour does not regress;
- tests pass;
- mobile layout works;
- accessibility is preserved;
- security has been reviewed;
- analytics events contain no unnecessary personal data;
- docs and migration notes are updated;
- the feature can be disabled with a flag until release.

---

# PART VII — RELEASE GATES

## Gate A — Trustworthy Alpha

Required:

- Phase 0 complete;
- stable engine lifecycle;
- production QA clean;
- honest bot labels;
- reliable puzzle retries;
- accessible mobile play.

## Gate B — Durable Learning App

Required:

- cloud sync;
- family profiles;
- unified puzzle runner;
- spaced review;
- account export and deletion;
- observability.

## Gate C — Personalised Trainer

Required:

- objective review;
- analysis board;
- retry mistakes;
- Mistake Forge;
- interactive lessons;
- opening and endgame repetition;
- personal plan.

## Gate D — Gamified Family Product

Required:

- XP and quests;
- adventure engine;
- family world;
- mini-games;
- parent reporting;
- original assets and IP review.

## Gate E — Connected Chess App

Required:

- private authoritative multiplayer;
- reconnect and clock correctness;
- room security;
- operational monitoring.

## Gate F — Public Platform

Required:

- evidence of retention;
- moderation;
- fair play;
- anti-cheat;
- community safety;
- operational capacity.

---

# PART VIII — WHAT NOT TO BUILD YET

Do not prioritise these before their gates:

- public matchmaking;
- official ratings;
- tournaments;
- clubs;
- free-text child chat;
- guild economies;
- seasonal battle passes;
- huge opening databases;
- dozens of variants;
- complex 3D animation;
- generative AI characters responding without constraints;
- paid random loot boxes;
- native mobile apps before mobile-web retention is proven.

These are expensive multipliers. They do not fix the core learning loop.

---

# PART IX — IMMEDIATE NEXT IMPLEMENTATION QUEUE

The recommended next tickets are:

1. **DOC-001 — Canonical current-state audit**
2. **OPS-001 — Deploy and verify Lichess production integration**
3. **QA-001 — Production regression and 390px accessibility pass**
4. **ARCH-001 — Game state machine and stale-engine cancellation**
5. **ARCH-002 — Shared domain-event system**
6. **DATA-001 — Versioned local data and migration helpers**
7. **PUZ-001 — Merciful Puzzle Mode**
8. **PUZ-002 — Normalised puzzle-source adapter**
9. **PUZ-003 — Shared puzzle-runner state machine**
10. **DATA-002 — Automatic Supabase progress sync**
11. **FAM-001 — Parent-managed family profiles**
12. **REV-001 — Server-side objective Stockfish analysis**
13. **REV-002 — Analysis board and move classifications**
14. **REV-003 — Retry Mistakes**
15. **REV-004 — Mistake Forge**

Only after these should the app begin the large progression and fantasy layers.

---

# Final Recommendation

The previous roadmap had the right broad instinct—stabilise data, improve puzzles, add progression, then add family and advanced systems—but it placed some user-facing systems before the foundations they depend on.

The ideal order is:

```text
Verify reality
→ stabilise architecture
→ establish durable data
→ perfect puzzle learning
→ build objective review
→ connect structured learning
→ add progression
→ add adventure and family worlds
→ add mini-games
→ add private multiplayer
→ add variants
→ consider public platform work
```

This order gives Grandmaster Path the best chance of becoming a coherent product rather than a collection of impressive but disconnected demos.
