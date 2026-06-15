import ModelGameViewer, { type ModelGame } from './ModelGameViewer';

const modelGames: ModelGame[] = [
  {
    player: 'Garry Kasparov',
    title: 'Build an initiative from development',
    lesson: 'Watch White develop with threats, castle, and open the centre.',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Be7 5. Re1 O-O 6. d4 d6',
  },
  {
    player: 'Magnus Carlsen',
    title: 'Improve pieces before forcing play',
    lesson: 'Both sides develop calmly. Notice how every move improves a piece or central control.',
    pgn: '1. Nf3 d5 2. g3 Nf6 3. Bg2 e6 4. O-O Be7 5. d3 O-O 6. Nbd2 c5',
  },
  {
    player: 'Fabiano Caruana',
    title: 'A principled Queen’s Gambit setup',
    lesson: 'White challenges the centre and develops before deciding where to attack.',
    pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bg5 O-O 6. e3',
  },
];

export default function WatchRoom() {
  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5">
        <h2 className="text-2xl font-bold">Interactive model games</h2>
        <p className="mt-2 max-w-3xl text-slate-300">Step through short curated examples one move at a time. Focus on the idea, then practise it in Play or Puzzles.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {modelGames.map((game) => <ModelGameViewer key={game.title} model={game} />)}
      </div>
    </section>
  );
}
