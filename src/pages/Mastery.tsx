import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, CalendarClock, CheckCircle2, Loader2, Target, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLearnerCurriculum } from "@/hooks/useLearnerCurriculum";
import { subjects } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { getCoachStem, getMascot } from "@/lib/mascots";

interface MasteryRow {
  curriculum: string;
  subject: string;
  topic: string;
  mastery_score: number;
  confidence_score: number;
  attempts: number;
  correct_attempts: number;
  correct_streak: number;
  last_practised_at: string | null;
  next_review_at: string;
  mastery_level: "new" | "developing" | "secure" | "mastered";
}

export default function Mastery() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { curriculumId, curriculum } = useLearnerCurriculum();
  useDocumentTitle(t("mastery.title"));

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["learner-mastery", user?.id, curriculumId],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_learner_mastery_dashboard", {
        _curriculum: curriculumId || null,
      });
      if (error) throw error;
      return (data || []) as MasteryRow[];
    },
    staleTime: 30_000,
  });

  const now = Date.now();
  const summary = useMemo(() => {
    const grouped = new Map<string, MasteryRow[]>();
    rows.forEach((row) => grouped.set(row.subject, [...(grouped.get(row.subject) || []), row]));
    const subjectsSummary = [...grouped.entries()].map(([subjectId, topicRows]) => ({
      subjectId,
      rows: topicRows,
      score: Math.round(topicRows.reduce((sum, row) => sum + Number(row.mastery_score), 0) / topicRows.length),
      due: topicRows.filter((row) => new Date(row.next_review_at).getTime() <= now).length,
      mastered: topicRows.filter((row) => row.mastery_level === "mastered").length,
    })).sort((a, b) => a.score - b.score);
    const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.mastery_score), 0) / rows.length) : 0;
    return {
      subjects: subjectsSummary,
      average,
      due: rows.filter((row) => new Date(row.next_review_at).getTime() <= now).length,
      mastered: rows.filter((row) => row.mastery_level === "mastered").length,
      focus: [...rows].sort((a, b) => {
        const aDue = new Date(a.next_review_at).getTime() <= now ? 0 : 1;
        const bDue = new Date(b.next_review_at).getTime() <= now ? 0 : 1;
        return aDue - bDue || Number(a.mastery_score) - Number(b.mastery_score);
      }).slice(0, 6),
    };
  }, [rows, now]);

  if (isLoading) {
    return <div className="min-h-screen bg-background"><AppHeader /><div className="flex items-center justify-center gap-3 py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("common.loading")}</div></div>;
  }

  const focusCoach = summary.focus[0] ? getMascot(summary.focus[0].subject) : getCoachStem();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="stem-label mb-2">{t("mastery.eyebrow")}</div>
            <h1 className="stem-heading text-3xl">{t("mastery.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("mastery.subtitle", { curriculum: curriculum?.label || t("mastery.selectedCurriculum") })}</p>
          </div>
          <Button onClick={() => summary.focus[0] ? navigate(`/practice/${summary.focus[0].subject}?mode=focus`) : navigate("/subjects")} className="gap-2 rounded-xl">
            <Target className="h-4 w-4" />{t("mastery.startFocus")}
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="stem-card rounded-2xl p-8 text-center">
            <img src={focusCoach.image} alt={focusCoach.name} className="mx-auto mb-4 h-24 w-24 object-contain" />
            <h2 className="text-xl font-semibold">{t("mastery.emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{t("mastery.emptyDesc")}</p>
            <Button onClick={() => navigate("/subjects")} className="mt-6 rounded-xl">{t("mastery.takeDiagnostic")}</Button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                [t("mastery.overall"), `${summary.average}%`, TrendingUp],
                [t("mastery.dueNow"), summary.due, CalendarClock],
                [t("mastery.masteredTopics"), summary.mastered, CheckCircle2],
                [t("mastery.evidence"), rows.reduce((sum, row) => sum + row.attempts, 0), Brain],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="stem-card rounded-xl p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="stem-card rounded-2xl p-5">
                <h2 className="mb-4 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-primary" />{t("mastery.priorityTopics")}</h2>
                <div className="space-y-3">
                  {summary.focus.map((row) => {
                    const mascot = getMascot(row.subject);
                    const due = new Date(row.next_review_at).getTime() <= now;
                    return (
                      <button key={`${row.curriculum}:${row.subject}:${row.topic}`} onClick={() => navigate(`/practice/${row.subject}?mode=focus`)} className="flex w-full items-center gap-3 rounded-xl border border-border/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
                        <img src={mascot.image} alt={mascot.name} className="h-11 w-11 object-contain" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{row.topic}</div>
                          <div className="text-xs text-muted-foreground">{subjects.find((subject) => subject.id === row.subject)?.name || row.subject} · {t(`mastery.level.${row.mastery_level}`)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{Number(row.mastery_score).toFixed(0)}%</div>
                          <div className={`text-[10px] font-semibold ${due ? "text-amber-600" : "text-muted-foreground"}`}>{due ? t("mastery.reviewNow") : new Date(row.next_review_at).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="stem-card rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <img src={focusCoach.image} alt={focusCoach.name} className="h-24 w-24 shrink-0 object-contain" />
                  <div>
                    <div className="stem-label">{focusCoach.name}</div>
                    <h2 className="mt-1 font-semibold">{t("mastery.coachHeading")}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("mastery.coachMessage", { topic: summary.focus[0]?.topic, score: Number(summary.focus[0]?.mastery_score || 0).toFixed(0) })}</p>
                  </div>
                </div>
              </aside>
            </div>

            <section>
              <h2 className="mb-4 text-lg font-semibold">{t("mastery.bySubject")}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summary.subjects.map((subjectSummary, index) => {
                  const mascot = getMascot(subjectSummary.subjectId);
                  const subjectName = subjects.find((subject) => subject.id === subjectSummary.subjectId)?.name || subjectSummary.subjectId;
                  return (
                    <motion.div key={subjectSummary.subjectId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="stem-card rounded-2xl p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <img src={mascot.image} alt={mascot.name} className="h-14 w-14 object-contain" />
                        <div className="min-w-0 flex-1"><div className="font-semibold">{subjectName}</div><div className="text-xs text-muted-foreground">{mascot.name} · {subjectSummary.rows.length} {t("mastery.topics")}</div></div>
                        <div className="text-xl font-bold">{subjectSummary.score}%</div>
                      </div>
                      <Progress value={subjectSummary.score} className="h-2" />
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{subjectSummary.due} {t("mastery.due")}</span><span>{subjectSummary.mastered} {t("mastery.mastered")}</span></div>
                      <Button variant="outline" onClick={() => navigate(`/practice/${subjectSummary.subjectId}?mode=focus`)} className="mt-4 w-full rounded-xl">{t("mastery.practiseWith", { coach: mascot.name })}</Button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
