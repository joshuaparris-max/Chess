'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import StoryCard from '@/components/story/StoryCard';
import ChessChallenge from '@/components/story/ChessChallenge';
import SuccessScreen from '@/components/story/SuccessScreen';
import {
  chapters,
  completeStoryChapter,
  loadStoryProgress,
  awardSticker,
  StoryChapter,
} from '@/lib/story/chapters';

type ChapterPageProps = {
  params: { chapter: string };
};

function findChapter(id: number): StoryChapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}

function isMoveCorrect(move: { from: string; to: string }, solution: { from: string; to: string }) {
  return move.from === solution.from && move.to === solution.to;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const router = useRouter();
  const chapterId = Number(params.chapter);
  const chapter = findChapter(chapterId);
  const [progress, setProgress] = useState(loadStoryProgress());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [game, setGame] = useState(() => new Chess(chapter?.fen ?? '8/8/8/8/8/8/8/8 w - - 0 1'));
  const [hint, setHint] = useState('Tap a piece to begin the challenge.');

  useEffect(() => {
    if (!chapter) return;
    const progressState = loadStoryProgress();
    setProgress(progressState);
    setGame(new Chess(chapter.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setCompleted(false);
    setHint('Tap a piece to begin the challenge.');
  }, [chapter?.id]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare || !chapter) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare, chapter]);

  const captureSquares = useMemo(() => {
    if (!selectedSquare || !chapter) return [];
    return game.moves({ square: selectedSquare, verbose: true }).filter((move) => Boolean(move.captured)).map((move) => move.to);
  }, [game, selectedSquare, chapter]);

  const onSquareClick = (square: Square) => {
    if (!chapter || completed) return;
    const piece = game.get(square);
    if (!selectedSquare) {
      if (piece?.color === 'w') {
        setSelectedSquare(square);
        setHint('Now tap where the piece should move.');
      }
      return;
    }
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHint('Tap another white piece or try the same piece again.');
      return;
    }
    const move = game.move({ from: selectedSquare, to: square, promotion: 'q' as const });
    if (!move) {
      setSelectedSquare(null);
      setHint('That move is not legal from this square. Try again.');
      return;
    }
    setLastMove({ from: move.from, to: move.to });
    setSelectedSquare(null);
    const correct = isMoveCorrect({ from: move.from, to: move.to }, chapter.solutionMove);
    if (correct) {
      const updated = completeStoryChapter(progress, chapter.id);
      const updatedWithSticker = awardSticker(updated, chapter.stickerId);
      setProgress(updatedWithSticker);
      setCompleted(true);
      setHint('Well done! You solved the chapter.');
    } else {
      setHint('Almost there! That move is legal, but not the one the story asks for. Try again.');
      setGame(new Chess(chapter.fen));
      setLastMove(null);
      setSelectedSquare(null);
    }
  };

  if (!chapter) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-8 text-center text-slate-100">
          <p className="text-xl font-semibold">Chapter not found.</p>
          <button
            type="button"
            onClick={() => router.push('/story')}
            className="mt-6 rounded-3xl bg-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Back to Story List
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <StoryCard
            emoji={chapter.emoji}
            title={chapter.title}
            story={chapter.story}
            footer={
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-sm font-semibold text-slate-100">Challenge</p>
                <p className="mt-2 text-base leading-7">{chapter.instruction}</p>
              </div>
            }
          />

          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-pink-300">Story hint</p>
                <p className="mt-2 text-slate-200">{hint}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGame(new Chess(chapter.fen));
                  setSelectedSquare(null);
                  setLastMove(null);
                  setCompleted(false);
                  setHint('Tap a piece to begin the challenge.');
                }}
                className="rounded-3xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-900/70"
              >
                Reset chapter
              </button>
            </div>
          </div>

          {completed && (
            <SuccessScreen
              rewardEmoji={chapter.rewardEmoji}
              rewardName={chapter.rewardName}
              final={chapter.id === chapters.length}
              onContinue={() => {
                if (chapter.id === chapters.length) {
                  router.push('/story');
                } else {
                  router.push(`/story/${chapter.id + 1}`);
                }
              }}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-4">
            <p className="text-sm uppercase tracking-[0.24em] text-pink-300">Chess challenge</p>
            <div className="mt-4">
              <ChessChallenge
                game={game}
                selectedSquare={selectedSquare}
                lastMove={lastMove}
                onSquareClick={onSquareClick}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 text-slate-300">
            <p className="text-sm uppercase tracking-[0.24em] text-pink-300">Progress</p>
            <p className="mt-3 text-base text-slate-200">Completed chapters: {progress.chaptersComplete.length} / {chapters.length}</p>
            <div className="mt-4 grid gap-3">
              {chapters.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-4 py-3">
                  <span>{item.title}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${progress.chaptersComplete.includes(item.id) ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>
                    {progress.chaptersComplete.includes(item.id) ? 'Complete' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
