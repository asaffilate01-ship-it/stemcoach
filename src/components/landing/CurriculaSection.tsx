import { curricula } from "@/data/questions";

export function CurriculaSection() {
  return (
    <section className="border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="stem-label mb-3">Global Coverage</div>
          <h2 className="stem-heading text-3xl">Supports every major exam board</h2>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curricula.map((c) => (
            <div key={c.id} className="stem-card flex items-center gap-4 rounded-xl p-4">
              <span className="text-2xl">{c.country}</span>
              <div>
                <div className="font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.boards.join(" · ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
