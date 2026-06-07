import { watchCards } from '@/lib/trainingData';

export default function WatchRoom() {
  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5">
        <h2 className="text-2xl font-bold">Watch room</h2>
        <p className="mt-2 max-w-3xl text-slate-300">This alpha uses model-game study cards rather than full video. The beta version can attach YouTube embeds, PGN viewers, and engine annotations. The training purpose is to watch elite ideas and then practise the same idea in Play or Puzzles.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {watchCards.map((card) => (
          <article key={card.id} className="glass-panel rounded-3xl p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">{card.player}</p>
            <h3 className="mt-2 text-xl font-bold">{card.title}</h3>
            <p className="mt-3 text-slate-300">{card.idea}</p>
            <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
              <h4 className="font-bold text-teal-200">Position lesson</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.positionLesson}</p>
            </div>
            <div className="mt-3 rounded-2xl bg-yellow-200/10 p-4">
              <h4 className="font-bold text-yellow-100">Training takeaway</h4>
              <p className="mt-2 text-sm leading-6 text-yellow-50/90">{card.trainingTakeaway}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
