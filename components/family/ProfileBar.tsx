'use client';

import { useEffect, useState } from 'react';
import { useFamilyProfiles } from '@/lib/familyProgress';

export default function ProfileBar() {
  const { profiles, activeId, switchProfile, addProfile, renameProfile, removeProfile } = useFamilyProfiles();
  const [mounted, setMounted] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  useEffect(() => setMounted(true), []);

  // Avoid SSR/client hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return <div className="mb-4 h-[58px] rounded-3xl border border-slate-600/40 bg-slate-900/60" aria-hidden="true" />;
  }

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];

  return (
    <div className="mb-4 rounded-3xl border border-slate-600/40 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Who is playing?</p>
        <span className="text-[10px] text-slate-500">Saved on this device</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => { setRenaming(false); switchProfile(p.id); }}
            aria-pressed={p.id === activeId}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition active:scale-95 ${
              p.id === activeId
                ? 'bg-teal-400 text-slate-950'
                : 'border border-slate-600 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span aria-hidden="true">{p.emoji}</span>
            <span>{p.name}</span>
          </button>
        ))}
        <button
          onClick={() => addProfile()}
          className="rounded-full border border-dashed border-slate-500 px-3 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95"
        >
          + Add player
        </button>
      </div>

      {/* Manage the active profile */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {renaming ? (
          <form
            onSubmit={(e) => { e.preventDefault(); renameProfile(active.id, draftName); setRenaming(false); }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={20}
              aria-label="New name"
              className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white"
            />
            <button type="submit" className="rounded-lg bg-teal-400 px-3 py-1 text-xs font-bold text-slate-950">Save</button>
            <button type="button" onClick={() => setRenaming(false)} className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300">Cancel</button>
          </form>
        ) : (
          <>
            <button
              onClick={() => { setDraftName(active.name); setRenaming(true); }}
              className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              ✏️ Rename {active.emoji} {active.name}
            </button>
            {profiles.length > 1 && (
              <button
                onClick={() => { if (confirm(`Remove ${active.name} and their progress on this device?`)) removeProfile(active.id); }}
                className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                🗑 Remove
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
