/**
 * generate-adult-puzzles.mjs
 * Run: node scripts/generate-adult-puzzles.mjs
 *
 * Generates lib/puzzles/adultPuzzles.ts with puzzles that are CORRECT BY CONSTRUCTION:
 * every FEN is loaded by chess.js and every solution move is played through chess.js
 * before being written. The tactical property (mate, free capture, fork, promotion,
 * mate-in-2) is verified programmatically. Nothing is hand-calculated.
 *
 * Difficulty bands are assigned by tactic type / line length.
 */

import { Chess } from 'chess.js';
import { writeFileSync } from 'fs';
import path from 'path';

const FILES = 'abcdefgh';
const sq = (f, r) => `${FILES[f]}${r + 1}`;            // f,r are 0-7
const allSquares = [];
for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) allSquares.push(sq(f, r));

const fileOf = (s) => FILES.indexOf(s[0]);
const rankOf = (s) => Number(s[1]) - 1;
const cheby = (a, b) => Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));

function buildFen(pieces, turn) {
  // pieces: { square: 'K'|'Q'|'R'|'B'|'N'|'P'|lowercase for black }
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pieces[sq(f, r)];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += p;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

function tryLoad(fen) {
  try { const c = new Chess(fen); return c; } catch { return null; }
}

function uci(m) { return `${m.from}${m.to}${m.promotion ?? ''}`; }

// Deterministic spread iterator: visit squares in a scattered order for variety.
const SCATTER = (() => {
  const out = [];
  for (let i = 0; i < allSquares.length; i++) out.push(allSquares[(i * 37) % 64]);
  return [...new Set(out)];
})();

// ── Generators ──────────────────────────────────────────────────────────────

// 1) Mate in 1. whiteExtra describes extra white pieces beyond the king.
function genMateIn1(whiteExtra, limit, blackExtra = {}) {
  const found = [];
  const seen = new Set();
  for (const bk of SCATTER) {
    for (const wk of SCATTER) {
      if (cheby(bk, wk) < 2) continue;
      for (const ws of SCATTER) {
        if (ws === bk || ws === wk) continue;
        const pieces = { [bk]: 'k', [wk]: 'K', [ws]: whiteExtra };
        let bad = false;
        for (const [s, p] of Object.entries(blackExtra)) {
          if (pieces[s]) { bad = true; break; }
          pieces[s] = p;
        }
        if (bad) continue;
        const fen = buildFen(pieces, 'w');
        if (seen.has(fen)) continue;
        const c = tryLoad(fen);
        if (!c) continue;
        if (c.isCheck()) continue;       // white shouldn't already be in check
        let moves;
        try { moves = c.moves({ verbose: true }); } catch { continue; }
        for (const m of moves) {
          const t = new Chess(fen);
          t.move(m);
          if (t.isCheckmate()) {
            seen.add(fen);
            found.push({ fen, solution: [uci(m)], piece: whiteExtra });
            break;
          }
        }
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

// 2) Free capture of an undefended black piece by a white piece.
function genHangingCapture(whitePiece, blackPiece, limit, maxScan = 120000) {
  const found = [];
  const seen = new Set();
  let scan = 0;
  outer:
  for (const wk of SCATTER) {
    for (const bk of SCATTER) {
      if (cheby(bk, wk) < 2) continue;
      for (const wp of SCATTER) {
        if (wp === wk || wp === bk) continue;
        for (const bp of SCATTER) {
          if (bp === wk || bp === bk || bp === wp) continue;
          if (++scan > maxScan) break outer;
          const pieces = { [wk]: 'K', [bk]: 'k', [wp]: whitePiece, [bp]: blackPiece };
          const fen = buildFen(pieces, 'w');
          if (seen.has(fen)) continue;
          const c = tryLoad(fen);
          if (!c) continue;
          if (c.isCheck()) continue;
          let moves;
          try { moves = c.moves({ verbose: true }); } catch { continue; }
          const cap = moves.find(m => m.from === wp && m.to === bp && m.captured);
          if (!cap) continue;
          // verify undefended: after capture, black cannot recapture on bp
          const after = new Chess(fen);
          after.move(cap);
          const recapture = after.moves({ verbose: true }).some(m => m.to === bp && m.captured);
          if (recapture) continue;
          // avoid trivial: the captured piece should be worth >= the capturer where possible
          seen.add(fen);
          found.push({ fen, solution: [uci(cap)], piece: whitePiece, target: blackPiece });
          if (found.length >= limit) return found;
        }
      }
    }
  }
  return found;
}

// 3) Pawn promotion (optionally to a queen) that is legal; flag if it is mate.
function genPromotion(limit) {
  const found = [];
  const seen = new Set();
  for (const wpFile of [0,1,2,3,4,5,6,7]) {
    const wp = sq(wpFile, 6); // 7th rank
    for (const wk of SCATTER) {
      if (wk === wp) continue;
      for (const bk of SCATTER) {
        if (bk === wp || cheby(bk, wk) < 2) continue;
        if (bk === sq(wpFile, 7)) continue; // promotion square blocked
        const pieces = { [wk]: 'K', [bk]: 'k', [wp]: 'P' };
        const fen = buildFen(pieces, 'w');
        if (seen.has(fen)) continue;
        const c = tryLoad(fen);
        if (!c) continue;
        if (c.isCheck()) continue;
        const promo = c.moves({ verbose: true }).find(m => m.from === wp && m.promotion === 'q' && !m.captured);
        if (!promo) continue;
        const t = new Chess(fen); t.move(promo);
        seen.add(fen);
        found.push({ fen, solution: [uci(promo)], mate: t.isCheckmate() });
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

// 4) Knight fork: Nx+ gives check and forks an undefended R/Q; for EVERY black reply
//    white can capture the forked piece. 2 player moves.
function genKnightFork(targetPiece, limit, maxScan = 400000) {
  const found = [];
  const seen = new Set();
  let scan = 0;
  outer:
  for (const wk of SCATTER) {
    for (const bk of SCATTER) {
      if (cheby(bk, wk) < 2) continue;
      for (const wn of SCATTER) {
        if (wn === wk || wn === bk) continue;
        for (const bt of SCATTER) {
          if (bt === wk || bt === bk || bt === wn) continue;
          if (++scan > maxScan) break outer;
          const pieces = { [wk]: 'K', [bk]: 'k', [wn]: 'N', [bt]: targetPiece };
          const fen = buildFen(pieces, 'w');
          if (seen.has(fen)) continue;
          const c = tryLoad(fen);
          if (!c) continue;
          if (c.isCheck()) continue;
          const knightMoves = c.moves({ verbose: true }).filter(m => m.from === wn);
          for (const km of knightMoves) {
            const afterK = new Chess(fen);
            afterK.move(km);
            if (!afterK.isCheck()) continue;        // must be check
            if (afterK.isCheckmate()) continue;     // want a fork, not mate
            // knight (now on km.to) must attack the target square
            const replies = afterK.moves({ verbose: true });
            if (replies.length === 0) continue;
            // for every reply, white must be able to capture target on km.to->bt
            let cleanReply = null;
            let allWin = true;
            for (const r of replies) {
              const afterR = new Chess(afterK.fen());
              afterR.move(r);
              const cap = afterR.moves({ verbose: true }).find(m => m.from === km.to && m.to === bt && m.captured);
              if (!cap) { allWin = false; break; }
              if (!cleanReply) cleanReply = { r, cap };
            }
            if (!allWin || !cleanReply) continue;
            seen.add(fen);
            found.push({
              fen,
              solution: [uci(km), uci(cleanReply.r), uci(cleanReply.cap)],
              target: targetPiece,
            });
            break;
          }
          if (found.length >= limit) return found;
        }
      }
    }
  }
  return found;
}

// 5) Skewer/pin on a line: rook or bishop checks the king with a piece behind it;
//    king is forced to move off the line, then white captures the back piece. 2 moves.
function genSkewer(attacker, targetPiece, limit, maxScan = 400000) {
  const found = [];
  const seen = new Set();
  let scan = 0;
  outer:
  for (const wk of SCATTER) {
    for (const bk of SCATTER) {
      if (cheby(bk, wk) < 2) continue;
      for (const wa of SCATTER) {
        if (wa === wk || wa === bk) continue;
        for (const bt of SCATTER) {
          if (bt === wk || bt === bk || bt === wa) continue;
          if (++scan > maxScan) break outer;
          const pieces = { [wk]: 'K', [bk]: 'k', [wa]: attacker, [bt]: targetPiece };
          const fen = buildFen(pieces, 'w');
          if (seen.has(fen)) continue;
          const c = tryLoad(fen);
          if (!c) continue;
          if (c.isCheck()) continue;
          const attMoves = c.moves({ verbose: true }).filter(m => m.from === wa);
          for (const am of attMoves) {
            const afterA = new Chess(fen);
            afterA.move(am);
            if (!afterA.isCheck() || afterA.isCheckmate()) continue;
            const replies = afterA.moves({ verbose: true });
            if (replies.length === 0) continue;
            // require: for EVERY reply, white can then capture the target piece on bt
            let cleanReply = null;
            let allWin = true;
            for (const r of replies) {
              const afterR = new Chess(afterA.fen());
              afterR.move(r);
              const cap = afterR.moves({ verbose: true }).find(m => m.from === am.to && m.to === bt && m.captured);
              if (!cap) { allWin = false; break; }
              if (!cleanReply) cleanReply = { r, cap };
            }
            if (!allWin || !cleanReply) continue;
            seen.add(fen);
            found.push({ fen, solution: [uci(am), uci(cleanReply.r), uci(cleanReply.cap)], target: targetPiece });
            break;
          }
          if (found.length >= limit) return found;
        }
      }
    }
  }
  return found;
}

// 6) Mate in 2 with a FORCED single black reply in between.
function genMateIn2(whiteExtras, limit, maxScan = 600000) {
  const found = [];
  const seen = new Set();
  // mates concentrate when the black king is on an edge/corner — search those first
  const EDGE = SCATTER.filter(s => fileOf(s) === 0 || fileOf(s) === 7 || rankOf(s) === 0 || rankOf(s) === 7);
  let scan = 0;
  outer:
  for (const bk of EDGE) {
    for (const wk of SCATTER) {
      if (cheby(bk, wk) < 2) continue;
      for (const s1 of SCATTER) {
        if (s1 === wk || s1 === bk) continue;
        for (const s2 of SCATTER) {
          if (s2 === wk || s2 === bk || s2 === s1) continue;
          if (++scan > maxScan) break outer;
          const pieces = { [wk]: 'K', [bk]: 'k', [s1]: whiteExtras[0], [s2]: whiteExtras[1] };
          const fen = buildFen(pieces, 'w');
          if (seen.has(fen)) continue;
          const c = tryLoad(fen);
          if (!c) continue;
          if (c.isCheck()) continue;
          const moves = c.moves({ verbose: true });
          for (const m1 of moves) {
            const a1 = new Chess(fen);
            a1.move(m1);
            if (!a1.isCheck() || a1.isCheckmate()) continue;
            const replies = a1.moves({ verbose: true });
            if (replies.length !== 1) continue;     // forced
            const a2 = new Chess(a1.fen());
            a2.move(replies[0]);
            const mate = a2.moves({ verbose: true }).find(m2 => {
              const t = new Chess(a2.fen()); t.move(m2); return t.isCheckmate();
            });
            if (!mate) continue;
            seen.add(fen);
            found.push({ fen, solution: [uci(m1), uci(replies[0]), uci(mate)] });
            break;
          }
          if (found.length >= limit) return found;
        }
      }
    }
  }
  return found;
}

// ── Build the puzzle set ──────────────────────────────────────────────────────

const PIECE_NAME = { Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn',
                     q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

let counter = 0;
const used = new Set();
function pushUnique(arr, gen) {
  for (const g of gen) {
    if (used.has(g.fen)) continue;
    used.add(g.fen);
    arr.push(g);
  }
}

console.log('Generating (this runs a bounded chess.js search)...');

// Raw pools
const mateQ = genMateIn1('Q', 40);
const mateR = genMateIn1('R', 25);
const mateRback = genMateIn1('R', 12, {}); // additional rook mates
const hangQ = genHangingCapture('R', 'q', 8);
const hangR = genHangingCapture('B', 'r', 8).concat(genHangingCapture('R', 'r', 8));
const hangB = genHangingCapture('R', 'b', 6).concat(genHangingCapture('N', 'b', 4));
const hangN = genHangingCapture('B', 'n', 6).concat(genHangingCapture('R', 'n', 4));
const promo = genPromotion(16);
const forkR = genKnightFork('r', 14);
const forkQ = genKnightFork('q', 10);
const skewerQ = genSkewer('R', 'q', 10).concat(genSkewer('B', 'q', 6));
const skewerR = genSkewer('B', 'r', 8).concat(genSkewer('R', 'r', 6));
const mate2 = genMateIn2(['Q', 'K'], 14).concat(genMateIn2(['R', 'R'], 14)).concat(genMateIn2(['Q', 'R'], 12));

console.log('pool sizes:', {
  mateQ: mateQ.length, mateR: mateR.length, hangQ: hangQ.length, hangR: hangR.length,
  hangB: hangB.length, hangN: hangN.length, promo: promo.length,
  forkR: forkR.length, forkQ: forkQ.length, skewerQ: skewerQ.length,
  skewerR: skewerR.length, mate2: mate2.length,
});

// ── Hint/teaching templates ───────────────────────────────────────────────────

const T = {
  mate1: (p) => ({
    themes: ['mateIn1'],
    hints: {
      gentle: 'There is a checkmate in one move. Look for a check the king cannot escape.',
      directional: `Use your ${PIECE_NAME[p]} to deliver a check that covers every escape square.`,
      reveal: `Play the ${PIECE_NAME[p]} move that gives check with no legal reply — that is checkmate.`,
    },
    teachingPoint: 'Checkmate ends the game. Look for forcing checks where the king has no escape, no block, and no capture.',
    title: 'Checkmate in one',
  }),
  hanging: (p, t) => ({
    themes: ['hangingPiece'],
    hints: {
      gentle: 'One of the enemy pieces has no defender. Free material is the first thing to look for.',
      directional: `Your ${PIECE_NAME[p]} can reach the undefended ${PIECE_NAME[t]} in one move.`,
      reveal: `Capture the ${PIECE_NAME[t]} — it is hanging, so this wins material for free.`,
    },
    teachingPoint: 'Before every move, scan for undefended enemy pieces. Winning free material is the simplest way to gain an advantage.',
    title: `Win the ${PIECE_NAME[t]}`,
  }),
  promo: (mate) => ({
    themes: mate ? ['promotion', 'mateIn1'] : ['promotion'],
    hints: {
      gentle: 'Your pawn is one step from the far side of the board.',
      directional: 'Advance the pawn to the last rank and choose a new piece.',
      reveal: mate ? 'Promote to a queen — it is checkmate the moment the queen appears.' : 'Promote to a queen, gaining the most powerful piece on the board.',
    },
    teachingPoint: 'A pawn that reaches the far rank promotes, almost always to a queen. Passed pawns are a major endgame weapon.',
    title: mate ? 'Promote and mate' : 'Promote the pawn',
  }),
  fork: (t) => ({
    themes: ['fork'],
    hints: {
      gentle: 'A knight can attack two pieces at once with a single L-shaped jump.',
      directional: `Find the knight move that gives check and also attacks the ${PIECE_NAME[t]}.`,
      reveal: `Jump the knight to fork the king and the ${PIECE_NAME[t]}. After the king moves, capture the ${PIECE_NAME[t]}.`,
    },
    teachingPoint: 'A knight fork with check is decisive: the king must answer the check first, leaving the second target to be captured.',
    title: `Knight fork wins the ${PIECE_NAME[t]}`,
  }),
  skewer: (a, t) => ({
    themes: [a === 'B' ? 'skewer' : 'skewer'],
    hints: {
      gentle: 'Line up your piece so it checks the king with another piece behind it.',
      directional: `Give check with your ${PIECE_NAME[a]} so the king must step aside.`,
      reveal: `Check the king; when it moves off the line, capture the ${PIECE_NAME[t]} behind it.`,
    },
    teachingPoint: 'A skewer attacks a valuable piece in front; when it moves, you capture the piece lined up behind it.',
    title: `Skewer wins the ${PIECE_NAME[t]}`,
  }),
  mate2: () => ({
    themes: ['mateIn2'],
    hints: {
      gentle: 'You can force checkmate in two moves. Start with a check that gives the king only one reply.',
      directional: 'Find the check that leaves exactly one legal answer, then deliver mate.',
      reveal: 'Give the forcing check; after the only legal reply, the second move is checkmate.',
    },
    teachingPoint: 'Forcing checks limit the opponent\'s options. When a check leaves only one reply, you can calculate the mate to the end.',
    title: 'Forced mate in two',
  }),
};

function toPuzzle(id, difficulty, phase, base, info) {
  return {
    id, title: info.title, difficulty, themes: info.themes, phase,
    fen: base.fen, sideToMove: 'w', solution: base.solution,
    hints: info.hints, teachingPoint: info.teachingPoint, source: 'generated',
  };
}

// ── Assemble bands ────────────────────────────────────────────────────────────

const bands = { intro: [], beginner: [], intermediate: [], advanced: [], expert: [] };

// INTRO (24): queen mates, big hanging captures, promotion
{
  const take = [];
  pushUnique(take, mateQ.slice(0, 10).map(g => ({ ...g, _t: T.mate1('Q'), _ph: 'endgame' })));
  pushUnique(take, hangQ.slice(0, 4).map(g => ({ ...g, _t: T.hanging(g.piece, g.target), _ph: 'middlegame' })));
  pushUnique(take, hangR.slice(0, 4).map(g => ({ ...g, _t: T.hanging(g.piece, g.target), _ph: 'middlegame' })));
  pushUnique(take, promo.slice(0, 6).map(g => ({ ...g, _t: T.promo(g.mate), _ph: 'endgame' })));
  bands.intro = take.slice(0, 24);
}

// BEGINNER (28): rook mates, minor-piece hanging, knight forks (rook), some promotion-mate
{
  const take = [];
  pushUnique(take, mateR.slice(0, 10).map(g => ({ ...g, _t: T.mate1('R'), _ph: 'endgame' })));
  pushUnique(take, hangB.slice(0, 5).map(g => ({ ...g, _t: T.hanging(g.piece, g.target), _ph: 'middlegame' })));
  pushUnique(take, hangN.slice(0, 5).map(g => ({ ...g, _t: T.hanging(g.piece, g.target), _ph: 'middlegame' })));
  pushUnique(take, forkR.slice(0, 8).map(g => ({ ...g, _t: T.fork(g.target), _ph: 'middlegame' })));
  bands.beginner = take.slice(0, 28);
}

// INTERMEDIATE (28): knight forks (queen), skewers, more rook mates
{
  const take = [];
  pushUnique(take, forkQ.slice(0, 8).map(g => ({ ...g, _t: T.fork(g.target), _ph: 'middlegame' })));
  pushUnique(take, skewerR.slice(0, 8).map(g => ({ ...g, _t: T.skewer('B', g.target), _ph: 'middlegame' })));
  pushUnique(take, skewerQ.slice(0, 6).map(g => ({ ...g, _t: T.skewer('R', g.target), _ph: 'middlegame' })));
  pushUnique(take, mateRback.slice(0, 6).map(g => ({ ...g, _t: T.mate1('R'), _ph: 'endgame' })));
  bands.intermediate = take.slice(0, 28);
}

// ADVANCED (24): mate in 2, skewers winning the queen
{
  const take = [];
  pushUnique(take, mate2.slice(0, 14).map(g => ({ ...g, _t: T.mate2(), _ph: 'middlegame' })));
  pushUnique(take, skewerQ.slice(6).map(g => ({ ...g, _t: T.skewer('R', g.target), _ph: 'middlegame' })));
  pushUnique(take, forkQ.slice(8).map(g => ({ ...g, _t: T.fork(g.target), _ph: 'middlegame' })));
  bands.advanced = take.slice(0, 24);
}

// EXPERT (16): remaining forced mates in 2
{
  const take = [];
  pushUnique(take, mate2.slice(14).map(g => ({ ...g, _t: T.mate2(), _ph: 'middlegame' })));
  pushUnique(take, mateQ.slice(10, 30).map(g => ({ ...g, _t: T.mate1('Q'), _ph: 'endgame' })));
  bands.expert = take.slice(0, 16);
}

const PREFIX = { intro: 'i', beginner: 'b', intermediate: 'm', advanced: 'a', expert: 'e' };
const out = [];
for (const [band, items] of Object.entries(bands)) {
  let n = 1;
  for (const g of items) {
    const id = `${PREFIX[band]}${String(n).padStart(2, '0')}`;
    out.push(toPuzzle(id, band, g._ph, g, g._t));
    n++;
  }
}

console.log('band counts:', Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, v.length])));
console.log('total:', out.length);

// ── Final verification pass before writing ────────────────────────────────────
let errs = 0;
for (const p of out) {
  const c = tryLoad(p.fen);
  if (!c) { console.error('BAD FEN', p.id); errs++; continue; }
  for (const u of p.solution) {
    try {
      const m = c.move({ from: u.slice(0,2), to: u.slice(2,4), ...(u.length===5?{promotion:u[4]}:{}) });
      if (!m) { console.error('BAD MOVE', p.id, u); errs++; break; }
    } catch { console.error('THREW', p.id, u); errs++; break; }
  }
}
if (errs) { console.error(`${errs} verification errors — not writing.`); process.exit(1); }

// ── Emit TS ───────────────────────────────────────────────────────────────────
const header = `import type { AdultPuzzle } from './types';

// AUTO-GENERATED by scripts/generate-adult-puzzles.mjs — do not edit by hand.
// Every FEN and solution line is verified with chess.js at generation time.
// solution[] interleaves moves: even index = player, odd index = opponent reply.

export const adultPuzzles: AdultPuzzle[] = ${JSON.stringify(out, null, 2)};
`;

const target = path.resolve(process.cwd(), 'lib/puzzles/adultPuzzles.ts');
writeFileSync(target, header, 'utf-8');
console.log(`Wrote ${out.length} puzzles to ${target}`);
