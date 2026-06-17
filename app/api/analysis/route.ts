import { NextResponse } from 'next/server'

type AnalysisRequest = {
  moves?: string[]
  fen?: string
  depth?: number
}

async function runStockfish(moves: string[] | undefined, fen?: string, depth = 15) {
  // Dynamically require stockfish to avoid build-time issues in environments
  // where native WASM/worker support isn't available. Fall back to a mock
  // evaluator if import fails.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stockfish = require('stockfish')
    return await new Promise((resolve) => {
      const engine = stockfish()
      let best = { score: 0, pv: [] as string[] }
      engine.onmessage = (event: any) => {
        const text = typeof event === 'string' ? event : event.data
        // parse UCI info lines
        if (text.startsWith('info')) {
          // simple parse for score and pv
          const m = text.match(/score cp (-?\\d+)/)
          if (m) best.score = parseInt(m[1], 10)
        }
        if (text.startsWith('bestmove')) {
          const parts = text.split(' ')
          resolve({ score: best.score, bestmove: parts[1] || null })
        }
      }
      engine.postMessage('uci')
      engine.postMessage('isready')
      if (fen) engine.postMessage('position fen ' + fen)
      else if (moves && moves.length) engine.postMessage('position startpos moves ' + moves.join(' '))
      engine.postMessage('go depth ' + depth)
    })
  } catch (err) {
    // fallback mock response so builds and basic usage remain stable
    return { score: 0, bestmove: null, warning: 'stockfish unavailable, returning mock response' }
  }
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json()
    const res = await runStockfish(body.moves, body.fen, body.depth ?? 15)
    return NextResponse.json({ ok: true, result: res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
