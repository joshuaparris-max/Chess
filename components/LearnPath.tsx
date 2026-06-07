import { lessons, researchPillars } from '@/lib/trainingData';

export default function LearnPath() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="glass-panel rounded-3xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">{lesson.level} · {lesson.minutes} min</p>
                <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
                <p className="mt-2 text-slate-300">{lesson.summary}</p>
              </div>
              <span className="rounded-full border border-teal-300/40 px-3 py-1 text-sm text-teal-100">{lesson.pillar}</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <h3 className="font-bold text-teal-200">Why it matters</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{lesson.whyItMatters}</p>
                <p className="mt-3 text-sm text-yellow-100">{lesson.playerLink}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <h3 className="font-bold text-teal-200">Alpha drill</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  {lesson.drill.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="glass-panel h-fit rounded-3xl p-5">
        <h2 className="text-xl font-bold">Research pillars built in</h2>
        <div className="mt-4 space-y-3">
          {researchPillars.map((pillar) => (
            <div key={pillar.name} className="rounded-2xl border border-slate-600/50 bg-slate-950/50 p-4">
              <h3 className="font-bold text-yellow-200">{pillar.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{pillar.finding}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
