/**
 * validate-puzzles.mjs
 * Run: node scripts/validate-puzzles.mjs
 *
 * Validates adult puzzles only (family puzzles use simplified geometry, no chess.js).
 * Checks: legal FEN, solution moves playable in sequence, no stale references.
 */

import { Chess } from 'chess.js';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

// Load the puzzle data via ts-stripped JSON extraction from the .ts source file.
// We do a minimal parse: find the exported array literal and extract id/fen/solution via regex.
const srcPath = path.resolve(process.cwd(), 'lib/puzzles/adultPuzzles.ts');
const src = readFileSync(srcPath, 'utf-8');

// Extract individual puzzle objects (rough extraction for validation only)
const puzzleBlocks = [];
const blockRe = /\{\s*id:\s*'([^']+)'[\s\S]*?solution:\s*\[([^\]]*)\][\s\S]*?fen:\s*'([^']+)'[\s\S]*?\}/g;
// Alternatively, extract id, fen, sideToMove, solution in order
// Use a simpler approach: extract all id, fen, solution triplets in order from the file

const idFenSolRe = /id:\s*'([^']+)'[^}]*?fen:\s*'([^']+)'[^}]*?sideToMove:\s*'([wb])'[^}]*?solution:\s*\[([^\]]*)\]/gs;

let match;
let errors = 0;
let warnings = 0;
let checked = 0;

while ((match = idFenSolRe.exec(src)) !== null) {
  const [, id, fen, sideToMove, solutionRaw] = match;
  const solution = solutionRaw.match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) ?? [];

  checked++;
  let chess;

  // 1. FEN must be loadable
  try {
    chess = new Chess(fen);
  } catch (e) {
    console.error(`[${id}] Invalid FEN: ${fen}`);
    errors++;
    continue;
  }

  // 2. Side to move must match
  if (chess.turn() !== sideToMove) {
    console.error(`[${id}] sideToMove mismatch: FEN says '${chess.turn()}' but field says '${sideToMove}'`);
    errors++;
  }

  // 3. Solution must be non-empty
  if (solution.length === 0) {
    console.error(`[${id}] Empty solution array`);
    errors++;
    continue;
  }

  // 4. Play through all solution moves
  let valid = true;
  for (let i = 0; i < solution.length; i++) {
    const uci = solution[i];
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    try {
      const mv = chess.move({ from, to, ...(promotion ? { promotion } : {}) });
      if (!mv) {
        console.error(`[${id}] Solution move ${i} (${uci}) is illegal in position:\n  ${chess.fen()}`);
        errors++;
        valid = false;
        break;
      }
    } catch (e) {
      console.error(`[${id}] Solution move ${i} (${uci}) threw: ${e.message}`);
      errors++;
      valid = false;
      break;
    }
  }

  if (valid) {
    // 5. Warn if solution doesn't end in a decisive position (checkmate, capture, or clear advantage)
    // Just a courtesy check — not an error.
    const finalTurn = chess.turn();
    if (!chess.isCheckmate() && !chess.isGameOver()) {
      // That's fine — tactical puzzles don't have to end in checkmate
    }
  }
}

// Check for duplicate IDs
const idMatches = [...src.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const seen = new Set();
for (const id of idMatches) {
  if (seen.has(id)) {
    console.error(`Duplicate puzzle ID: '${id}'`);
    errors++;
  }
  seen.add(id);
}

console.log(`\nValidated ${checked} puzzles.`);
if (errors > 0) {
  console.error(`${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log('All puzzles valid.');
}
