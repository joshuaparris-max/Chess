# Build & Deployment Commands

## Local Testing

```bash
# Install dependencies
npm install

# Run type checking and linting
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Start development server
npm run dev

# Open in browser
# http://localhost:3000           → Landing page
# http://localhost:3000/play      → Play entry screen
# http://localhost:3000/puzzles   → Puzzles hub
# http://localhost:3000/learn     → Learn hub
# http://localhost:3000/family    → Family hub
# http://localhost:3000/dashboard → Full dashboard
```

## Verifying Configuration After Changes

### Test Beginner Flow
```javascript
// In browser DevTools Console after selecting skill level:

// Should show complete game config
JSON.parse(localStorage.getItem('gm-play-settings-v1'))

// Should show 'gentle' or 'standard'
localStorage.getItem('gm-bot-style')

// Should show 'true' or 'false'
localStorage.getItem('gm-spells-enabled')

// Should show user's selection
localStorage.getItem('gmp-beginner-level')
```

### Expected Output Examples

**If user selected "I'm completely new":**
```javascript
// gm-play-settings-v1
{
  "levelId": "street-400",
  "playerColor": "w",
  "timeControl": "untimed",
  "boardFlipped": false,
  "gameMode": "vs-computer"
}

// gm-bot-style
"gentle"

// gm-spells-enabled
"true"

// gmp-beginner-level
"complete-new"
```

**If user selected "I've played before":**
```javascript
// gm-play-settings-v1
{
  "levelId": "club-1200",
  "playerColor": "w",
  "timeControl": "untimed",
  "boardFlipped": false,
  "gameMode": "vs-computer"
}

// gm-bot-style
"standard"

// gm-spells-enabled
"false"

// gmp-beginner-level
"played-before"
```

## Git Workflow

```bash
# Stage specific files (not git add .)
git add \
  app/page.tsx \
  app/page-hub.tsx \
  app/play/page.tsx \
  app/dashboard/page.tsx \
  app/[room]/page.tsx \
  components/LandingPage.tsx \
  components/BeginnerModal.tsx \
  LANDING_PAGE_IMPLEMENTATION.md \
  LANDING_PAGE_FINAL_SUMMARY.md \
  FILE_CHANGES_DETAILED.md \
  COMPLETE_STATUS.md \
  BUILD_AND_DEPLOYMENT.md

# Review changes
git diff --staged

# Commit with descriptive message
git commit -m "feat: Complete landing page redesign with beginner onboarding

BREAKING: /play is now entry screen, not full dashboard
FEATURE: Marketing homepage at /
FEATURE: Beginner skill-level modal with auto-configuration
FEATURE: Full dashboard moved to /dashboard
FEATURE: All routes now clean and purposeful

Routes:
- / → Marketing homepage
- /play → Simple entry screen with onboarding modal
- /puzzles, /learn, /family, /watch, /roadmap → Hubs (from [room] route)
- /dashboard → Full feature dashboard

Beginner configuration:
- Completely new → Level 1 (street-400), Gentle, Hints ON
- Knows pieces → Level 2 (learner-800), Gentle, Hints ON
- Played before → Level 3 (club-1200), Standard, Hints OFF

Backwards compatible:
- All existing localStorage keys reused
- All game logic unchanged
- No data migration needed
- All features still accessible

Responsive:
- Desktop: Card grid layouts
- Mobile: Single column stacks, full-width modals
- All interactive elements >44px for touch

No breaking changes to existing components:
- PlayTrainer.tsx unchanged
- PuzzleTrainer.tsx unchanged
- LearnPath.tsx unchanged
- Game logic preserved
- Puzzles, lessons, family features intact"

# Push to main
git push origin main
```

## Vercel Deployment

```bash
# After git push, Vercel automatically deploys

# Verify deployment:
curl https://chess-kappa-five.vercel.app/           # Should be marketing page
curl https://chess-kappa-five.vercel.app/play       # Should be play entry
curl https://chess-kappa-five.vercel.app/dashboard  # Should be full hub

# Check build logs in Vercel dashboard:
# https://vercel.com/chess-kappa-five
```

## If Build Fails

### Check TypeScript errors
```bash
npx tsc --noEmit
```

