"use client"
import React, { useEffect, useState } from 'react'

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/puzzles')
      .then((r) => r.json())
      .then((j) => setPuzzles(j.puzzles || []))
      .catch(() => setPuzzles([]))
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>Daily Tactics (scaffold)</h1>
      <p>Simple puzzles list scaffolded for training features.</p>
      <ul>
        {puzzles.map((p) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <strong>{p.id}</strong> — rating {p.rating} — theme {p.theme}
          </li>
        ))}
      </ul>
    </main>
  )
}

