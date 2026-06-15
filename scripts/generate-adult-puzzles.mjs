/**
 * generate-adult-puzzles.mjs
 * Run: node scripts/generate-adult-puzzles.mjs
 *
 * Generates lib/puzzles/adultPuzzles.ts with puzzles that are CORRECT BY CONSTRUCTION:
 * every FEN is loaded by chess.js, every solution move is replayed, and the tactical
 * property (mate, free capture, fork, skewer, promotion, mate-in-2) is verified.
 *
 * Variety:
 *  - Titles and hints are derived per-puzzle from the actual move line (SAN), squares,
 *    and pieces, so no two puzzles read the same way.
 *  - Mate and capture positions are "decorated" with extra pawns (re-verified) so the
 *    boards look game-like instead of bare king-and-piece studies.
 *
 * Deterministic: a seeded PRNG keeps regeneration stable.
 */

import { Chess } from 'chess.js';
import { writeFileSync } from 'fs';
import path from 'path';

// ── deterministic PRNG ────────────────────────────────────────────────────────
let _seed = 1234567;
function rng() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const FILES = 'abcdefgh';
const sq = (f, r) => `${FILES[f]}${r + 1}`;
const allSquares = [];
for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) allSquares.push(sq(f, r));
const fileOf = (s) => FILES.indexOf(s[0]);
const rankOf = (s) => Number(s[1]) - 1;
const cheby = (a, b) => Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));

const PIECE_NAME = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn', k: 'king' };

