import { motion } from "framer-motion";
import { curricula } from "@/data/questions";

export function CurriculaSection() {
  return (
    <section className="relative border-t py-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-14 text-center">
          <div className="stem-label mb-3">Global Coverage</div>
          <h2 className="stem-section-heading">
            Supports every <span className="stem-gradient-text">major exam board</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            From UK GCSEs to Indian JEE — one platform, every curriculum.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curricula.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="stem-card flex items-center gap-4 p-5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-3xl leading-none">
                {c.country}
              </span>
              <div>
                <div className="font-semibold text-foreground">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.boards.join(" · ")}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
