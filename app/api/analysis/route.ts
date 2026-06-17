import { NextResponse } from 'next/server'

type AnalysisRequest = {
  moves?: string[]
  fen?: string
  depth?: number
}

// Lightweight fallback analysis: use chess.js to pick a legal move and return a
// mock centipawn score. This avoids bundling heavy native engine code at build
// time which causes Turbopack errors in Vercel/Next builds.
export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Chess } = require('chess.js')
    const game = new Chess(body.fen)
    if (body.moves && body.moves.length) {
      for (const mv of body.moves) {
        try { game.move(mv) } catch {}
      }
    }
    const moves = game.moves()
    const bestmove = moves && moves.length ? moves[Math.floor(Math.random() * moves.length)] : null
    const score = 0 // placeholder
    return NextResponse.json({ ok: true, result: { score, bestmove, note: 'mock analysis' } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