### Check lint errors
```bash
npx eslint . --ext .ts,.tsx
```

### Common issues and fixes

**Issue: Module not found**
```
Solution: npm install
Run: npm run build
```

**Issue: Type errors in new files**
```
Check imports are correct
Verify component props interfaces
Run: npx tsc --noEmit
```

**Issue: Build hangs**
```
Clear cache: rm -rf .next node_modules
Reinstall: npm install
Rebuild: npm run build
```

## Performance Check

```bash
# Check bundle size
npm run build

# Build output should show:
# Route                           Size      First Load
# /_app                          XX.X kB   XX.X kB
# /                              XX.X kB   XX.X kB
# /play                          XX.X kB   XX.X kB
# /dashboard                     XX.X kB   XX.X kB
# (Additional static pages)

# Size should be comparable to before (no new dependencies)
```

## Rollback Plan

If issues arise after deployment:

```bash
# View commit history
git log --oneline -10

# Revert to previous commit
git revert HEAD  # Creates new commit that undoes changes
git push origin main

# Or reset to specific commit (destructive)
git reset --hard <commit-hash>
git push --force origin main  # Use with caution!
```

## Monitoring

After deployment, check:

```bash
# 1. Vercel analytics dashboard
https://vercel.com/chess-kappa-five/analytics

# 2. Error tracking (if configured)
# Check error logs for /play route issues

# 3. User feedback
# Monitor if users report routing issues

# 4. Performance
# Check page load times (should be fast, minimal changes)

# 5. localStorage verification
# Test beginner flow works (configuration applies correctly)
```

## Success Criteria

✅ Deployment successful
✅ `/play` shows clean entry screen (not crowded dashboard)
✅ Beginner modal appears and works
✅ Game starts with correct configuration after modal
✅ `/` shows marketing homepage
✅ `/dashboard` shows full hub
✅ All other routes work (`/puzzles`, `/learn`, etc.)
✅ Mobile layouts responsive
✅ No console errors
✅ localStorage configuration verified in DevTools

## Quick Verification Script

```javascript
// Run in browser console after visiting /play and completing beginner modal

// Verify all configuration is set
const config = {
  settings: JSON.parse(localStorage.getItem('gm-play-settings-v1')),
  botStyle: localStorage.getItem('gm-bot-style'),
  spellsEnabled: localStorage.getItem('gm-spells-enabled'),
  beginnerLevel: localStorage.getItem('gmp-beginner-level'),
};

console.log('Configuration after beginner flow:', config);

// Check all required fields
const allSet = 
  config.settings?.levelId &&
  config.settings?.gameMode === 'vs-computer' &&
  config.botStyle &&
  config.spellsEnabled !== null &&
  config.beginnerLevel;

console.log('All configuration set correctly:', allSet);

// Verify mapping is correct
const levelMapping = {
  'complete-new': { level: 'street-400', style: 'gentle', spells: 'true' },
  'know-pieces': { level: 'learner-800', style: 'gentle', spells: 'true' },
  'played-before': { level: 'club-1200', style: 'standard', spells: 'false' },
};

const expected = levelMapping[config.beginnerLevel];
console.log('Expected configuration:', expected);
console.log('Actual configuration:', {
  level: config.settings?.levelId,
  style: config.botStyle,
  spells: config.spellsEnabled,
});
console.log('Matches expected:', 
  config.settings?.levelId === expected?.level &&
  config.botStyle === expected?.style &&
  config.spellsEnabled === expected?.spells
);
```

---

## Documentation Files Created

1. **LANDING_PAGE_IMPLEMENTATION.md** (210 lines)
   - Complete implementation details and design decisions

2. **LANDING_PAGE_FINAL_SUMMARY.md** (350+ lines)
   - Comprehensive user journey and technical details

3. **FILE_CHANGES_DETAILED.md** (300+ lines)
   - Line-by-line changes for each modified file

4. **COMPLETE_STATUS.md** (400+ lines)
   - Full project status and verification checklist

5. **BUILD_AND_DEPLOYMENT.md** (this file)
   - Commands for building, testing, and deploying

All documentation is in the repo root for easy access during review and deployment.
