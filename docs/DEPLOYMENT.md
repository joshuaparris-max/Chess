# Lichess Integration – Deployment Guide

## Pre-Deployment Checklist

### 1. Local Testing
- [x] Build passes: `npm run build` ✅
- [x] Tests pass: `npm run test` ✅
- [x] Lint passes: `npm run lint` ✅
- [x] FEN reconstruction validated with real Lichess puzzles ✅
- [ ] Dev server routes tested locally (pending: `npm run dev`)
- [ ] Browser UI tested (tabs, errors, fallback)
- [ ] Mobile layout verified

### 2. Supabase Setup
```sql
-- Run this migration in Supabase SQL editor:
-- (Located in: supabase/migrations/20260615_daily_puzzles.sql)

CREATE TABLE IF NOT EXISTS daily_puzzles (
  id BIGSERIAL PRIMARY KEY,
  lichess_id TEXT NOT NULL UNIQUE,
  puzzle_date DATE NOT NULL UNIQUE,
  fen TEXT NOT NULL,
  solution TEXT[] NOT NULL,
  side_to_move CHAR(1) NOT NULL CHECK (side_to_move IN ('w', 'b')),
  rating INTEGER NOT NULL,
  plays INTEGER NOT NULL,
  themes TEXT[] NOT NULL,
  url TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_puzzle_date ON daily_puzzles(puzzle_date DESC);
CREATE INDEX idx_puzzle_rating ON daily_puzzles(rating);
CREATE INDEX idx_puzzle_themes ON daily_puzzles USING GIN (themes);
CREATE INDEX idx_imported_at ON daily_puzzles(imported_at DESC);

CREATE TABLE IF NOT EXISTS daily_puzzle_imports (
  id BIGSERIAL PRIMARY KEY,
  import_date DATE NOT NULL,
  lichess_puzzle_id TEXT,
  success BOOLEAN NOT NULL,
  reason TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  response_time_ms INTEGER,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_date ON daily_puzzle_imports(import_date DESC);
CREATE INDEX idx_import_date_success ON daily_puzzle_imports(import_date, success);
CREATE INDEX idx_attempted_at ON daily_puzzle_imports(attempted_at DESC);
```

**Key differences from v1:**
- Added `side_to_move` column for FEN validation
- Removed `user_solve_count` (user progress should be user-scoped, not puzzle-scoped)
- Removed `UNIQUE(import_date)` constraint from daily_puzzle_imports to allow logging multiple attempts per day
- Added `attempt_number` column to track retry sequence (1-12)

### 3. Environment Variables

Create `.env.production.local` (Vercel will also need these in dashboard):

```env
# Supabase (from Supabase dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Server-only (service role key for cron job)
# ⚠️ NEVER expose this publicly – only in Vercel env vars
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron job secret (use a strong random token)
# Generate: openssl rand -base64 32
CRON_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvw

# Optional: Monitoring/Slack alerts
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**How to get keys:**
1. Supabase dashboard > Settings > API
   - Find `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Find `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Find `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Vercel Deployment

**In Vercel Dashboard:**

