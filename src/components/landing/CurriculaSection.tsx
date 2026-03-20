import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { curricula } from "@/data/questions";
import { ChevronRight } from "lucide-react";

// Group curricula by country flag
const countryMeta: Record<string, { label: string; flag: string }> = {
  "🇬🇧": { label: "United Kingdom", flag: "🇬🇧" },
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿": { label: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  "🌍": { label: "International / IB", flag: "🌍" },
  "🇺🇸": { label: "United States", flag: "🇺🇸" },
  "🇦🇺": { label: "Australia", flag: "🇦🇺" },
  "🇳🇿": { label: "New Zealand", flag: "🇳🇿" },
  "🇨🇦": { label: "Canada", flag: "🇨🇦" },
  "🇮🇳": { label: "India", flag: "🇮🇳" },
  "🇵🇰": { label: "Pakistan", flag: "🇵🇰" },
  "🇧🇩": { label: "Bangladesh", flag: "🇧🇩" },
  "🇱🇰": { label: "Sri Lanka", flag: "🇱🇰" },
  "🇦🇪": { label: "UAE", flag: "🇦🇪" },
  "🇫🇷": { label: "France", flag: "🇫🇷" },
  "🇵🇭": { label: "Philippines", flag: "🇵🇭" },
  "🇩🇪": { label: "Deutschland", flag: "🇩🇪" },
  "🗣️": { label: "Language Certs", flag: "🗣️" },
};

function groupByCountry() {
  const groups: { key: string; label: string; flag: string; items: typeof curricula }[] = [];
  const seen = new Set<string>();

  for (const c of curricula) {
    if (!seen.has(c.country)) {
      seen.add(c.country);
      const meta = countryMeta[c.country] || { label: c.country, flag: c.country };
      groups.push({ key: c.country, label: meta.label, flag: meta.flag, items: [] });
    }
    groups.find(g => g.key === c.country)!.items.push(c);
  }
  return groups;
}

export function CurriculaSection() {
  const groups = useMemo(groupByCountry, []);
  const [activeKey, setActiveKey] = useState(groups[0]?.key || "");

  const activeGroup = groups.find(g => g.key === activeKey);

  return (
    <section className="relative border-t py-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="stem-label mb-3">Global Coverage</div>
          <h2 className="stem-section-heading">
            Supports every <span className="stem-gradient-text">major exam board</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            From UK GCSEs to the French Baccalauréat, deutsches Abitur, Philippine DepEd, UAE EmSAT, and university degrees — one platform, every curriculum, every level.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Country tabs — horizontally scrollable */}
          <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-1">
              {groups.map((g) => {
                const isActive = g.key === activeKey;
                return (
                  <button
                    key={g.key}
                    onClick={() => setActiveKey(g.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="text-sm leading-none">{g.flag}</span>
                    <span>{g.label}</span>
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-border/50 text-muted-foreground"
                    }`}>
                      {g.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Curriculum cards for active country */}
          <AnimatePresence mode="wait">
            {activeGroup && (
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {activeGroup.items.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xl leading-none">
                      {c.country}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">{c.label}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.boards.join(" · ")}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary stat */}
          <div className="mt-6 flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold">{groups.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Countries</div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <div className="text-2xl font-extrabold">{curricula.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Curricula</div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <div className="text-2xl font-extrabold">{new Set(curricula.flatMap(c => c.boards)).size}+</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Exam Boards</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
