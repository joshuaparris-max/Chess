/**
 * validate-puzzles.mjs
 * Run: node scripts/validate-puzzles.mjs
 *
 * Validates adult puzzles (family puzzles use simplified geometry, no chess.js).
 * The data file ends with a JSON array literal, so we extract and JSON.parse it
 * rather than regex-scanning — this is robust to formatting.
 *
 * Checks: legal FEN, sideToMove matches, every solution move plays legally
 * in sequence, and no duplicate IDs.
 */

import { Chess } from 'chess.js';
import { readFileSync } from 'fs';
import path from 'path';

const srcPath = path.resolve(process.cwd(), 'lib/puzzles/adultPuzzles.ts');
const src = readFileSync(srcPath, 'utf-8');

// Extract the array literal: anchor on the declaration, then take from its '[' to the final ']'.
const decl = src.indexOf('adultPuzzles');
const eq = src.indexOf('=', decl);
const start = src.indexOf('[', eq);
const end = src.lastIndexOf(']');
if (decl === -1 || eq === -1 || start === -1 || end === -1) {
  console.error('Could not locate the puzzle array literal in adultPuzzles.ts');
  process.exit(1);
}

let puzzles;
try {
  puzzles = JSON.parse(src.slice(start, end + 1));
} catch (e) {
  console.error('Failed to JSON.parse the puzzle array. The generator emits JSON; if the file');
  console.error('was hand-edited into TS-literal form, restore JSON formatting. Error:', e.message);
  process.exit(1);
}

let errors = 0;
const seen = new Set();

for (const p of puzzles) {
  const id = p.id ?? '(no id)';

  if (seen.has(id)) { console.error(`[${id}] Duplicate puzzle ID`); errors++; }
  seen.add(id);

  if (!Array.isArray(p.solution) || p.solution.length === 0) {
    console.error(`[${id}] Empty or missing solution array`);
    errors++;
    continue;
  }

  let chess;
  try {
    chess = new Chess(p.fen);
  } catch {
    console.error(`[${id}] Invalid FEN: ${p.fen}`);
    errors++;
    continue;
  }

  if (chess.turn() !== p.sideToMove) {
    console.error(`[${id}] sideToMove mismatch: FEN turn '${chess.turn()}' vs field '${p.sideToMove}'`);
    errors++;
  }

  for (let i = 0; i < p.solution.length; i++) {
    const u = p.solution[i];
    const move = { from: u.slice(0, 2), to: u.slice(2, 4), ...(u.length === 5 ? { promotion: u[4] } : {}) };
    try {
      const m = chess.move(move);
      if (!m) {
        console.error(`[${id}] Solution move ${i} (${u}) is illegal in:\n  ${chess.fen()}`);
        errors++;
        break;
      }
    } catch (e) {
      console.error(`[${id}] Solution move ${i} (${u}) threw: ${e.message}`);
      errors++;
      break;
    }
  }
}

console.log(`\nValidated ${puzzles.length} puzzles.`);
if (errors > 0) {
  console.error(`${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log('All puzzles valid.');
}
