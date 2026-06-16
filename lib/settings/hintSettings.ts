'use client';

import { useEffect, useState } from 'react';

export type HintDensity = 'less' | 'more';

export const HINT_DENSITY_KEY = 'gm-hint-density';
export const HINT_SETTINGS_CHANGE_EVENT = 'gm-hint-settings-change';

export function getHintDensity(): HintDensity {
  if (typeof window === 'undefined') return 'less';
  try {
    return window.localStorage.getItem(HINT_DENSITY_KEY) === 'more' ? 'more' : 'less';
  } catch {
    return 'less';
  }
}

export function setHintDensity(value: HintDensity) {
  try {
    window.localStorage.setItem(HINT_DENSITY_KEY, value);
    window.dispatchEvent(new CustomEvent(HINT_SETTINGS_CHANGE_EVENT, { detail: value }));
  } catch {
    // Keep the app usable if storage is unavailable.
  }
}

export function useHintDensity() {
  const [density, setDensity] = useState<HintDensity>('less');

  useEffect(() => {
    const refresh = () => setDensity(getHintDensity());
    refresh();
    window.addEventListener(HINT_SETTINGS_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(HINT_SETTINGS_CHANGE_EVENT, refresh);
  }, []);

  return {
    hintDensity: density,
    moreHints: density === 'more',
  };
}
