import React, { useState } from 'react'
import AccuracyGraph from '../../components/AccuracyGraph'

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sampleMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moves: sampleMoves, depth: 10 }),
      })
      const json = await res.json()
      setResult(json)
    } catch (e) {
      setResult({ ok: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Game Analysis (scaffold)</h1>
      <p>Simple scaffold for the analysis engine and accuracy graph.</p>
      <button onClick={runAnalysis} disabled={loading}>
        {loading ? 'Running...' : 'Run Analysis on Sample Moves'}
      </button>
      {result && (
        <pre style={{ marginTop: 12 }}>{JSON.stringify(result, null, 2)}</pre>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>Move Accuracy (sample)</h2>
        <AccuracyGraph accuracy={[95, 92, 97, 88, 90, 93, 85]} />
      </section>
    </main>
  )
}
