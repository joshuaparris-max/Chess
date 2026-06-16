'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bedtimeMode';

function applyBedtime(active: boolean) {
  if (typeof document === 'undefined') return;
  if (active) document.documentElement.setAttribute('data-bedtime', 'true');
  else document.documentElement.removeAttribute('data-bedtime');
}

/**
 * Floating "Sweet dreams mode" toggle (Ticket 2.2 — Bedtime Mode).
 * Applies a soft dark-purple night tint across the whole app, calms the board,
 * and persists in localStorage. Quieter sounds are handled by chessSounds, which
 * also reads the "bedtimeMode" key. Fully additive — nothing is removed and the
 * mode can always be toggled back off.
 */
export default function BedtimeToggle() {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = false;
    try {
      initial = window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      initial = false;
    }
    setActive(initial);
    applyBedtime(initial);
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !active;
    setActive(next);
    applyBedtime(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Persistence is best-effort.
    }
  };

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      title={active ? 'Bedtime mode is on — tap to turn off' : 'Sweet dreams mode'}
      className={`bedtime-toggle ${active ? 'bedtime-toggle-on' : ''}`}
    >
      <span aria-hidden="true">{active ? '🌙' : '🌙'}</span>
      <span className="bedtime-toggle-label">{active ? 'Bedtime on' : 'Bedtime'}</span>
    </button>
  );
}
