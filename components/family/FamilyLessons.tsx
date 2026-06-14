'use client';

import { useState } from 'react';
import type { Square } from 'chess.js';
import { useLocalProgress } from '@/lib/familyProgress';
import AdventureBoard from './AdventureBoard';
import ReadAloudButton from './ReadAloudButton';

// ── Piece Explorer data ────────────────────────────────────────────────────────
const PIECE_DEMOS = [
  {
    key: 'knight', symbol: '♘', name: 'Knight', sq: 'd4' as Square,
    moves: ['b3','b5','c2','c6','e2','e6','f3','f5'] as Square[],
    fact: 'The knight moves in an L-shape — two squares one way, then one square sideways. Knights are the only piece that can jump over other pieces!',
  },
  {
    key: 'rook', symbol: '♖', name: 'Rook', sq: 'd4' as Square,
    moves: ['a4','b4','c4','e4','f4','g4','h4','d1','d2','d3','d5','d6','d7','d8'] as Square[],
    fact: 'The rook moves as many squares as it likes in a straight line — up, down, left, or right. It cannot jump over other pieces.',
  },
  {
    key: 'bishop', symbol: '♗', name: 'Bishop', sq: 'd4' as Square,
    moves: ['a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'] as Square[],
    fact: 'The bishop slides diagonally, as many squares as it likes. It always stays on the same colour! Each player has one bishop for each colour.',
  },
  {
    key: 'queen', symbol: '♕', name: 'Queen', sq: 'd4' as Square,
    moves: ['a4','b4','c4','e4','f4','g4','h4','d1','d2','d3','d5','d6','d7','d8','a1','b2','c3','e5','f6','g7','h8','a7','b6','c5','e3','f2','g1'] as Square[],
    fact: 'The queen combines the rook and bishop — she can move in any direction, as many squares as she likes. The most powerful piece on the board!',
  },
  {
    key: 'king', symbol: '♔', name: 'King', sq: 'd4' as Square,
    moves: ['c3','c4','c5','d3','d5','e3','e4','e5'] as Square[],
    fact: 'The king moves one square in any direction. The king is the most important piece — if the king is trapped, the game ends! Always keep the king safe.',
  },
  {
    key: 'pawn', symbol: '♙', name: 'Pawn', sq: 'd5' as Square,
    moves: ['d6'] as Square[],
    captures: ['c6','e6'] as Square[],
    fact: 'The pawn moves one square forward. It captures diagonally — one step forward and to the side. When it reaches the far end of the board, it can become any piece — usually a queen!',
  },
] as const;

// ── Lesson list ───────────────────────────────────────────────────────────────
const LESSONS = [
  { id: 'pieces',   icon: '♟', title: 'How Each Piece Moves',             summary: 'Explore every piece and see where it can go.' },
  { id: 'check',    icon: '⚠️', title: 'Check: Keep the King Safe',        summary: 'What to do when your king is in danger.' },
  { id: 'castling', icon: '♖', title: 'Castling: A Special King Move',     summary: 'A clever move that hides the king away safely.' },
  { id: 'values',   icon: '⚖', title: 'Trading Pieces: What Are They Worth?', summary: 'Some pieces are worth more than others.' },
  { id: 'centre',   icon: '🎯', title: 'Playing Towards the Centre',        summary: 'Why the middle of the board matters most.' },
] as const;

type LessonId = typeof LESSONS[number]['id'];

