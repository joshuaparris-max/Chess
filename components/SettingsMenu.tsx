'use client';

import { useEffect, useState } from 'react';
import BoardThemePicker from './BoardThemePicker';
import { BOARD_THEME_OPTIONS } from '@/lib/chess/boardThemes';
import { PIECE_SET_OPTIONS, getPieceSet, setPieceSet } from '@/lib/chess/pieceSets';
import { setChessSoundsEnabled } from '@/lib/audio/chessSounds';
import { getHintDensity, setHintDensity, type HintDensity } from '@/lib/settings/hintSettings';
import {
  TOGGLEABLE_SECTIONS,
  getHiddenSections,
  setSectionHidden,
} from '@/lib/settings/uiSettings';

const BOARD_THEME_KEY = 'gm-board-theme';
const CHESS_SOUNDS_KEY = 'chessSounds';
const APP_THEME_KEY = 'gmp-theme';
export const APP_THEME_CHANGE_EVENT = 'gmp-theme-change';

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [appTheme, setAppTheme] = useState<'adult' | 'family'>('adult');
  const [pieceSet, setPieceSetState] = useState('classic');
  const [soundEffects, setSoundEffects] = useState(true);
  const [hintDensity, setHintDensityState] = useState<HintDensity>('less');
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const savedTheme = window.localStorage.getItem(BOARD_THEME_KEY);
      if (savedTheme && BOARD_THEME_OPTIONS.some((t) => t.id === savedTheme)) setTheme(savedTheme);
      const savedAppTheme = window.localStorage.getItem(APP_THEME_KEY);
      if (savedAppTheme === 'adult' || savedAppTheme === 'family') setAppTheme(savedAppTheme);
      const savedSounds = window.localStorage.getItem(CHESS_SOUNDS_KEY);
      setSoundEffects(savedSounds === null ? true : savedSounds === 'true');
    } catch {
      setSoundEffects(true);
    }
    setHintDensityState(getHintDensity());
    setPieceSetState(getPieceSet());
    setHidden(getHiddenSections());
  }, [open]);

  const applyTheme = (id: string) => {
    setTheme(id);
    try {
      window.localStorage.setItem(BOARD_THEME_KEY, id);
      window.dispatchEvent(new CustomEvent('gm-board-theme-change', { detail: id }));
    } catch {
      // ignore
    }
  };

  const applyAppTheme = (id: 'adult' | 'family') => {
    setAppTheme(id);
    try {
      window.localStorage.setItem(APP_THEME_KEY, id);
      window.dispatchEvent(new CustomEvent(APP_THEME_CHANGE_EVENT, { detail: id }));
    } catch {
      // ignore
    }
  };

  const applyPieceSet = (id: string) => {
    setPieceSetState(id);
    setPieceSet(id);
  };

  const applySoundEffects = (enabled: boolean) => {
    setSoundEffects(enabled);
    try {
      window.localStorage.setItem(CHESS_SOUNDS_KEY, String(enabled));
      setChessSoundsEnabled(enabled);
    } catch {
      // ignore
    }
  };

  const applyHintDensity = (value: HintDensity) => {
    setHintDensityState(value);
    setHintDensity(value);
  };

  const toggleSection = (id: string, currentlyHidden: boolean) => {
    setSectionHidden(id, !currentlyHidden);
    setHidden(getHiddenSections());
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-600/70 bg-slate-950/70 px-4 py-2 text-sm font-black text-slate-100 transition hover:border-teal-300 hover:bg-slate-900"
        title="Settings - themes, piece style, sounds, and what's shown"
      >
        <span aria-hidden="true">⚙</span>
        <span>Settings</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[85] flex justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close settings"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-full max-w-sm overflow-y-auto bg-slate-950 p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-300"
              >
                Close
              </button>
            </div>

            <section className="mt-5">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Appearance</h3>
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <label htmlFor="settings-app-theme" className="text-sm font-semibold text-slate-200">
                  App theme
                </label>
                <select
                  id="settings-app-theme"
                  value={appTheme}
                  onChange={(event) => applyAppTheme(event.target.value as 'adult' | 'family')}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="adult">Adult dark theme</option>
                  <option value="family">Bright family theme</option>
                </select>
              </div>
              <div className="mt-3">
                <BoardThemePicker selectedTheme={theme} onSelectTheme={applyTheme} />
              </div>

              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <label htmlFor="settings-piece-style" className="text-sm font-semibold text-slate-200">
                  Piece style
                </label>
                <select
                  id="settings-piece-style"
                  value={pieceSet}
                  onChange={(event) => applyPieceSet(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  {PIECE_SET_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Play</h3>
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <label htmlFor="settings-hint-density" className="text-sm font-semibold text-slate-200">
                  Hints
                </label>
                <select
                  id="settings-hint-density"
                  value={hintDensity}
                  onChange={(event) => applyHintDensity(event.target.value as HintDensity)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="more">More hints</option>
                  <option value="less">Less hints</option>
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  More hints shows coaching nudges sooner across puzzles, play, stories, and endgames.
                </p>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-bold text-slate-100">Sound effects</span>
                    <span className="block text-xs text-slate-400">Move chimes and capture sparkles.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(event) => applySoundEffects(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-teal-400"
                    aria-label="Enable sound effects"
                  />
                </label>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Show / hide sections
              </h3>
              <p className="mt-1 text-xs text-slate-400">Hide parts of the app you do not use to reduce clutter.</p>
              <ul className="mt-3 space-y-2">
                {TOGGLEABLE_SECTIONS.map((section) => {
                  const isHidden = hidden.includes(section.id);
                  return (
                    <li key={section.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                      <label className="flex cursor-pointer items-start justify-between gap-3">
                        <span>
                          <span className="block text-sm font-bold text-slate-100">{section.label}</span>
                          <span className="block text-xs text-slate-400">{section.description}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={() => toggleSection(section.id, isHidden)}
                          className="mt-1 h-5 w-5 shrink-0 accent-teal-400"
                          aria-label={`Show ${section.label}`}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
