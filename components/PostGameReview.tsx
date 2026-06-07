"use client";
import React, { useState } from 'react';
import { GameData, ReviewResponse } from '../lib/gameReviewTypes';
import GameReviewChat from './GameReviewChat';

export default function PostGameReview({ gameData }: { gameData: GameData }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReview(detailed = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/game-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameData, detail: detailed }),
      });
      const data: ReviewResponse | { error: string } = await res.json();
      if (!res.ok) {
        setError((data as any).error || 'The AI review could not load.');
      } else {
        setSummary((data as ReviewResponse).summary);
        if (detailed && (data as ReviewResponse).detail) setDetail((data as ReviewResponse).detail!);
      }
    } catch (e) {
      setError('The AI review could not load, but your game was saved locally for this session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => requestReview(false)} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? 'Coach is reviewing your game…' : 'Review my game'}
        </button>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>Only the moves from this game are sent for review.</span>
      </div>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {summary && (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, background: '#fff' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Quick Review</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => {
              if (detail) setDetail(null);
              else requestReview(true);
            }} disabled={loading}>
              {detail ? 'Hide move-by-move review' : 'Show move-by-move review'}
            </button>
          </div>
        </div>
      )}

      {detail && (
        <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', borderLeft: '3px solid #eee', paddingLeft: 12 }}>{detail}</div>
      )}

      {summary && <div style={{ marginTop: 12 }}><GameReviewChat gameData={gameData} baseSummary={summary} /></div>}
    </div>
  );
}
