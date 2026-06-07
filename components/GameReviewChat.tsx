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
    <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Ask the coach about this game…</div>
      <div style={{ maxHeight: 220, overflow: 'auto', padding: 8, border: '1px solid #f0f0f0', borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{m.role === 'user' ? 'You' : 'Coach'}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 8 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Why was that checkmate?" style={{ flex: 1, marginRight: 8 }} />
        <button onClick={sendQuestion} disabled={loading}>{loading ? 'Coach is thinking…' : 'Ask'}</button>
      </div>
    </div>
  );
}