1. Go to your project > Settings > Environment Variables
2. Add all env vars above
3. Ensure `vercel.json` is committed (contains cron schedule):
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/daily-puzzle",
         "schedule": "0 12 * * *"
       }
     ]
   }
   ```
4. Deploy: `git push` (automatic) or `vercel` (manual)

**Verify deployment:**
- [ ] Site loads without errors
- [ ] /puzzles page renders (Local, Daily, Random tabs)
- [ ] /api/puzzles?source=daily returns valid puzzle
- [ ] /api/accumulated-puzzles returns empty array (first day)

---

## Post-Deployment Verification

### Cron Job Timing

**Scheduled:** 12:00 UTC daily (from `vercel.json`)

**Sydney Time Equivalent:** ~10-11 PM Sydney time (varies by DST):
- Standard Time (June-September): UTC 12:00 = Sydney 22:00 (10 PM)
- Daylight Time (October-March): UTC 12:00 = Sydney 23:00 (11 PM)

**Note:** The cron job uses Sydney timezone for the puzzle_date field, so a cron run at UTC 12:00 will have its puzzle available for "today" in Sydney, not in UTC.

### Day 1: Cron Job First Run

**Time:** 12:00 UTC (tomorrow, or 24 hours after deploy)

**Check Vercel logs:**
1. Vercel dashboard > your project > Logs
2. Search for `cron/daily-puzzle`
3. Should see: `GET /api/cron/daily-puzzle` with status 200

**Check Supabase:**
1. Supabase dashboard > SQL Editor > run query:
   ```sql
   SELECT * FROM daily_puzzle_imports ORDER BY attempted_at DESC LIMIT 10;
   SELECT * FROM daily_puzzles ORDER BY puzzle_date DESC LIMIT 5;
   ```
2. First row in daily_puzzle_imports should have:
   - `import_date` = today's Sydney date (NOT UTC date)
   - `attempt_number` = 1 (or higher if quality filtering took multiple attempts)
   - `success` = true
   - `lichess_puzzle_id` = some ID like "vdpRb"
   - `reason` = "Quality OK" (or reason for last attempt if failed)

3. If success, daily_puzzles should have 1 new row:
   - `puzzle_date` = today's Sydney date
   - `rating` ≥ 1600
   - `plays` ≥ 100
   - Not containing theme "opening"

### Day 2+: Monitor Pattern

**Daily checks:**
1. Vercel Cron Logs → recent execution status
2. Supabase `daily_puzzle_imports`:
   - Check for new entries each day
   - `success=true` means puzzle was imported
   - `attempt_number` shows how many candidates were tried
   - If all attempts failed, `success=false` with reason
3. Check `daily_puzzles`:
   - Should grow by 1 row per day (once per Sydney date)
4. Check for failures:
   - If 2+ consecutive failures, investigate root cause
   - Common reasons: quality filter rejecting all candidates, Lichess API unavailable, database connection failure

**Common import failure reasons:**
- **"Rating too low (< 1600)"** – Normal, cron tries next candidate (up to 12 attempts)
- **"Plays too low (< 100)"** – Normal, cron tries next candidate
- **"Theme excluded: opening"** – Normal, cron tries next candidate
- **"Duplicate"** – Same puzzle as existing daily_puzzles row; cron tries next (very rare)
- **"Exhausted 12 attempts"** – No suitable puzzle found; waits for tomorrow's cron run
- **"Supabase client not configured"** – Check env vars in Vercel
- **"Failed to fetch Lichess"** – Lichess API down, will retry tomorrow
- **"Network timeout"** – Vercel will auto-retry the cron job

---

## API Endpoint Testing

### Test Daily Puzzle (Live)
```bash
curl "https://your-site.vercel.app/api/puzzles?source=daily"
```

**Expected response:**
```json
{
  "lichessId": "...",
  "fen": "...",
  "sideToMove": "w",
  "solution": [...],
  "rating": 1800,
  ...
}
```

### Test Random Puzzle
```bash
curl "https://your-site.vercel.app/api/puzzles?source=random&angle=fork"
```

### Test Accumulated Puzzles
```bash
curl "https://your-site.vercel.app/api/accumulated-puzzles?limit=5"
```

**Expected response (after 1+ day):**
```json
{
  "puzzles": [...],
  "total": 1,
  "limit": 5,
  "offset": 0
}
```

---

## Monitoring & Alerts

### Supabase Alerts (SQL queries)

**Failed imports yesterday:**
```sql
SELECT * FROM daily_puzzle_imports
WHERE import_date = CURRENT_DATE - INTERVAL '1 day'
AND success = FALSE;
```

**Streak of failures:**
```sql
SELECT COUNT(*) as consecutive_failures
FROM daily_puzzle_imports
WHERE success = FALSE
ORDER BY import_date DESC
LIMIT 3;
```

**Most common import failure reason:**
```sql
SELECT reason, COUNT(*) as count
FROM daily_puzzle_imports
WHERE success = FALSE
GROUP BY reason
ORDER BY count DESC;
```

### Vercel Cron Monitoring

**In Vercel Dashboard:**
1. Project > Deployments > select latest
2. Logs tab > search "cron"
3. Check recent cron job executions
4. Look for errors or timeouts

**Setting up alerts:**
- Go to Integrations > Email/Slack
- Enable notifications for failed cron jobs
- Or check manually once per day (takes 30 seconds)

---

## Rollback / Troubleshooting

### If Cron Fails
1. **Check Supabase env vars** – Are they set in Vercel?
   ```
   Vercel Dashboard > Settings > Environment Variables
   ```

2. **Manually trigger cron** (for testing only):
   ```bash
   curl -X GET "https://your-site.vercel.app/api/cron/daily-puzzle" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check Lichess API status:**
   ```bash
   curl "https://lichess.org/api/puzzle/daily"
   ```
   If this fails, Lichess is down – cron will retry tomorrow.

4. **If Supabase insert fails:**
   - Check table schema (`daily_puzzles` exists?)
   - Check service role key has INSERT permission
   - Check `puzzle_date` is not duplicate
   - Query logs: `SELECT * FROM daily_puzzle_imports ORDER BY created_at DESC;`

### Revert Changes
```bash
git revert <commit-sha>
git push  # Auto-deploys on Vercel
```

Then redeploy after fixing:
```bash
git fix-commit
git push
```

---

## Performance Targets

- Lichess API call: <500ms (timeout: 15s)
- FEN reconstruction: <5ms
- Supabase insert: <100ms
- Total cron execution: <2s
- /api/puzzles response: <500ms (cached: <50ms)
- /api/accumulated-puzzles response: <100ms (cached: <20ms)

---

## FAQ

**Q: What if Lichess is rate-limiting us?**
A: Cron will fail gracefully, log reason, retry tomorrow. No exponential backoff needed (runs once per day).

**Q: Can I manually import a puzzle?**
A: Yes, call the cron endpoint with the secret:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-site.vercel.app/api/cron/daily-puzzle
```

**Q: What if the same puzzle is imported twice?**
A: Supabase unique constraint on `(lichess_id)` prevents duplicates. Cron logs "Duplicate" reason.

**Q: Can users see Supabase keys?**
A: Anon key is public (intentional). Service role key is secret-only. Never expose in client code.

**Q: How do I test without waiting 24 hours?**
A: Manually call the cron endpoint (see above) or change `vercel.json` schedule temporarily to every 5 minutes.

**Q: What happens if deployment fails mid-cron?**
A: Vercel retries the entire route. If still fails, logs error. No data corruption (uses INSERT, not UPSERT).

