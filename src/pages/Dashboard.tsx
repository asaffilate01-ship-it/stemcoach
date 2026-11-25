import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { isLaunchSubject } from "@/lib/launchDiscovery";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { DashboardSkeleton } from "@/components/layout/DashboardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, AlertTriangle, Calendar, ArrowRight, BookOpen, Brain, Layers, BarChart3, Trophy, Star, Sparkles, FlaskConical, Headphones } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { QuotaWidget } from "@/components/dashboard/QuotaWidget";
import { getCoachStem, getDailyMotivation } from "@/lib/mascots";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("dashboard.title"));
  const { user } = useAuth();
  const { isStudent, isTeacher, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const {data,loading,error,retry}=useStudentDashboard(user?.id);
  const german=i18n.resolvedLanguage?.startsWith("de")||i18n.language?.startsWith("de");
  const locale=german?"de-DE":"en-GB";
  const copy=german?{error:"Lernfortschritt konnte nicht geladen werden",retry:"Erneut versuchen",unavailable:"Nicht verfügbar",missingStats:"Gesamtstatistik konnte nicht bestätigt werden.",sample:"Die Auswertung basiert auf bis zu 500 zuletzt gespeicherten Antworten; Tageswerte verwenden UTC.",partial:"Für einige Antworten sind Fach- oder Themeninformationen nicht verfügbar. Die Tagesaktivität enthält trotzdem alle geladenen Antworten.",empty:"Keine gespeicherten Antworten in dieser Auswahl.",activity:"Aktivität der letzten 14 Tage (UTC, geladene Antworten)",subject:"Fachgenauigkeit in der geladenen Auswahl",focus:"Übungsschwerpunkte in der geladenen Auswahl",scope:"Letzte gespeicherte Antworten",unknown:"—",quota:"Kontingent nicht bestätigt"}:{error:"Learning progress could not be loaded",retry:"Try again",unavailable:"Unavailable",missingStats:"Lifetime totals could not be verified.",sample:"Breakdowns use up to the latest 500 saved answers; activity dates are UTC.",partial:"Subject or topic information is unavailable for some answers. Daily activity still includes every loaded answer.",empty:"No saved answers in this sample.",activity:"14-day activity (UTC, loaded answers)",subject:"Subject accuracy in the loaded sample",focus:"Focus areas in the loaded sample",scope:"Latest saved answers",unknown:"—",quota:"Question balance unverified"};
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <DashboardSkeleton />
      </div>
    );
  }

  if(error||!data){
    return <div className="min-h-screen bg-background"><AppHeader/><main id="main-content" className="mx-auto max-w-2xl px-4 py-12"><section role="alert" className="rounded-2xl border bg-card p-6"><h1 className="text-xl font-semibold">{copy.error}</h1><div className="mt-4 flex flex-wrap gap-2"><Button className="min-h-11" onClick={retry}>{copy.retry}</Button><Button variant="outline" className="min-h-11" onClick={()=>navigate("/subjects")}>{t("dashboard.browseSubjects")}</Button></div></section></main></div>;
  }
  const {stats,subjectProgress,weakTopics,recentActivity,badges}=data;
  const dailyData=data.dailyData.map(row=>({...row,date:new Intl.DateTimeFormat(locale,{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(row.date+"T00:00:00Z"))}));
  const totalQ=stats?.total_questions??null;
  const accuracy=stats&&stats.total_questions>0?Math.round(100*stats.correct_answers/stats.total_questions):null;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.goodMorning");
    if (h < 17) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  })();
  const displayName = t("dashboard.student");

  const suggestedFocus = weakTopics.find(topic=>isLaunchSubject(topic.subject));
  const quickActions = [
    ...((isStudent || isTeacher || isAdmin) ? [{ label: t("nav.languageLabs"), icon: Headphones, to: "/language-labs", variant: "success" as const }] : []),
    ...((isStudent || isTeacher || isAdmin) ? [{ label: t("nav.virtualLabs"), icon: FlaskConical, to: "/virtual-labs", variant: "primary" as const }] : []),
    { label: t("dashboard.practiceAction"), icon: BookOpen, to: "/subjects", variant: "primary" as const },
    { label: t("dashboard.weakDrills"), icon: Brain, to: "/weak-drills", variant: "warning" as const },
    { label: t("dashboard.flashcardsAction"), icon: Layers, to: "/flashcards", variant: "success" as const },
    { label: t("dashboard.analyticsAction"), icon: BarChart3, to: "/analytics", variant: "accent" as const },
    { label: "School & tuition", icon: BookOpen, to: "/education-connections", variant: "primary" as const },
    { label: t("nav.studySkills"), icon: Brain, to: "/study-skills", variant: "success" as const },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
        <main id="main-content" className="container mx-auto px-4 py-5 pb-28 flex-1 md:py-8">
          {/* Welcome header with STEMCoach */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 md:mb-8"
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                className="hidden sm:block h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-border/30"
              >
                <MascotAvatar mascot={getCoachStem()} className="h-full w-full" />
              </motion.div>
              <div>
                <div className="stem-label mb-1 text-[10px] md:mb-2 md:text-[11px]">{t("dashboard.studentDashboard")}</div>
                <h1 className="stem-heading text-2xl md:text-3xl">
                  {greeting}, <span className="stem-gradient-text capitalize">{displayName}</span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-1.5 text-sm text-muted-foreground"
                >
                  {getDailyMotivation()}
                </motion.p>
                {stats?.streak > 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-warning" />
                    {t("dashboard.streakKeepGoing", { count: stats.streak })}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* One evidence-based next action before secondary navigation and scores. */}
          <section aria-labelledby="next-step-title" className="stem-card mb-5 flex flex-col gap-4 rounded-2xl p-5 md:mb-8 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="max-w-2xl">
              <p className="stem-label">{t("dashboard.nextStep")}</p>
              <h2 id="next-step-title" className="mt-2 text-xl font-bold">
                {suggestedFocus
                  ? t("dashboard.revisitTopic", { topic: suggestedFocus.topic })
                  : t("dashboard.shortPractice")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {suggestedFocus
                  ? t("dashboard.revisitDescription", { attempts: suggestedFocus.total })
                  : t("dashboard.shortPracticeDescription")}
              </p>
            </div>
            <button type="button" onClick={() => navigate(suggestedFocus ? "/weak-drills" : "/subjects")}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {suggestedFocus ? t("dashboard.openWeakDrills") : t("dashboard.startPractice")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>

          {/* Quick Actions */}
          <div className="mb-5 md:mb-8">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(action.to)}
                  className="group stem-card flex min-h-14 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left sm:gap-3 sm:p-3 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon3D icon={action.icon} variant={action.variant} size="md" />
                  <span className="min-w-0 break-words text-xs font-semibold sm:text-sm">{action.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/0 transition-all duration-300 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 hidden sm:block" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quota Widget */}
          <div className="mb-5 md:mb-8">
            <QuotaWidget />
          </div>

          {/* Stats Grid */}
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4 md:mb-8">
            {[
              { label: t("dashboard.questions"), value: totalQ===null?copy.unknown:totalQ.toLocaleString(locale), icon: Target, variant: "primary" as const },
              { label: t("dashboard.accuracy"), value: accuracy===null?copy.unknown:`${accuracy}%`, icon: TrendingUp, variant: "success" as const },
              { label: t("dashboard.streak"), value: stats?String(stats.streak):copy.unknown, icon: Flame, variant: "warning" as const, suffix: stats?` ${t("dashboard.days")}`:undefined },
              { label: t("dashboard.xp"), value: stats?stats.xp.toLocaleString(locale):copy.unknown, icon: Zap, variant: "primary" as const },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group rounded-xl border border-border/40 bg-card p-3 transition-shadow hover:shadow-premium sm:rounded-2xl sm:p-5"
                style={{ boxShadow: "var(--stem-card-shadow)" }}
              >
                <div className="mb-2 sm:mb-3">
                  <Icon3D icon={stat.icon} variant={stat.variant} size="md" />
                </div>
                <div className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {stat.value}
                  {stat.suffix && <span className="text-[10px] font-semibold text-muted-foreground sm:text-sm">{stat.suffix}</span>}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:mt-1 sm:text-[11px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {!stats && <p role="status" className="mb-4 rounded-xl border bg-card p-3 text-sm text-muted-foreground">{copy.missingStats}</p>}
          <div className="mb-4 rounded-xl border bg-card p-3 text-sm"><p>{copy.scope}: {data.sampleSize.toLocaleString(locale)}</p><p className="text-xs text-muted-foreground">{copy.sample}</p>{(data.metadataError||data.missingMetadata>0)&&<div role="status" className="mt-2 flex flex-wrap items-center gap-2"><p className="flex-1 text-xs text-muted-foreground">{copy.partial}</p><Button variant="outline" size="sm" className="min-h-11" onClick={retry}>{copy.retry}</Button></div>}</div>
          {totalQ === 0 && data.sampleSize===0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="stem-card rounded-xl p-12 text-center"
            >
              <div className="mx-auto mb-5">
                <Icon3D icon={Target} variant="primary" size="xl" className="mx-auto" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{t("dashboard.startPracticing")}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{t("dashboard.answerToSeeProgress")}</p>
              <button
                onClick={() => navigate("/subjects")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              >
                {t("dashboard.browseSubjects")} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              {/* Activity Chart */}
              {dailyData.some(d => d.questions > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="stem-card rounded-xl p-5 sm:p-6 lg:col-span-2"
                >
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Icon3D icon={Calendar} variant="primary" size="sm" />
                    {copy.activity}
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                          boxShadow: "var(--stem-card-shadow)",
                        }}
                      />
                      <Area type="monotone" dataKey="questions" stroke="hsl(var(--primary))" fill="url(#colorQ)" strokeWidth={2.5} name="Questions" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Subject Progress */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="stem-card rounded-xl p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Icon3D icon={BookOpen} variant="primary" size="sm" />
                    {copy.subject}
                  </h3>
                  <button onClick={() => navigate("/analytics")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors">
                    {t("dashboard.viewDetails")} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {subjectProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{data.missingMetadata>0||data.metadataError?copy.unavailable:copy.empty}</p>
                ) : (
                  <div className="space-y-4">
                    {subjectProgress.map((sp) => (
                      <div key={sp.subject} className="group">
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{sp.subject}</span>
                          <span className={`font-semibold tabular-nums ${sp.accuracy >= 80 ? "text-success" : sp.accuracy >= 60 ? "text-warning" : "text-destructive"}`}>{sp.accuracy}%</span>
                        </div>
                        <Progress value={sp.accuracy} className="h-2" />
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>{sp.total} {t("common.questions")}</span>
                          <span>{sp.correct} {t("common.correct")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Weak Topics */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="stem-card rounded-xl p-5 sm:p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Icon3D icon={AlertTriangle} variant="warning" size="sm" />
                  {copy.focus}
                </h3>
                {weakTopics.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{data.missingMetadata>0||data.metadataError?copy.unavailable:t("dashboard.noWeakAreas")}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {weakTopics.map((wt) => (
                      <motion.button type="button"
                        key={JSON.stringify([wt.subject,wt.topic])}
                        whileHover={{ x: 2 }}
                        className="group w-full min-h-11 rounded-xl border border-border/50 p-3 text-left transition-all hover:border-warning/20 hover:bg-warning/[0.02] focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigate("/weak-drills")}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{wt.topic}</span>
                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${wt.accuracy < 40 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{wt.accuracy}%</span>
                        </div>
                        <div className="text-xs capitalize text-muted-foreground">{wt.subject} · {wt.total} {t("dashboard.attempts")}</div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="stem-card rounded-xl p-5 sm:p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Icon3D icon={TrendingUp} variant="accent" size="sm" />
                    {t("dashboard.recentActivity")}
                  </h3>
                  <div className="space-y-2">
                    {recentActivity.map((a, i) => {
                      const ratio = a.score / a.total;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.04 }}
                          className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2.5 transition-all hover:bg-muted/30"
                        >
                          <div>
                            <div className="text-sm font-medium">{a.topic}</div>
                            <div className="text-xs capitalize text-muted-foreground">{a.subject} · {new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(a.date+"T00:00:00Z"))}</div>
                          </div>
                          <div className={`rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums ${ratio >= 0.8 ? "bg-success/10 text-success" : ratio >= 0.6 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                            {a.score}/{a.total}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="stem-card rounded-xl p-5 sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Icon3D icon={Trophy} variant="primary" size="sm" />
                      {t("dashboard.recentBadges")}
                    </h3>
                    <button onClick={() => navigate("/badges")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {badges.map((ub: any, i: number) => (
                      <motion.div
                        key={ub.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-3 text-center transition-shadow hover:shadow-premium"
                      >
                        <div className="mb-1.5 text-2xl">{ub.badges?.icon || "🏆"}</div>
                        <div className="text-xs font-bold leading-tight">{ub.badges?.name || "Badge"}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(ub.earned_at).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
