"use client";
import React, { useState } from 'react';
import { GameData } from '../lib/gameReviewTypes';

export default function GameReviewChat({ gameData, baseSummary }: { gameData: GameData; baseSummary?: string }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function sendQuestion() {
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch('/api/game-review-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameData, summary: baseSummary, question: q }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setMessages((m) => [...m, { role: 'assistant', text: data.answer }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'The AI coach is busy. Try again in a moment.' }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'The AI coach is not available right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ borderTop: '1px solid rgba(148,163,184,0.08)', marginTop: 12, paddingTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#e6eef0' }}>Ask the coach about this game…</div>
      <div style={{ maxHeight: 280, overflow: 'auto', padding: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{m.role === 'user' ? 'You' : 'Coach'}</div>
            <div style={{ background: m.role === 'user' ? '#06202a' : '#0b2840', color: '#e6eef0', padding: '10px 12px', borderRadius: 12, maxWidth: '100%' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Why was that checkmate?" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.08)', background: '#021016', color: '#e6eef0' }} />
        <button onClick={sendQuestion} disabled={loading} style={{ padding: '0 16px', height: 48, borderRadius: 10 }}>{loading ? 'Coach is thinking…' : 'Ask'}</button>
      </div>
    </div>
  );
}
