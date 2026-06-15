import { beforeEach, describe, expect, it } from 'vitest';
import { loadProfiles } from '@/lib/familyProgress';

const PROFILES_KEY = 'gm-family-profiles-v1';
const LEGACY_KEY = 'gm-family-progress';
const PROGRESS_PREFIX = 'gm-family-progress::';

beforeEach(() => {
  window.localStorage.clear();
});

describe('family profiles', () => {
  it('seeds a default profile on first run', () => {
    const state = loadProfiles();
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].id).toBe('p1');
    expect(state.activeId).toBe('p1');
    // it should also persist the store
    expect(window.localStorage.getItem(PROFILES_KEY)).not.toBeNull();
  });

  it('migrates legacy single-profile progress into the default profile', () => {
    const legacy = JSON.stringify({ adventuresDone: ['knight'], lessonsDone: ['pieces'], puzzleStars: { fp01: 3 } });
    window.localStorage.setItem(LEGACY_KEY, legacy);

    loadProfiles();

    expect(window.localStorage.getItem(`${PROGRESS_PREFIX}p1`)).toBe(legacy);
  });

  it('does not overwrite already-migrated progress', () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify({ adventuresDone: ['rook'], lessonsDone: [], puzzleStars: {} }));
    window.localStorage.setItem(`${PROGRESS_PREFIX}p1`, JSON.stringify({ adventuresDone: ['bishop'], lessonsDone: [], puzzleStars: {} }));

    loadProfiles();

    expect(window.localStorage.getItem(`${PROGRESS_PREFIX}p1`)).toContain('bishop');
  });

  it('returns an existing profiles store as-is', () => {
    const stored = { profiles: [{ id: 'p1', name: 'Josh', emoji: '🦁' }, { id: 'p2', name: 'Sylvie', emoji: '🦄' }], activeId: 'p2' };
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(stored));

    const state = loadProfiles();
    expect(state.profiles).toHaveLength(2);
    expect(state.activeId).toBe('p2');
    expect(state.profiles[1].name).toBe('Sylvie');
  });

  it('falls back to the first profile when activeId is invalid', () => {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify({
      profiles: [{ id: 'p1', name: 'Josh', emoji: '🦁' }],
      activeId: 'does-not-exist',
    }));

    const state = loadProfiles();
    expect(state.activeId).toBe('p1');
  });
});
