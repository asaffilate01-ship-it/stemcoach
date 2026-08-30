import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Building2, Clock, FileCheck2, Filter, Search, ShieldCheck, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { curricula, subjects } from "@/data/questions";
import { mockExamTemplates } from "@/data/mockExamTemplates";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";

export default function PastPapers() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("examLibrary.documentTitle"));
  const navigate = useNavigate();
  const [board, setBoard] = useState("all");
  const [subject, setSubject] = useState("all");
  const [curriculum, setCurriculum] = useState("all");
  const [search, setSearch] = useState("");

  const boards = useMemo(
    () => [...new Set(mockExamTemplates.map((template) => template.board))].sort((a, b) => a.localeCompare(b)),
    [],
  );
  const availableSubjectIds = useMemo(() => new Set(mockExamTemplates.map((template) => template.subject)), []);
  const availableCurriculumIds = useMemo(() => new Set(mockExamTemplates.map((template) => template.curriculum)), []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mockExamTemplates.filter((template) => {
      if (board !== "all" && template.board !== board) return false;
      if (subject !== "all" && template.subject !== subject) return false;
      if (curriculum !== "all" && template.curriculum !== curriculum) return false;
      if (query && !`${template.name} ${template.board} ${template.paper} ${template.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [board, curriculum, search, subject]);

  const clearFilters = () => {
    setBoard("all");
    setSubject("all");
    setCurriculum("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto max-w-7xl px-4 py-7 pb-28 lg:py-12">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,48%)] px-6 py-9 text-primary-foreground md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_38%)]" />
          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ring-1 ring-white/15">
              <FileCheck2 className="h-3.5 w-3.5" /> {t("examLibrary.label")}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("examLibrary.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 md:text-base">{t("examLibrary.description")}</p>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-black/10 p-3 text-xs leading-5 text-white/75 ring-1 ring-white/10">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
              <span>{t("examLibrary.copyrightNotice")}</span>
            </div>
            {normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== "en" && <p className="mt-3 text-xs text-white/65">{t("examLibrary.contentLanguageNotice")}</p>}
          </div>
        </section>

        <section aria-label={t("examLibrary.filters")} className="mb-7 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("examLibrary.search")} className="pl-9" />
            </div>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger><Building2 className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t("examLibrary.allBoards")}</SelectItem>{boards.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><BookOpen className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t("examLibrary.allSubjects")}</SelectItem>{subjects.filter((item) => availableSubjectIds.has(item.id)).map((item) => <SelectItem key={item.id} value={item.id}>{t(`subjects.names.${item.id}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={curriculum} onValueChange={setCurriculum}>
              <SelectTrigger><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t("examLibrary.allCurricula")}</SelectItem>{curricula.filter((item) => availableCurriculumIds.has(item.id)).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{t("examLibrary.results", { count: filtered.length })}</p>
          {(board !== "all" || subject !== "all" || curriculum !== "all" || search) && <Button variant="ghost" size="sm" onClick={clearFilters}>{t("examLibrary.clear")}</Button>}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <FileCheck2 className="mx-auto mb-3 h-9 w-9 text-muted-foreground/35" />
            <h2 className="font-semibold">{t("examLibrary.noResults")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("examLibrary.noResultsDescription")}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>{t("examLibrary.clear")}</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template, index) => {
              const mascot = getMascot(template.subject);
              return (
                <motion.div key={template.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.3) }}>
                  <Card className="h-full border-border/50 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <img src={mascot.image} alt={mascot.name} className="h-11 w-11 rounded-xl bg-muted object-cover" />
                        <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-bold text-primary">{template.board}</span>
                      </div>
                      <h2 className="text-base font-bold leading-snug">{template.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{template.paper}</p>
                      <p className="mt-3 line-clamp-3 flex-1 text-xs leading-5 text-muted-foreground">{template.description}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
                        <span className="rounded-lg bg-muted/50 p-2"><Target className="mx-auto mb-1 h-3.5 w-3.5" />{t("examLibrary.questions", { count: template.questionCount })}</span>
                        <span className="rounded-lg bg-muted/50 p-2"><Clock className="mx-auto mb-1 h-3.5 w-3.5" />{t("examLibrary.minutes", { count: template.durationMinutes })}</span>
                        <span className="rounded-lg bg-muted/50 p-2"><FileCheck2 className="mx-auto mb-1 h-3.5 w-3.5" />{t("examLibrary.marks", { count: template.totalMarks })}</span>
                      </div>
                      <Button className="mt-4 w-full gap-2" onClick={() => navigate(`/mock-exam?template=${encodeURIComponent(template.id)}`)}>
                        {t("examLibrary.openBlueprint")} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
