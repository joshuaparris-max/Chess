'use client';

type SuccessScreenProps = {
  rewardEmoji: string;
  rewardName: string;
  onContinue: () => void;
  final?: boolean;
};

export default function SuccessScreen({ rewardEmoji, rewardName, onContinue, final }: SuccessScreenProps) {
  return (
    <div className="rounded-[2rem] border border-emerald-400/30 bg-slate-950/80 p-8 text-center shadow-[0_25px_80px_-30px_rgba(16,185,129,0.45)]">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-400/10 text-6xl">{rewardEmoji}</div>
      <h3 className="mt-6 text-3xl font-bold text-white">You earned the {rewardName} sticker!</h3>
      <p className="mt-3 text-slate-300">
        {final ? 'Story Complete! Your princess adventure is finished with a magical crown.' : 'Great job! You unlocked a shiny reward and the next chapter is waiting.'}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex rounded-3xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
      >
        {final ? 'Back to Stories' : 'Next Chapter'}
      </button>
    </div>
  );
}
