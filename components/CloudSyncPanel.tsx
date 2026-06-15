'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

const SYNC_KEYS = [
  'gmp.localGames.v1',
  'gmp.learningProgress.v1',
  'gm-family-progress',
  'gm-alpha-streak',
  'gm-alpha-goal',
  'gm-alpha-last-trained',
  'gmp-theme',
];

function localSnapshot() {
  return Object.fromEntries(SYNC_KEYS.map((key) => [key, localStorage.getItem(key)]));
}

export default function CloudSyncPanel() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) return <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">Cloud sync is ready for Supabase configuration. Local progress remains active.</div>;

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : 'Check your email for a secure sign-in link.');
  };

  const upload = async () => {
    if (!user) return;
    const { error } = await supabase.from('user_progress').upsert({ user_id: user.id, snapshot: localSnapshot(), updated_at: new Date().toISOString() });
    setMessage(error ? error.message : 'Progress synced to your account.');
  };

  const download = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('user_progress').select('snapshot').eq('user_id', user.id).maybeSingle();
    if (error) return setMessage(error.message);
    const snapshot = data?.snapshot as Record<string, string | null> | undefined;
    if (!snapshot) return setMessage('No cloud progress exists yet.');
    Object.entries(snapshot).forEach(([key, value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
    setMessage('Cloud progress restored. Reloading…');
    window.location.reload();
  };

  return <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
    {!user ? <div className="flex flex-col gap-2">
      <label htmlFor="account-email" className="text-xs font-bold text-slate-300">Account email</label>
      <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="rounded-xl border border-slate-600 bg-slate-950 p-2 text-white" />
      <button disabled={!email.includes('@')} onClick={signIn} className="rounded-xl bg-teal-400 p-2 font-bold text-slate-950 disabled:opacity-40">Email sign-in link</button>
    </div> : <div>
      <p className="font-bold text-teal-200">{user.email}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={upload} className="rounded-xl bg-teal-400 p-2 font-bold text-slate-950">Sync up</button>
        <button onClick={download} className="rounded-xl border border-slate-600 p-2 text-white">Restore</button>
      </div>
      <button onClick={() => supabase.auth.signOut()} className="mt-2 w-full rounded-xl border border-slate-700 p-2 text-xs text-slate-400">Sign out</button>
    </div>}
    {message && <p role="status" className="mt-2 text-xs text-yellow-200">{message}</p>}
  </div>;
}