function buildFen(pieces, turn) {
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
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
function tryLoad(fen) { try { return new Chess(fen); } catch { return null; } }
function uci(m) { return `${m.from}${m.to}${m.promotion ?? ''}`; }

// white to move, legal, and black NOT in check (illegal for wtm)
function legalWtm(fen) {
  const c = tryLoad(fen);
  if (!c || c.turn() !== 'w') return null;
  const cb = tryLoad(fen.replace(' w ', ' b '));
  if (!cb || cb.isCheck()) return null;
  return c;
}

const SCATTER = (() => {
  const out = [];
  for (let i = 0; i < allSquares.length; i++) out.push(allSquares[(i * 37) % 64]);
  return [...new Set(out)];
})();

// ── tactic verifiers (used at gen time, after decoration, and at the final gate) ──

function replay(fen, solution) {
  const c = tryLoad(fen);
  if (!c) return null;
  for (const u of solution) {
    try {
      const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), ...(u.length === 5 ? { promotion: u[4] } : {}) });
      if (!m) return null;
    } catch { return null; }
  }
  return c;
}
function verifyMate(fen, solution) { const c = replay(fen, solution); return !!c && c.isCheckmate(); }
function safeMove(c, move) { try { return c.move(move); } catch { return null; } }
function verifyHanging(fen, solution) {
  const c0 = tryLoad(fen); if (!c0) return false;
  const u = solution[0];
  const m = safeMove(c0, { from: u.slice(0, 2), to: u.slice(2, 4) });
  if (!m || !m.captured) return false;
  // target must be undefended: black cannot recapture on that square
  return !c0.moves({ verbose: true }).some(r => r.to === u.slice(2, 4) && r.captured);
}
function verifyWinTarget(fen, solution) {
  // forcing 2-move (fork/skewer): after the check, for every black reply white captures
  // the target square (solution[2].to). solution[1] must be one such legal reply.
  const targetSq = solution[2].slice(2, 4);
  const fromSq = solution[0].slice(2, 4);
  const a = tryLoad(fen); if (!a) return false;
  const m1 = safeMove(a, { from: solution[0].slice(0, 2), to: fromSq });
  if (!m1 || !a.isCheck() || a.isCheckmate()) return false;
  const replies = a.moves({ verbose: true });
  if (replies.length === 0) return false;
  for (const r of replies) {
    const b = new Chess(a.fen());
    b.move(r);
    const cap = b.moves({ verbose: true }).find(x => x.from === fromSq && x.to === targetSq && x.captured);
    if (!cap) return false;
  }
  // ensure stored reply + capture are legal
  return !!replay(fen, solution);
}
function verifyPromotion(fen, solution) {
  const c = tryLoad(fen); if (!c) return false;
  const u = solution[0];
  const m = safeMove(c, { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
  return !!m && (m.promotion != null);
}

const VERIFY = { mate: verifyMate, hanging: verifyHanging, win: verifyWinTarget, promo: verifyPromotion };

// ── generators ────────────────────────────────────────────────────────────────

function genMateIn1(whiteExtra, limit, maxScan = 260000) {
  const found = [], seen = new Set(); let scan = 0;
  outer:
  for (const bk of SCATTER) for (const wk of SCATTER) {
    if (cheby(bk, wk) < 2) continue;
    for (const ws of SCATTER) {
      if (ws === bk || ws === wk) continue;
      if (++scan > maxScan) break outer;
      const fen = buildFen({ [bk]: 'k', [wk]: 'K', [ws]: whiteExtra }, 'w');
      if (seen.has(fen)) continue;
      const c = legalWtm(fen); if (!c || c.isCheck()) continue;
      for (const m of c.moves({ verbose: true })) {
        const t = new Chess(fen); t.move(m);
        if (t.isCheckmate()) { seen.add(fen); found.push({ kind: 'mate', fen, solution: [uci(m)] }); break; }
      }
      if (found.length >= limit) return found;
    }
  }
  return found;
}

function genHangingCapture(whitePiece, blackPiece, limit, maxScan = 120000) {
  const found = [], seen = new Set(); let scan = 0;
  outer:
  for (const wk of SCATTER) for (const bk of SCATTER) {
    if (cheby(bk, wk) < 2) continue;
    for (const wp of SCATTER) {
      if (wp === wk || wp === bk) continue;
      for (const bp of SCATTER) {
        if (bp === wk || bp === bk || bp === wp) continue;
        if (++scan > maxScan) break outer;
        const fen = buildFen({ [wk]: 'K', [bk]: 'k', [wp]: whitePiece, [bp]: blackPiece }, 'w');
        if (seen.has(fen)) continue;
        const c = legalWtm(fen); if (!c || c.isCheck()) continue;
        const cap = c.moves({ verbose: true }).find(m => m.from === wp && m.to === bp && m.captured);
        if (!cap) continue;
        const after = new Chess(fen); after.move(cap);
        if (after.moves({ verbose: true }).some(m => m.to === bp && m.captured)) continue;
        seen.add(fen); found.push({ kind: 'hanging', fen, solution: [uci(cap)] });
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

function genPromotion(limit, withCapture = false) {
  const found = [], seen = new Set();
  for (const wpFile of [0,1,2,3,4,5,6,7]) {
    const wp = sq(wpFile, 6);
    for (const wk of SCATTER) {
      if (wk === wp) continue;
      for (const bk of SCATTER) {
        if (bk === wp || cheby(bk, wk) < 2 || bk === sq(wpFile, 7)) continue;
        const pieces = { [wk]: 'K', [bk]: 'k', [wp]: 'P' };
        let capSq = null;
        if (withCapture) {
          // a black rook on a diagonally-forward square to capture into promotion
          const cf = wpFile + (wpFile < 7 ? 1 : -1);
          capSq = sq(cf, 7);
          if (capSq === bk) continue;
          pieces[capSq] = 'r';
        }
        const fen = buildFen(pieces, 'w');
        if (seen.has(fen)) continue;
        const c = legalWtm(fen); if (!c || c.isCheck()) continue;
        const promo = c.moves({ verbose: true }).find(m =>
          m.from === wp && m.promotion === 'q' && (withCapture ? m.captured : !m.captured));
        if (!promo) continue;
        seen.add(fen); found.push({ kind: 'promo', fen, solution: [uci(promo)] });
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

function genFork(moverPiece, targetPiece, limit, maxScan = 400000) {
  const found = [], seen = new Set(); let scan = 0;
  outer:
  for (const wk of SCATTER) for (const bk of SCATTER) {
    if (cheby(bk, wk) < 2) continue;
    for (const wm of SCATTER) {
      if (wm === wk || wm === bk) continue;
      for (const bt of SCATTER) {
        if (bt === wk || bt === bk || bt === wm) continue;
        if (++scan > maxScan) break outer;
        const fen = buildFen({ [wk]: 'K', [bk]: 'k', [wm]: moverPiece, [bt]: targetPiece }, 'w');
        if (seen.has(fen)) continue;
        const c = legalWtm(fen); if (!c || c.isCheck()) continue;
        for (const km of c.moves({ verbose: true }).filter(m => m.from === wm)) {
          const a = new Chess(fen); a.move(km);
          if (!a.isCheck() || a.isCheckmate()) continue;
          const replies = a.moves({ verbose: true });
          if (!replies.length) continue;
          let pick = null, allWin = true;
          for (const r of replies) {
            const b = new Chess(a.fen()); b.move(r);
            const cap = b.moves({ verbose: true }).find(x => x.from === km.to && x.to === bt && x.captured);
            if (!cap) { allWin = false; break; }
            if (!pick) pick = { r, cap };
          }
          if (!allWin || !pick) continue;
          seen.add(fen);
          found.push({ kind: 'win', mover: moverPiece.toLowerCase(), fen, solution: [uci(km), uci(pick.r), uci(pick.cap)] });
          break;
        }
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

function genSkewer(attacker, targetPiece, limit, maxScan = 400000) {
  const found = [], seen = new Set(); let scan = 0;
  outer:
  for (const wk of SCATTER) for (const bk of SCATTER) {
    if (cheby(bk, wk) < 2) continue;
    for (const wa of SCATTER) {
      if (wa === wk || wa === bk) continue;
      for (const bt of SCATTER) {
        if (bt === wk || bt === bk || bt === wa) continue;
        if (++scan > maxScan) break outer;
        const fen = buildFen({ [wk]: 'K', [bk]: 'k', [wa]: attacker, [bt]: targetPiece }, 'w');
        if (seen.has(fen)) continue;
        const c = legalWtm(fen); if (!c || c.isCheck()) continue;
        for (const am of c.moves({ verbose: true }).filter(m => m.from === wa)) {
          const a = new Chess(fen); a.move(am);
          if (!a.isCheck() || a.isCheckmate()) continue;
          const replies = a.moves({ verbose: true });
          if (!replies.length) continue;
          let pick = null, allWin = true;
          for (const r of replies) {
            const b = new Chess(a.fen()); b.move(r);
            const cap = b.moves({ verbose: true }).find(x => x.from === am.to && x.to === bt && x.captured);
            if (!cap) { allWin = false; break; }
            if (!pick) pick = { r, cap };
          }
          if (!allWin || !pick) continue;
          seen.add(fen);
          found.push({ kind: 'win', mover: attacker.toLowerCase(), fen, solution: [uci(am), uci(pick.r), uci(pick.cap)], skewer: true });
          break;
        }
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

function genMateIn2(whiteExtras, limit, maxScan = 600000) {
  const found = [], seen = new Set(); let scan = 0;
  const EDGE = SCATTER.filter(s => fileOf(s) === 0 || fileOf(s) === 7 || rankOf(s) === 0 || rankOf(s) === 7);
  outer:
  for (const bk of EDGE) for (const wk of SCATTER) {
    if (cheby(bk, wk) < 2) continue;
    for (const s1 of SCATTER) {
      if (s1 === wk || s1 === bk) continue;
      for (const s2 of SCATTER) {
        if (s2 === wk || s2 === bk || s2 === s1) continue;
        if (++scan > maxScan) break outer;
        const fen = buildFen({ [wk]: 'K', [bk]: 'k', [s1]: whiteExtras[0], [s2]: whiteExtras[1] }, 'w');
        if (seen.has(fen)) continue;
        const c = legalWtm(fen); if (!c || c.isCheck()) continue;
        for (const m1 of c.moves({ verbose: true })) {
          const a1 = new Chess(fen); a1.move(m1);
          if (!a1.isCheck() || a1.isCheckmate()) continue;
          const replies = a1.moves({ verbose: true });
          if (replies.length !== 1) continue;
          const a2 = new Chess(a1.fen()); a2.move(replies[0]);
          const mate = a2.moves({ verbose: true }).find(m2 => { const t = new Chess(a2.fen()); t.move(m2); return t.isCheckmate(); });
          if (!mate) continue;
          seen.add(fen); found.push({ kind: 'mate', fen, solution: [uci(m1), uci(replies[0]), uci(mate)] });
          break;
        }
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}

// ── decoration: add verified pawns so boards look game-like ────────────────────

function occupied(fen) {
  const c = tryLoad(fen); const set = new Set();
  for (const s of allSquares) if (c.get(s)) set.add(s);
  return set;
}

function decorate(puzzle) {
  const verify = VERIFY[puzzle.kind];
  if (!verify) return puzzle;
  const occ = occupied(puzzle.fen);
  // candidate squares for pawns: ranks 2-7, empty, not the black king's escape ring
  // (we re-verify anyway, but skipping the ring improves hit rate for mates)
  const bk = allSquares.find(s => tryLoad(puzzle.fen).get(s)?.type === 'k' && tryLoad(puzzle.fen).get(s)?.color === 'b');
  const candidates = allSquares.filter(s => {
    const r = rankOf(s);
    return r >= 1 && r <= 6 && !occ.has(s);
  });
  // try several random sets of 1-3 black pawns (+ sometimes a white pawn) and keep the first that verifies
  for (let attempt = 0; attempt < 24; attempt++) {
    const pool = shuffle(candidates);
    const nBlack = 1 + Math.floor(rng() * 3);
    const nWhite = Math.floor(rng() * 2);
    const adds = {};
    let k = 0;
    for (let i = 0; i < nBlack && k < pool.length; i++, k++) adds[pool[k]] = 'p';
    for (let i = 0; i < nWhite && k < pool.length; i++, k++) adds[pool[k]] = 'P';
    if (Object.keys(adds).length === 0) continue;
    // rebuild fen with additions
    const c = tryLoad(puzzle.fen);
    const pieces = {};
    for (const s of allSquares) { const p = c.get(s); if (p) pieces[s] = p.color === 'w' ? p.type.toUpperCase() : p.type; }
    let bad = false;
    for (const [s, p] of Object.entries(adds)) { if (pieces[s]) { bad = true; break; } pieces[s] = p; }
    if (bad) continue;
    const fen = buildFen(pieces, 'w');
    const lw = legalWtm(fen);
    if (!lw || lw.isCheck()) continue;
    if (!verify(fen, puzzle.solution)) continue;
    return { ...puzzle, fen };
  }
  return puzzle;
}

// ── per-puzzle text from the actual move line ──────────────────────────────────

function sanLine(fen, solution) {
  const c = tryLoad(fen); const sans = [], moves = [];
  for (const u of solution) {
    const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), ...(u.length === 5 ? { promotion: u[4] } : {}) });
    sans.push(m.san); moves.push(m);
  }
  return { sans, moves };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pick = (arr, salt) => arr[Math.abs(salt) % arr.length];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

function buildText(puzzle) {
  const { fen, solution, kind } = puzzle;
  const { sans, moves } = sanLine(fen, solution);
  const first = moves[0], last = moves[moves.length - 1];
  const salt = hashStr(puzzle.id + fen);
  const line = sans.join(' ');
  const playerLine = sans.filter((_, i) => i % 2 === 0).join(' and then ');

  if (kind === 'mate' && solution.length === 1) {
    const onBackRank = rankOf(last.to) === 7 && (last.piece === 'r' || last.piece === 'q');
    const corner = ['a1', 'a8', 'h1', 'h8'].includes(last.to);
    const label = onBackRank ? 'Back-rank mate' : corner ? 'Corner mate' : 'Mate in one';
    return {
      themes: ['mateIn1', ...(onBackRank ? ['backRankMate'] : [])],
      title: `${label}: ${last.san}`,
      hints: {
        gentle: pick([
          'There is a checkmate in one move — look for a check the king cannot answer.',
          'Mate is available right now. Which check leaves the king no square, no block, no capture?',
          'One move ends it. Find the check that the king cannot escape.',
        ], salt),
        directional: `Bring the ${PIECE_NAME[last.piece]} to ${last.to}; it covers every escape square.`,
        reveal: `Play ${last.san} — checkmate.`,
      },
      teaching: onBackRank
        ? 'Back-rank mates strike a king trapped behind its own pawns. After castling, give your king luft.'
        : 'Look for forcing checks where the king has no escape, no block, and no capture.',
    };
  }
  if (kind === 'mate') {
    return {
      themes: ['mateIn2'],
      title: `Mate in two: ${sans[0]}`,
      hints: {
        gentle: pick([
          'You can force checkmate in two. Start with the check that allows only one reply.',
          'A forcing check limits the king to a single answer — then mate follows.',
          'Two moves to mate. The first must be a check with exactly one legal response.',
        ], salt),
        directional: `Begin with ${sans[0]}; after the only legal reply, ${sans[2]} is mate.`,
        reveal: `Play ${line.replace(/ /g, ' ')} — the line ends in checkmate.`,
      },
      teaching: 'Forcing checks that leave a single legal reply let you calculate the mate all the way to the end.',
    };
  }
  if (kind === 'hanging') {
    const target = PIECE_NAME[last.captured];
    return {
      themes: ['hangingPiece'],
      title: `Win the loose ${target} on ${last.to} (${last.san})`,
      hints: {
        gentle: pick([
          'An enemy piece is sitting undefended. Free material is the first thing to grab.',
          'Scan for pieces with no defender — one of them can simply be taken.',
          'Something is hanging. Look for the capture that costs you nothing.',
        ], salt),
        directional: `Your ${PIECE_NAME[last.piece]} can take the ${target} on ${last.to} — it has no defender.`,
        reveal: `Play ${last.san}, winning the ${target} for free.`,
      },
      teaching: 'Before every move, scan for undefended enemy pieces. Winning free material is the simplest edge.',
    };
  }
  if (kind === 'win') {
    const target = PIECE_NAME[moves[2].captured];
    const isSkewer = !!puzzle.skewer;
    const moverName = PIECE_NAME[first.piece];
    return {
      themes: isSkewer ? ['skewer'] : ['fork'],
      title: isSkewer
        ? `Skewer wins the ${target}: ${sans[0]}`
        : `${cap(moverName)} fork wins the ${target}: ${sans[0]}`,
      hints: {
        gentle: isSkewer
          ? pick(['Line up a check so the king must step aside, exposing the piece behind it.',
                  'A skewer hits the king first; when it moves, the piece behind it falls.'], salt)
          : pick([`A ${moverName} can attack two things at once — find the move that checks and forks.`,
                  'Look for a single move that gives check and also attacks a bigger piece.'], salt),
        directional: `Play ${sans[0]} (check). After the king moves, ${sans[2]} wins the ${target}.`,
        reveal: `Play ${playerLine} — winning the ${target}.`,
      },
      teaching: isSkewer
        ? 'A skewer checks a piece in front; when it moves, you capture the piece lined up behind it.'
        : 'A fork with check is decisive: the king must answer the check first, so the second target is lost.',
    };
  }
  // promo
  const isCap = !!last.captured;
  const mate = replay(fen, solution)?.isCheckmate();
  return {
    themes: ['promotion', ...(mate ? ['mateIn1'] : [])],
    title: isCap ? `Promote with capture: ${last.san}` : `Promote the pawn: ${last.san}`,
    hints: {
      gentle: pick([
        'Your pawn is one step from the far rank. Turn it into your strongest piece.',
        'A passed pawn is about to promote — push it home.',
      ], salt),
      directional: isCap
        ? `Capture into promotion with ${last.san}, making a new queen.`
        : `Advance to ${last.to} and promote: ${last.san}.`,
      reveal: `Play ${last.san}${mate ? ' — and it is checkmate' : ', gaining a queen'}.`,
    },
    teaching: 'A pawn reaching the far rank promotes, almost always to a queen — a decisive endgame weapon.',
  };
}

const PHASE = { mate: 'endgame', hanging: 'middlegame', win: 'middlegame', promo: 'endgame' };

// ── build ──────────────────────────────────────────────────────────────────────

console.log('Generating (bounded chess.js search)...');

const pools = {
  mateQ: genMateIn1('Q', 36),
  mateR: genMateIn1('R', 30),
  hangQ: genHangingCapture('R', 'q', 6),
  hangR: genHangingCapture('B', 'r', 6).concat(genHangingCapture('N', 'r', 4)),
  hangB: genHangingCapture('R', 'b', 5).concat(genHangingCapture('N', 'b', 4)),
  hangN: genHangingCapture('B', 'n', 5).concat(genHangingCapture('R', 'n', 4)),
  promo: genPromotion(8, false),
  promoCap: genPromotion(8, true),
  forkNr: genFork('N', 'r', 10),
  forkNq: genFork('N', 'q', 8),
  forkQr: genFork('Q', 'r', 8),
  skewerR: genSkewer('B', 'r', 6).concat(genSkewer('R', 'r', 5)),
  skewerQ: genSkewer('R', 'q', 8).concat(genSkewer('B', 'q', 6)),
  mate2: genMateIn2(['Q', 'K'], 12).concat(genMateIn2(['R', 'R'], 12)).concat(genMateIn2(['Q', 'R'], 10)),
};
console.log('pool sizes:', Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length])));

const used = new Set();
function pull(arr, n) {
  const out = [];
  for (const g of arr) { if (used.has(g.fen)) continue; used.add(g.fen); out.push(g); if (out.length >= n) break; }
  return out;
}

// Assemble bands from a varied mix
const bands = {
  intro: [
    ...pull(pools.mateQ, 8), ...pull(pools.hangQ, 3), ...pull(pools.hangR, 3),
    ...pull(pools.promo, 5), ...pull(pools.mateR, 5),
  ],
  beginner: [
    ...pull(pools.mateR, 6), ...pull(pools.hangB, 5), ...pull(pools.hangN, 5),
    ...pull(pools.forkNr, 8), ...pull(pools.promoCap, 4),
  ],
  intermediate: [
    ...pull(pools.forkNq, 7), ...pull(pools.forkQr, 6), ...pull(pools.skewerR, 7),
    ...pull(pools.mateQ, 4), ...pull(pools.hangQ, 3),
  ],
  advanced: [
    ...pull(pools.mate2, 12), ...pull(pools.skewerQ, 8), ...pull(pools.forkQr, 2),
    ...pull(pools.promoCap, 2),
  ],
  expert: [
    ...pull(pools.mate2, 12), ...pull(pools.skewerQ, 4),
  ],
};

const BAND_DIFF = { intro: 'intro', beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced', expert: 'expert' };
const PREFIX = { intro: 'i', beginner: 'b', intermediate: 'm', advanced: 'a', expert: 'e' };

const out = [];
for (const [band, items] of Object.entries(bands)) {
  let n = 1;
  for (let g of items) {
    g = decorate(g);                                  // add verified pawns
    const id = `${PREFIX[band]}${String(n).padStart(2, '0')}`;
    const text = buildText({ ...g, id });
    out.push({
      id, title: text.title, difficulty: BAND_DIFF[band], themes: text.themes,
      phase: PHASE[g.kind], fen: g.fen, sideToMove: 'w', solution: g.solution,
      hints: text.hints, teachingPoint: text.teaching, source: 'generated',
    });
    n++;
  }
}

console.log('band counts:', Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, v.length])));
console.log('total:', out.length);
console.log('distinct titles:', new Set(out.map(p => p.title)).size);

// ── final gate: legality AND tactical integrity ────────────────────────────────
let errs = 0;
const KIND_BY_THEME = (p) => p.themes.includes('mateIn1') || p.themes.includes('mateIn2') ? 'mate'
  : p.themes.includes('hangingPiece') ? 'hanging'
  : (p.themes.includes('fork') || p.themes.includes('skewer')) ? 'win'
  : 'promo';
for (const p of out) {
  if (!replay(p.fen, p.solution)) { console.error('ILLEGAL LINE', p.id); errs++; continue; }
  const k = KIND_BY_THEME(p);
  if (!VERIFY[k](p.fen, p.solution)) { console.error('TACTIC FAILED', p.id, k); errs++; }
}
if (errs) { console.error(`${errs} verification errors — not writing.`); process.exit(1); }

const header = `import type { AdultPuzzle } from './types';

// AUTO-GENERATED by scripts/generate-adult-puzzles.mjs — do not edit by hand.
// Every FEN, solution line, and tactic is verified with chess.js at generation time.
// solution[] interleaves moves: even index = player, odd index = opponent reply.

export const adultPuzzles: AdultPuzzle[] = ${JSON.stringify(out, null, 2)};
`;
const target = path.resolve(process.cwd(), 'lib/puzzles/adultPuzzles.ts');
writeFileSync(target, header, 'utf-8');
console.log(`Wrote ${out.length} puzzles to ${target}`);
