'use client';

import { BOARD_THEME_OPTIONS } from '@/lib/chess/boardThemes';

type BoardThemePickerProps = {
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
};

export default function BoardThemePicker({ selectedTheme, onSelectTheme }: BoardThemePickerProps) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
      <div>
        <p className="text-sm font-semibold text-slate-200">Board theme</p>
        <p className="text-xs text-slate-400">Pick your board colours.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {BOARD_THEME_OPTIONS.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelectTheme(theme.id)}
            className={`group rounded-2xl border p-3 text-left transition ${selectedTheme === theme.id ? 'border-teal-400 bg-teal-500/10' : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}`}
          >
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
              <div className="h-6 rounded-lg" style={{ backgroundColor: theme.light }} />
              <div className="h-6 rounded-lg" style={{ backgroundColor: theme.dark }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-slate-100">{theme.label}</span>
              {selectedTheme === theme.id && <span className="rounded-full bg-teal-400 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-950">Active</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
