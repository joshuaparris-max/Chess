import { NextResponse } from 'next/server'

type BotRequest = {
  fen?: string
  level?: number
}

export async function POST(request: Request) {
  try {
    const body: BotRequest = await request.json()
    // lightweight fallback using chess.js for legal moves
    // require dynamically to avoid build-time bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Chess } = require('chess.js')
    const game = new Chess(body.fen)
    const moves = game.moves()
    if (!moves || moves.length === 0) return NextResponse.json({ ok: false, move: null })
    // simple level: 1=random, higher = prefer captures
    let choice = moves[Math.floor(Math.random() * moves.length)]
    if ((body.level || 1) > 1) {
      const captureMoves = moves.filter((m: string) => m.includes('x'))
      if (captureMoves.length) choice = captureMoves[Math.floor(Math.random() * captureMoves.length)]
    }
    return NextResponse.json({ ok: true, move: choice })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
