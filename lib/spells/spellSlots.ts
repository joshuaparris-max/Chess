'use client';

export type SpellType = 'truesight' | 'rewind' | 'shield';

export type SpellSlots = {
  date: string;
  slots: Record<SpellType, number>;
};

export const SPELL_SLOTS_KEY = 'spellSlots';
export const SPELLS_ENABLED_KEY = 'gm-spells-enabled';
export const DAILY_ALLOWANCE: Record<SpellType, number> = { truesight: 1, rewind: 1, shield: 1 };

export const SPELL_META: Record<SpellType, { emoji: string; name: string }> = {
  truesight: { emoji: '🔮', name: 'True Sight' },
  rewind: { emoji: '⏪', name: 'Rewind' },
  shield: { emoji: '🛡️', name: 'Shield' },
};

function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** When false, spells are unlimited (classic mode). Default true. */
export function spellsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(SPELLS_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setSpellsEnabled(value: boolean) {
  try {
    window.localStorage.setItem(SPELLS_ENABLED_KEY, String(value));
  } catch {
    // ignore
  }
}

export function getSlots(now = new Date()): SpellSlots {
  const date = todayKey(now);
  const fresh: SpellSlots = { date, slots: { ...DAILY_ALLOWANCE } };
  if (typeof window === 'undefined') return fresh;
  try {
    const raw = window.localStorage.getItem(SPELL_SLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SpellSlots;
      if (parsed.date === date && parsed.slots) {
        return {
          date,
          slots: {
            truesight: Math.max(0, Number(parsed.slots.truesight) || 0),
            rewind: Math.max(0, Number(parsed.slots.rewind) || 0),
            shield: Math.max(0, Number(parsed.slots.shield) || 0),
          },
        };
      }
    }
  } catch {
    // regenerate below
  }
  try {
    window.localStorage.setItem(SPELL_SLOTS_KEY, JSON.stringify(fresh));
  } catch {
    // ignore
  }
  return fresh;
}

/** Try to spend a spell. Returns true if it was available (or spells are unlimited). */
export function useSpell(type: SpellType, now = new Date()): boolean {
  if (!spellsEnabled()) return true;
  const current = getSlots(now);
  if (current.slots[type] <= 0) return false;
  const next: SpellSlots = {
    date: current.date,
    slots: { ...current.slots, [type]: current.slots[type] - 1 },
  };
  try {
    window.localStorage.setItem(SPELL_SLOTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('gm-spells-changed', { detail: next }));
  } catch {
    // ignore
  }
  return true;
}
