'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import StoryCard from './StoryCard';
import ChessChallenge from './ChessChallenge';
import SuccessScreen from './SuccessScreen';
import {
  chapters,
  completeStoryChapter,
  awardSticker,
  isChapterUnlocked,
  loadStoryProgress,
  type StoryChapter,
  type StoryProgress,
} from '@/lib/story/chapters';
import { awardXP } from '@/lib/progression/xp';

type View = 'select' | 'story' | 'challenge' | 'success';

export default function StoryMode() {
  const [progress, setProgress] = useState<StoryProgress>({ chaptersComplete: [], stickersEarned: [] });
  const [activeId, setActiveId] = useState<number | null>(null);
  const [view, setView] = useState<View>('select');
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadStoryProgress());
  }, []);

  const active: StoryChapter | undefined = useMemo(
    () => chapters.find((c) => c.id === activeId),
    [activeId],
  );

  const openChapter = (chapter: StoryChapter) => {
    setActiveId(chapter.id);
    setGame(new Chess(chapter.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setFeedback(null);
    setView('story');
  };

  const finishChapter = (chapter: StoryChapter) => {
    setProgress((prev) => {
      const afterComplete = completeStoryChapter(prev, chapter.id);
      const wasNew = !prev.chaptersComplete.includes(chapter.id);
      const afterSticker = awardSticker(afterComplete, chapter.stickerId);
      if (wasNew) awardXP(30, 'Story chapter complete');
      return afterSticker;
    });
    setView('success');
  };

  const onSquareClick = (square: Square) => {
    if (!active || view !== 'challenge') return;
    const piece = game.get(square);
    const turn = game.turn();

    if (!selectedSquare) {
      if (piece?.color === turn) setSelectedSquare(square);
      return;
    }
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    if (piece?.color === turn) {
      setSelectedSquare(square);
      return;
    }

    if (selectedSquare === active.solutionMove.from && square === active.solutionMove.to) {
      const copy = new Chess(game.fen());
      try {
        copy.move({ from: selectedSquare, to: square, promotion: 'q' });
        setGame(copy);
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setFeedback('✨ Magical! ✨');
        window.setTimeout(() => finishChapter(active), 700);
      } catch {
        setFeedback('That move did not work — try again!');
        setSelectedSquare(null);
      }
      return;
    }
    setFeedback('Not quite — read the hint and try again! 🌟');
    setSelectedSquare(null);
  };

  const nextChapter = active ? chapters.find((c) => c.id === active.id + 1) : undefined;

  return (
    <section className="rounded-[2rem] border border-pink-200/40 bg-gradient-to-b from-fuchsia-950/40 to-purple-950/30 p-5 sm:p-6">
      {view === 'select' && (
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-300">Princess Story</p>
          <h2 className="mt-2 text-3xl font-black text-white">Rescue the Fairy Queen 👑</h2>
          <p className="mt-2 max-w-xl text-slate-300">
            Solve a magical chess challenge in each chapter to free the Fairy Queen from the Shadow King.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {chapters.map((chapter) => {
              const unlocked = isChapterUnlocked(chapter.id, progress.chaptersComplete);
              const done = progress.chaptersComplete.includes(chapter.id);
              return (
                <StoryCard
                  key={chapter.id}
                  emoji={unlocked ? chapter.emoji : '🔒'}
                  title={`Ch. ${chapter.id}: ${chapter.title}`}
                  story={chapter.story}
                  locked={!unlocked}
                  badge={done ? 'Complete' : undefined}
                  footer={
                    unlocked ? (
                      <button
                        type="button"
                        onClick={() => openChapter(chapter)}
                        className="inline-flex rounded-3xl bg-fuchsia-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
                      >
                        {done ? 'Play again ✨' : 'Play ▶'}
                      </button>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Finish the previous chapter
                      </span>
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {view === 'story' && active && (
        <div className="mx-auto max-w-xl">
          <StoryCard
            emoji={active.emoji}
            title={active.title}
            story={active.story}
            footer={
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setView('challenge')}
                  className="inline-flex rounded-3xl bg-fuchsia-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-fuchsia-400"
                >
                  Start Challenge ✨
                </button>
                <button
                  type="button"
                  onClick={() => setView('select')}
                  className="inline-flex rounded-3xl border border-slate-600 px-6 py-3 text-sm font-bold text-slate-200"
                >
                  Back
                </button>
              </div>
            }
          />
        </div>
      )}

      {view === 'challenge' && active && (
        <div className="mx-auto max-w-xl">
          <h2 className="text-center text-2xl font-black text-white">
            {active.emoji} {active.title}
          </h2>
          <div className="mt-4">
            <ChessChallenge
              game={game}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              onSquareClick={onSquareClick}
            />
          </div>
          <p className="mt-4 rounded-2xl bg-slate-900/70 p-4 text-center text-lg font-semibold text-fuchsia-100">
            {active.instruction}
          </p>
          {feedback && <p className="mt-2 text-center text-lg font-black text-fuchsia-300">{feedback}</p>}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setView('select')}
              className="rounded-3xl border border-slate-600 px-6 py-2 text-sm font-bold text-slate-200"
            >
              Back to Stories
            </button>
          </div>
        </div>
      )}

      {view === 'success' && active && (
        <div className="mx-auto max-w-md">
          <SuccessScreen
            rewardEmoji={active.rewardEmoji}
            rewardName={active.rewardName}
            final={!nextChapter}
            onContinue={() => {
              if (nextChapter) openChapter(nextChapter);
              else setView('select');
            }}
          />
        </div>
      )}
    </section>
  );
}
