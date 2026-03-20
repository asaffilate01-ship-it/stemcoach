import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Search, Sparkles, ArrowRight, GraduationCap, Clock, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subjects } from "@/data/questions";
import { mockExamTemplates, examBoardGroups, type MockExamTemplate } from "@/data/mockExamTemplates";
import { getMascot } from "@/lib/mascots";

interface ExamBrowseProps {
  onSelectTemplate: (template: MockExamTemplate) => void;
  onCustomExam: () => void;
}

export function ExamBrowse({ onSelectTemplate, onCustomExam }: ExamBrowseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string | null>(null);

  const filteredTemplates = mockExamTemplates.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !t.name.toLowerCase().includes(q) &&
        !t.board.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
    }
    if (filterSubject && t.subject !== filterSubject) return false;
    return true;
  });

  const groupedTemplates = examBoardGroups
    .map((g) => ({
      ...g,
      templates: filteredTemplates.filter((t) => g.boards.includes(t.board)),
    }))
    .filter((g) => g.templates.length > 0);

  return (
    <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 pb-24 md:py-12">
      {/* Premium Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-12 overflow-hidden rounded-3xl"
      >
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(226,70%,40%)] via-[hsl(226,70%,45%)] to-[hsl(258,60%,48%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_-10%,rgba(255,255,255,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_100%,rgba(99,102,241,0.2),transparent)]" />
        
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.04] blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute right-12 bottom-8 h-24 w-24 rounded-full border border-white/[0.06]" />
        <div className="absolute left-1/2 top-4 h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 px-8 py-12 md:px-14 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                  <Trophy className="h-4.5 w-4.5 text-amber-300" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Exam Centre</span>
              </div>
              <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                Real Exam<br className="hidden md:block" /> Simulations
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-white/55 md:text-[15px]">
                Timed practice papers modelled on AQA, Edexcel, OCR, Cambridge, IB, AP, CBSE, JEE, NEET and 20+ exam boards.
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap gap-3 md:flex-col md:items-end">
              {[
                { icon: GraduationCap, label: "60+ templates", sublabel: "Real board papers" },
                { icon: Clock, label: "Timed exams", sublabel: "Authentic conditions" },
                { icon: Target, label: "Auto-graded", sublabel: "Instant feedback" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-white/[0.06] backdrop-blur-sm"
                >
                  <chip.icon className="h-4 w-4 text-white/50" />
                  <div>
                    <div className="text-xs font-semibold text-white/90">{chip.label}</div>
                    <div className="text-[10px] text-white/40">{chip.sublabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams (e.g. AQA Physics, AP Biology, JEE Main...)"
            className="w-full rounded-2xl border border-border/60 bg-card pl-11 pr-4 py-3 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:shadow-md"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={filterSubject || ""}
            onChange={(e) => setFilterSubject(e.target.value || null)}
            className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-xs font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl gap-2 text-xs whitespace-nowrap px-5 py-3 h-auto border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            onClick={onCustomExam}
          >
            <Sparkles className="h-3.5 w-3.5" /> Custom Exam
          </Button>
        </div>
      </motion.div>

      {/* Template Groups */}
      <div className="space-y-12">
        {groupedTemplates.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + gi * 0.08, duration: 0.5 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">{group.label}</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.templates.map((template, i) => (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.04, duration: 0.35 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectTemplate(template)}
                  className="group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card text-left shadow-[var(--stem-card-shadow)] transition-all duration-300 hover:shadow-[var(--stem-card-hover)] hover:border-primary/20"
                >
                  {/* Top accent bar with gradient */}
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${template.color}, ${template.color}60, transparent)`,
                    }}
                  />
                  
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${template.color}08, transparent 70%)`,
                    }}
                  />

                  <div className="relative p-5 md:p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden ring-1 ring-border/30"
                        style={{ background: `${template.color}10` }}
                      >
                        <img
                          src={getMascot(template.subject).image}
                          alt={getMascot(template.subject).name}
                          className="h-9 w-9 object-cover"
                        />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20">
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    <h3 className="mb-1.5 text-sm font-bold leading-tight tracking-tight">{template.name}</h3>
                    <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>

                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/20">
                        <Target className="h-2.5 w-2.5" />
                        {template.questionCount} Qs
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/20">
                        <Clock className="h-2.5 w-2.5" />
                        {template.durationMinutes}m
                      </span>
                      <span className="rounded-lg bg-muted/50 px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/20">
                        {template.board}
                      </span>
                      {template.tier && (
                        <span className="rounded-lg bg-primary/8 px-2 py-1 text-[10px] font-bold text-primary ring-1 ring-primary/15">
                          {template.tier}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {groupedTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/30 ring-1 ring-border/30">
              <Search className="h-9 w-9 text-muted-foreground/50" />
            </div>
            <h3 className="mb-2 text-lg font-bold">No exams found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or clear your filters.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
