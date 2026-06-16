'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  PROFILE_EMOJIS,
  addProfile,
  getActiveProfileName,
  leaderboard,
  switchProfile,
  type FamilyProfile,
} from '@/lib/family/profiles';
import { getLevel } from '@/lib/progression/xp';

export default function FamilyLeaderboardPage() {
  const [rows, setRows] = useState<FamilyProfile[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(PROFILE_EMOJIS[0]);

  const refresh = () => {
    setRows(leaderboard());
    setActive(getActiveProfileName());
  };

  useEffect(() => {
    refresh();
    const board = leaderboard();
    if (board.length === 0 || !getActiveProfileName()) {
      setShowSwitcher(true);
    }
  }, []);

  const pick = (name: string) => {
    switchProfile(name);
    setShowSwitcher(false);
    refresh();
  };

  const create = () => {
    addProfile(newName, newEmoji);
    const created = newName.trim().slice(0, 20) || 'Player';
    switchProfile(created);
    setNewName('');
    setShowAdd(false);
    setShowSwitcher(false);
    refresh();
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-teal-300 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-black">👨‍👩‍👧 Family Leaderboard</h1>
        <span className="text-sm text-slate-400">{active ? `Playing: ${active}` : 'No player'}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => setShowSwitcher(true)} className="rounded-full bg-teal-500 px-5 py-2 text-sm font-black text-slate-950 hover:bg-teal-400">
          Switch Player
        </button>
        <button onClick={() => { setShowAdd(true); setShowSwitcher(true); }} className="rounded-full border border-slate-600 px-5 py-2 text-sm font-bold">
          + Add Player
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2 text-right">XP</th>
              <th className="px-3 py-2 text-right">Games</th>
              <th className="px-3 py-2 text-right">Puzzles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  No players yet. Add one to start the leaderboard!
                </td>
              </tr>
            ) : (
              rows.map((p, i) => (
                <tr key={p.name} className={`border-t border-slate-800 ${p.name === active ? 'bg-teal-500/10' : ''}`}>
                  <td className="px-3 py-2 font-black">{i + 1}</td>
                  <td className="px-3 py-2">
                    {p.emoji} {p.name}
                  </td>
                  <td className="px-3 py-2">
                    {getLevel(p.xp).symbol} {getLevel(p.xp).name}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-teal-300">{p.xp}</td>
                  <td className="px-3 py-2 text-right">{p.gamesPlayed}</td>
                  <td className="px-3 py-2 text-right">{p.puzzlesSolved}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showSwitcher && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <h2 className="text-xl font-black">Who&apos;s playing?</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {rows.map((p) => (
                <button
                  key={p.name}
                  onClick={() => pick(p.name)}
                  className="rounded-2xl border border-slate-700 px-3 py-3 text-left hover:border-teal-400"
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="ml-2 font-bold">{p.name}</span>
                </button>
              ))}
            </div>

            {showAdd ? (
              <div className="mt-4 rounded-2xl border border-slate-700 p-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {PROFILE_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewEmoji(emoji)}
                      className={`rounded-lg px-2 py-1 text-xl ${newEmoji === emoji ? 'bg-teal-500' : 'bg-slate-800'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button onClick={create} className="mt-3 w-full rounded-xl bg-teal-500 py-2 font-black text-slate-950">
                  Create &amp; play
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)} className="mt-4 w-full rounded-xl border border-slate-600 py-2 font-bold">
                + Add new player
              </button>
            )}

            <button onClick={() => setShowSwitcher(false)} className="mt-3 w-full rounded-xl py-2 text-sm text-slate-400">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
