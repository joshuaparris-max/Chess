'use client';

import { useEffect, useState } from 'react';
import { getRemainingMs, type ClockState } from '@/lib/clock';

function format(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function GameClock({ clock }: { clock: ClockState }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(performance.now());
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="grid grid-cols-2 gap-3" aria-label="Chess clocks">
    {(['w', 'b'] as const).map((color) => <div key={color} className={`rounded-2xl border p-3 text-center ${clock.activeColor === color ? 'border-teal-300 bg-teal-950/40' : 'border-slate-700 bg-slate-950/50'}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{color === 'w' ? 'White' : 'Black'}</p>
      <p className="mt-1 font-mono text-2xl font-black text-white">{format(getRemainingMs(clock, color, now))}</p>
    </div>)}
  </div>;
}
