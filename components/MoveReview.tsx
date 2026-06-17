"use client"
import React, { useEffect, useState } from 'react'
import { Chess } from 'chess.js'

type Props = { initialMoves?: string[] }

export default function MoveReview({ initialMoves }: Props) {
  const sample = initialMoves || ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6']
  const [index, setIndex] = useState(0)
  const [fen, setFen] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    const game = new Chess()
    for (let i = 0; i < index && i < sample.length; i++) {
      try { game.move(sample[i]) } catch { /* ignore illegal in sample */ }
    }
    setFen(game.fen())
    // request engine analysis for current fen
    fetch('/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fen: game.fen(), depth: 12 }) })
      .then((r) => r.json())
      .then((j) => setAnalysis(j.result || j))
      .catch((e) => setAnalysis({ error: String(e) }))
  }, [index])

  function next() {
    setIndex((i) => Math.min(i + 1, sample.length))
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Move-by-move Review</h2>
      <div>
        <button onClick={prev} disabled={index === 0}>Prev</button>
        <button onClick={next} disabled={index >= sample.length}>Next</button>
      </div>
      <p>Move index: {index} / {sample.length}</p>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h3>Moves</h3>
          <ol>
            {sample.map((m, i) => (
              <li key={i} style={{ fontWeight: i === index - 1 ? '700' : '400' }}>{m}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3>Engine Suggestion</h3>
          {analysis ? (
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          ) : (
            <p>Loading analysis...</p>
          )}
        </div>
      </div>
    </div>
  )
}
