'use client';

export default function PuzzleRushHUD({
  secondsLeft,
  score,
  streak,
  totalSeconds,
}: {
  secondsLeft: number;
  score: number;
  streak: number;
  totalSeconds: number;
}) {
  const mm = Math.floor(Math.max(0, secondsLeft) / 60);
  const ss = Math.max(0, secondsLeft) % 60;
  const low = secondsLeft <= 30;
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${low ? 'bg-red-500' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div
          className={`text-4xl font-black tabular-nums ${low ? 'animate-pulse text-red-500' : 'text-slate-100'}`}
          aria-live="off"
        >
          {mm}:{String(ss).padStart(2, '0')}
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-300">{score}</div>
          <div className="text-xs font-semibold text-slate-400">
            score · streak {streak}🔥
          </div>
        </div>
      </div>
    </div>
  );
}
