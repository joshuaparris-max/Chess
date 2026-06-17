"use client"
import React, { useState } from 'react'

export default function BotPlayPage() {
  const [fen, setFen] = useState('startpos')
  const [level, setLevel] = useState(1)
  const [move, setMove] = useState<string | null>(null)

  async function askBot() {
    const payload = fen === 'startpos' ? { level } : { fen, level }
    const res = await fetch('/api/bot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (j.ok) setMove(j.move)
    else setMove(null)
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Adjustable Computer Opponent (scaffold)</h1>
      <label>
        Level:
        <input type="number" min={1} max={10} value={level} onChange={(e) => setLevel(parseInt(e.target.value || '1', 10))} />
      </label>
      <div style={{ marginTop: 12 }}>
        <button onClick={askBot}>Ask bot for move</button>
      </div>
      {move && <p>Bot move: {move}</p>}
    </main>
  )
}
