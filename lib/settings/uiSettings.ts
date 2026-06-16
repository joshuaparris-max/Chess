'use client';

import { useEffect, useState } from 'react';

// Section-visibility settings: let the user hide/show chunks of the UI to cut
// clutter. Hidden section ids are stored in localStorage; components subscribe
// to UI_SETTINGS_CHANGE_EVENT to re-render when toggled.

export type ToggleableSection = {
  id: string;
  label: string;
  description: string;
};

export const TOGGLEABLE_SECTIONS: ToggleableSection[] = [
  { id: 'intro', label: 'Intro blurb', description: 'The welcome paragraph at the top of the home page.' },
  { id: 'statsPanel', label: 'Stats & progress panel', description: 'XP badge, quests, study streak, daily goal and cloud sync.' },
  { id: 'explore', label: 'Explore-more links', description: 'The Train / Adventure / Progress shortcut bar.' },
  { id: 'currentRoom', label: 'Current room banner', description: 'The "Current room" summary line under the nav.' },
  { id: 'modeHint', label: 'Mode hint line', description: 'The small "Adult training / Family Chess" helper line.' },
  { id: 'coach', label: 'Coach tips (Play)', description: 'The coach guidance panel during Play.' },
];

export const HIDDEN_SECTIONS_KEY = 'gm-hidden-sections';
export const UI_SETTINGS_CHANGE_EVENT = 'gm-ui-settings-change';

export function getHiddenSections(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_SECTIONS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function isSectionHidden(id: string): boolean {
  return getHiddenSections().includes(id);
}

export function setSectionHidden(id: string, hidden: boolean) {
  const current = new Set(getHiddenSections());
  if (hidden) current.add(id);
  else current.delete(id);
  try {
    window.localStorage.setItem(HIDDEN_SECTIONS_KEY, JSON.stringify([...current]));
    window.dispatchEvent(new CustomEvent(UI_SETTINGS_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

/**
 * Subscribe to section visibility. Returns a `visible(id)` predicate that
 * re-renders the component when the user toggles sections in Settings.
 * Starts with everything visible so server and client first render match.
 */
export function useSectionVisibility() {
  const [hidden, setHidden] = useState<string[]>([]);
  useEffect(() => {
    const refresh = () => setHidden(getHiddenSections());
    refresh();
    window.addEventListener(UI_SETTINGS_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(UI_SETTINGS_CHANGE_EVENT, refresh);
  }, []);
  return (id: string) => !hidden.includes(id);
}
