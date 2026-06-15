-- Supabase migration for accumulated daily puzzles
-- This table stores one puzzle per day from Lichess, retained forever

CREATE TABLE IF NOT EXISTS daily_puzzles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Source identification
  lichess_id TEXT NOT NULL UNIQUE, -- Lichess puzzle ID
  source_puzzle_id TEXT NOT NULL, -- lichess_id again, for query convenience
  
  -- Puzzle data (reconstructed from Lichess)
  puzzle_date DATE NOT NULL UNIQUE, -- Sydney date; one puzzle per calendar date
  fen TEXT NOT NULL,
  side_to_move CHAR(1) NOT NULL CHECK (side_to_move IN ('w', 'b')),
  solution TEXT[] NOT NULL, -- UCI move list, e.g. ['e2e4', 'd7d5']
  
  -- Metadata from Lichess
  rating INTEGER NOT NULL,
  plays INTEGER NOT NULL,
  themes TEXT[] NOT NULL, -- e.g. ['fork', 'pin', 'mateIn2']
  url TEXT,
  
  -- Timestamps
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_puzzle_date ON daily_puzzles(puzzle_date DESC);
CREATE INDEX idx_puzzle_rating ON daily_puzzles(rating);
CREATE INDEX idx_puzzle_themes ON daily_puzzles USING GIN (themes);
CREATE INDEX idx_imported_at ON daily_puzzles(imported_at DESC);
CREATE INDEX idx_lichess_id ON daily_puzzles(lichess_id);

-- Track import attempts and failures (multiple per day allowed)
-- Logs each attempt, not just the final result
CREATE TABLE IF NOT EXISTS daily_puzzle_imports (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identifies which Sydney date's import run this is
  import_date DATE NOT NULL, -- Sydney date (NOT UNIQUE; multiple attempts per day allowed)
  
  -- Candidate puzzle information
  lichess_puzzle_id TEXT, -- The puzzle we tried (null if fetch failed)
  success BOOLEAN NOT NULL,
  reason TEXT, -- Why it failed/succeeded (e.g., 'Rating too low', 'Duplicate', 'Success')
  response_time_ms INTEGER, -- How long the Lichess API took
  
  -- Attempt metadata
  attempt_number INTEGER NOT NULL DEFAULT 1, -- Which attempt this was during the day
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_date ON daily_puzzle_imports(import_date DESC);
CREATE INDEX idx_import_success ON daily_puzzle_imports(import_date, success);
CREATE INDEX idx_import_attempted_at ON daily_puzzle_imports(attempted_at DESC);