// ── Small reusable rank strip for castling diagram ───────────────────────────
function RankStrip({ label, squares }: { label: string; squares: { sq: string; sym?: string; dim?: boolean }[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="flex gap-0.5">
        {squares.map(({ sq, sym, dim }) => (
          <div
            key={sq}
            className={`relative flex h-12 w-12 flex-col items-center justify-center rounded border text-center transition sm:h-14 sm:w-14 ${dim ? 'border-slate-700 bg-slate-900/40 opacity-40' : 'border-slate-600 bg-slate-800'}`}
          >
            {sym && <span className="text-2xl">{sym}</span>}
            <span className="text-[9px] font-bold text-slate-500 leading-none">{sq}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Per-lesson content ────────────────────────────────────────────────────────

function LessonPieces() {
  const [pieceKey, setPieceKey] = useState<string>('knight');
  const demo = PIECE_DEMOS.find(p => p.key === pieceKey) ?? PIECE_DEMOS[0];
  const pieces = [{ square: demo.sq, symbol: demo.symbol, label: demo.name }];
  const targets = ('captures' in demo ? demo.captures : []) as Square[];
  const legalMoves = demo.moves as Square[];

  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-200">{demo.fact}</p>
        <ReadAloudButton text={demo.fact} />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {PIECE_DEMOS.map(p => (
          <button
            key={p.key}
            onClick={() => setPieceKey(p.key)}
            className={`flex flex-col items-center rounded-xl border py-2 text-center transition active:scale-95 ${p.key === pieceKey ? 'border-teal-400 bg-teal-950/40 text-teal-100' : 'border-slate-600 bg-slate-900/40 text-slate-300 hover:bg-slate-800'}`}
          >
            <span className="text-2xl">{p.symbol}</span>
            <span className="mt-0.5 text-[10px] font-bold">{p.name}</span>
          </button>
        ))}
      </div>
      <AdventureBoard
        pieces={pieces}
        targets={targets}
        legalMoves={legalMoves}
        onSquareClick={() => {}}
      />
      <p className="mt-2 text-center text-xs text-slate-500">Dots show where the {demo.name} can move. Stars show where it can capture.</p>
    </div>
  );
}

function LessonCheck() {
  const text = "When your king is in check, it is being attacked and you must deal with it immediately. You have three options: move the king to a safe square, block the attacker with another piece, or capture the piece that is giving check.";
  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-200">{text}</p>
        <ReadAloudButton text={text} />
      </div>
      <AdventureBoard
        pieces={[
          { square: 'e1', symbol: '♔', label: 'white king — in check!' },
        ]}
        blockers={['e8']}
        blockerSymbol="♜"
        blockerLabel="black rook — giving check on the e-file"
        targets={[]}
        legalMoves={['d1','d2','f1','f2']}
        onSquareClick={() => {}}
      />
      <div className="mt-3 rounded-2xl border border-red-300/30 bg-red-950/20 p-3">
        <p className="text-sm font-bold text-red-100">The black rook is attacking the white king along the e-file. The king can escape to d1, d2, f1, or f2 (shown as dots).</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          { title: '1. Move the king', desc: 'Step the king to a safe square.' },
          { title: '2. Block the check', desc: 'Put a piece between the king and the attacker.' },
          { title: '3. Capture the attacker', desc: 'Take the piece that is giving check.' },
        ].map(o => (
          <div key={o.title} className="rounded-xl border border-slate-600/50 bg-slate-900/50 p-3">
            <p className="text-sm font-black text-teal-100">{o.title}</p>
            <p className="text-xs text-slate-400 mt-1">{o.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonCastling() {
  const text = "Castling is a special move where the king and a rook move at the same time. The king slides two squares towards the rook, and the rook jumps over to the other side. You can only castle if: neither piece has moved, there are no pieces between them, and the king is not in check.";
  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-200">{text}</p>
        <ReadAloudButton text={text} />
      </div>
      <div className="mb-3 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <RankStrip
            label="Before castling"
            squares={[
              { sq: 'e1', sym: '♔' },
              { sq: 'f1' },
              { sq: 'g1' },
              { sq: 'h1', sym: '♖' },
            ]}
          />
        </div>
        <div className="hidden sm:flex items-center text-2xl text-slate-400 self-end pb-6 px-2">→</div>
        <div className="flex-1">
          <RankStrip
            label="After castling (kingside)"
            squares={[
              { sq: 'e1', dim: true },
              { sq: 'f1', sym: '♖' },
              { sq: 'g1', sym: '♔' },
              { sq: 'h1', dim: true },
            ]}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-teal-300/30 bg-teal-950/20 p-3">
        <p className="text-sm font-bold text-teal-100 mb-2">Castling tips:</p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
          <li>Kingside castling moves the king to g1 (or g8 for Black)</li>
          <li>Queenside castling moves the king to c1 (or c8 for Black)</li>
          <li>Castling tucks your king away safely in a corner</li>
          <li>Try to castle early in the game!</li>
        </ul>
      </div>
    </div>
  );
}

function LessonValues() {
  const text = "Every chess piece is worth a certain number of points. This helps you decide whether to trade pieces. Never trade a more valuable piece for a less valuable one unless you have a very good reason!";
  const pieces = [
    { sym: '♔', name: 'King',   value: '∞', note: 'Cannot be traded — if lost, game over!' },
    { sym: '♕', name: 'Queen',  value: '9', note: 'Most powerful piece' },
    { sym: '♖', name: 'Rook',   value: '5', note: 'Very strong, especially open files' },
    { sym: '♗', name: 'Bishop', value: '3', note: 'Works best with open diagonals' },
    { sym: '♘', name: 'Knight', value: '3', note: 'Same as bishop — tricky jumper!' },
    { sym: '♙', name: 'Pawn',   value: '1', note: 'Can become a queen if it reaches the end' },
  ];
  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-200">{text}</p>
        <ReadAloudButton text={text} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-600/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="py-2 px-3 text-xs font-bold uppercase text-slate-400">Piece</th>
              <th className="py-2 px-3 text-xs font-bold uppercase text-slate-400">Points</th>
              <th className="py-2 px-3 text-xs font-bold uppercase text-slate-400 hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map(p => (
              <tr key={p.name} className="border-b border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30">
                <td className="py-3 px-3">
                  <span className="mr-2 text-2xl">{p.sym}</span>
                  <span className="font-bold text-slate-200">{p.name}</span>
                </td>
                <td className="py-3 px-3 text-xl font-black text-teal-300">{p.value}</td>
                <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded-2xl border border-yellow-300/30 bg-yellow-950/20 p-3">
        <p className="text-sm text-yellow-100"><strong>Trading tip:</strong> A queen (9) beats two rooks (5+5=10)? Actually two rooks are slightly better! And three minor pieces (3+3+3=9) equals one queen. Always count before you trade!</p>
      </div>
    </div>
  );
}

function LessonCentre() {
  const text = "The four central squares — d4, d5, e4, e5 — are the most important squares on the board. Pieces in the centre control more squares and can reach any part of the board faster. Try to put your pawns and knights in the centre early in the game!";
  // Knight on c3 attacks d5 and e4 (center squares)
  const centreTargets: Square[] = ['d4','d5','e4','e5'];
  const knightMoves: Square[] = ['a2','a4','b1','b5','d1','d5','e2','e4'];

  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 p-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-200">{text}</p>
        <ReadAloudButton text={text} />
      </div>
      <AdventureBoard
        pieces={[{ square: 'c3' as Square, symbol: '♘', label: 'white knight — controls the centre!' }]}
        targets={centreTargets}
        legalMoves={knightMoves}
        onSquareClick={() => {}}
      />
      <div className="mt-3 rounded-2xl border border-teal-300/30 bg-teal-950/20 p-3">
        <p className="text-sm text-teal-100">The knight on c3 can jump to d5 and e4 (both centre squares, shown with stars). Dots show all its other moves too. The centre squares are highlighted — see how important that region is!</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FamilyLessons() {
  const { progress, markLessonDone } = useLocalProgress();
  const [active, setActive] = useState<LessonId | null>(null);

  if (active) {
    const lesson = LESSONS.find(l => l.id === active)!;
    const done = progress.lessonsDone.includes(active);

    return (
      <div>
        <button
          onClick={() => setActive(null)}
          className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
        >
          ← Back to lessons
        </button>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-600/50 bg-slate-900/70 px-4 py-3">
          <span className="text-3xl" aria-hidden="true">{lesson.icon}</span>
          <div className="flex-1">
            <h2 className="font-black text-lg text-slate-100">{lesson.title}</h2>
            {done && <span className="text-xs font-bold text-teal-300">Completed</span>}
          </div>
        </div>

        {active === 'pieces'   && <LessonPieces />}
        {active === 'check'    && <LessonCheck />}
        {active === 'castling' && <LessonCastling />}
        {active === 'values'   && <LessonValues />}
        {active === 'centre'   && <LessonCentre />}

        <button
          onClick={() => { markLessonDone(active); setActive(null); }}
          className="mt-5 w-full min-h-[52px] rounded-2xl bg-teal-400 py-3 text-base font-black text-slate-950 hover:bg-teal-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          {done ? 'Lesson done ✓' : 'Mark as done'}
        </button>
      </div>
    );
  }

  const doneCount = LESSONS.filter(l => progress.lessonsDone.includes(l.id)).length;

  return (
    <div>
      <div className="mb-5 rounded-3xl border border-slate-600/50 bg-slate-900/60 p-5 text-center">
        <h2 className="text-2xl font-black text-slate-100">Family Lessons</h2>
        <p className="mt-1 text-slate-400 text-sm">
          {doneCount === 0 ? 'Five short lessons to build your chess knowledge together.' : `${doneCount} of 5 lessons completed`}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {LESSONS.map(l => {
          const done = progress.lessonsDone.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => setActive(l.id)}
              className="flex items-center gap-4 rounded-2xl border-2 border-slate-600/60 bg-slate-900/40 p-4 text-left hover:bg-slate-800/50 transition active:scale-95"
            >
              <span className="text-3xl shrink-0" aria-hidden="true">{l.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-100">{l.title}</p>
                <p className="text-sm text-slate-400 mt-0.5">{l.summary}</p>
              </div>
              <span className={`shrink-0 text-lg font-black transition ${done ? 'text-teal-300' : 'text-slate-600'}`}>
                {done ? '✓' : '→'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
