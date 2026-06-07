# Difficulty Honesty & Bot Calibration

## Current State
The app uses Stockfish at various depths to create difficulty levels. However, the **displayed labels must be honest and not overclaim strength**.

## Problem: Overconfidence
Beginner players quickly notice when a bot is mislabeled. Claims like "2400 Master Bot" or "Grandmaster Engine" that then play badly damage trust faster than missing features.

## Recommended Labels
Instead of unverified strength claims, use neutral, practice-focused labels:

### Option A: Trainer Levels
```
Trainer Level 1  — beginner positioning
Trainer Level 2  — basic tactics
Trainer Level 3  — solid play
Trainer Level 4  — tactical trainer
Trainer Level 5  — strongest trainer
```

### Option B: Learning Band
```
Street Beginner   — learns piece movement
Learner           — building knowledge
Club Practice     — solid practice opponent
Tactical Trainer  — good tactics trainer
Defensive Trainer — defensive play
Strongest Trainer — strongest available
```

## Requirements
- [ ] Remove unverified strength claims (no "Master", "Grandmaster", "2400 Elo" unless measured)
- [ ] Rename current levels to neutral descriptors
- [ ] If switching to new labels, test with beginner players and verify they match expectations
- [ ] Document actual playing strength vs label (e.g. "Trainer Level 3 typically wins against beginner players in these scenarios")
- [ ] Add in-game hint that labels are practice targets, not official ratings

## Future Work: Calibration
- Play test games against bots at each level
- Collect beginner player feedback
- Adjust depth/skill settings to match label expectations
- Consider ELO estimation if Stockfish eval provides enough data

## Current Stockfish Levels (to be renamed/calibrated)
See `lib/trainingData.ts` for current configuration. Labels should be updated to avoid overclaiming.
