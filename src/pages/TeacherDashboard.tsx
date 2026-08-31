import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Calendar, CheckCircle2, ClipboardList, Copy, ListChecks, Plus, Route, Send, Users, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { curricula, subjects } from "@/data/questions";
import { tutorials } from "@/data/tutorials";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function TeacherDashboard() {
  const { t } = useTranslation();
  useDocumentTitle(t("teacherDashboard.documentTitle"));
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [showLearningPath, setShowLearningPath] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("mathematics");
  const [newClassCurriculum, setNewClassCurriculum] = useState("uk-alevel");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignTopics, setAssignTopics] = useState("");
  const [assignCount, setAssignCount] = useState(10);
  const [assignDifficultyMin, setAssignDifficultyMin] = useState(1);
  const [assignDifficultyMax, setAssignDifficultyMax] = useState(5);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [pathTitle, setPathTitle] = useState("");
  const [pathDescription, setPathDescription] = useState("");
  const [pathDueDate, setPathDueDate] = useState("");
  const [selectedTutorialIds, setSelectedTutorialIds] = useState<string[]>([]);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("teacher_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["teacher-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select("*").eq("teacher_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const { data: assignmentResults = [] } = useQuery({
    queryKey: ["teacher-assignment-results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_teacher_assignment_results");
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const { data: learningPaths = [] } = useQuery({
    queryKey: ["teacher-learning-paths", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("class_learning_paths").select("*").eq("teacher_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const { data: learningPathItems = [] } = useQuery({
    queryKey: ["teacher-learning-path-items", learningPaths.map((path) => path.id)],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("class_learning_path_items").select("*").in("path_id", learningPaths.map((path) => path.id)).order("position");
      if (error) throw error;
      return data;
    },
    enabled: learningPaths.length > 0,
  });

  const { data: learningPathProgress = [] } = useQuery({
    queryKey: ["teacher-learning-path-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_teacher_learning_path_progress");
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const createClass = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classes").insert({ teacher_id: user!.id, name: newClassName.trim(), subject: newClassSubject, curriculum: newClassCurriculum });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      setShowCreate(false);
      setNewClassName("");
      toast({ title: t("teacherDashboard.classCreated"), description: t("teacherDashboard.classCreatedDescription") });
    },
    onError: (error: Error) => toast({ title: t("common.error"), description: error.message, variant: "destructive" }),
  });

  const createAssignment = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase.rpc("create_quiz_assignment", {
        _class_id: classId,
        _title: assignTitle.trim(),
        _description: assignDesc.trim() || undefined,
        _topics: assignTopics.split(",").map((topic) => topic.trim()).filter(Boolean),
        _question_count: Math.min(50, Math.max(1, assignCount)),
        _difficulty_min: assignDifficultyMin,
        _difficulty_max: assignDifficultyMax,
        _due_date: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-assignment-results"] });
      setShowAssign(null);
      setAssignTitle("");
      setAssignDesc("");
      setAssignTopics("");
      setAssignCount(10);
      setAssignDifficultyMin(1);
      setAssignDifficultyMax(5);
      setAssignDueDate("");
      toast({ title: t("teacherDashboard.assignmentCreated"), description: t("teacherDashboard.assignmentCreatedDescription") });
    },
    onError: (error: Error) => toast({
      title: t("common.error"),
      description: error.message.includes("Not enough reviewed questions") ? t("teacherDashboard.notEnoughQuestions") : error.message,
      variant: "destructive",
    }),
  });

  const createLearningPath = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await (supabase as any).rpc("create_class_learning_path", {
        _class_id: classId,
        _title: pathTitle.trim(),
        _description: pathDescription.trim() || undefined,
        _due_date: pathDueDate ? new Date(pathDueDate).toISOString() : undefined,
        _tutorial_ids: selectedTutorialIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-learning-paths"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-learning-path-progress"] });
      setShowLearningPath(null);
      setPathTitle("");
      setPathDescription("");
      setPathDueDate("");
      setSelectedTutorialIds([]);
      toast({ title: t("learningPaths.created"), description: t("learningPaths.createdDescription") });
    },
    onError: (error: Error) => toast({ title: t("common.error"), description: error.message, variant: "destructive" }),
  });

  const classById = useMemo(() => new Map(classes.map((classroom) => [classroom.id, classroom])), [classes]);
  const tutorialById = useMemo(() => new Map(tutorials.map((tutorial) => [tutorial.id, tutorial])), []);

  const copyCode = async (code: string | null) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: t("teacherDashboard.copied"), description: t("teacherDashboard.joinCode", { code }) });
    } catch {
      toast({ title: t("common.error"), description: t("teacherDashboard.copyFailed"), variant: "destructive" });
    }
  };

  const openLearningPathForm = (classId: string) => {
    setShowAssign(null);
    setShowLearningPath(classId);
    setPathTitle("");
    setPathDescription("");
    setPathDueDate("");
    setSelectedTutorialIds([]);
  };

  const toggleTutorial = (tutorialId: string) => {
    setSelectedTutorialIds((current) => current.includes(tutorialId)
      ? current.filter((id) => id !== tutorialId)
      : current.length < 12 ? [...current, tutorialId] : current);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="stem-label mb-2">{t("teacherDashboard.label")}</div><h1 className="stem-heading text-3xl">{t("teacherDashboard.title")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("teacherDashboard.description")}</p></div>
            <Button onClick={() => setShowCreate((current) => !current)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> {t("teacherDashboard.createClass")}</Button>
          </div>

          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="stem-card mb-6 rounded-xl p-6">
              <h2 className="mb-4 font-semibold">{t("teacherDashboard.newClass")}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label className="text-sm">{t("teacherDashboard.className")}</Label><Input value={newClassName} onChange={(event) => setNewClassName(event.target.value)} placeholder={t("teacherDashboard.classNamePlaceholder")} maxLength={120} className="mt-1.5 rounded-xl" /></div>
                <div><Label className="text-sm">{t("mockExam.subject")}</Label><select value={newClassSubject} onChange={(event) => setNewClassSubject(event.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm">{subjects.map((item) => <option key={item.id} value={item.id}>{t(`subjects.names.${item.id}`)}</option>)}</select></div>
                <div><Label className="text-sm">{t("mockExam.curriculum")}</Label><select value={newClassCurriculum} onChange={(event) => setNewClassCurriculum(event.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm">{curricula.map((item) => <option key={item.id} value={item.id}>{item.country} {item.label}</option>)}</select></div>
              </div>
              <div className="mt-4 flex gap-2"><Button onClick={() => createClass.mutate()} disabled={!newClassName.trim() || createClass.isPending} className="rounded-xl">{t("teacherDashboard.create")}</Button><Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">{t("common.cancel")}</Button></div>
            </motion.div>
          )}

          {isLoading ? <div className="text-center text-muted-foreground">{t("common.loading")}</div> : classes.length === 0 ? (
            <div className="stem-card rounded-xl p-8 text-center"><Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="mb-2 font-semibold">{t("teacherDashboard.noClasses")}</h2><p className="text-sm text-muted-foreground">{t("teacherDashboard.noClassesDescription")}</p></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {classes.map((classroom, index) => {
                const availableTutorials = tutorials.filter((tutorial) => tutorial.subject === classroom.subject);
                return (
                  <motion.article key={classroom.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="stem-card rounded-xl p-6">
                    <div className="mb-3 flex items-center justify-between"><BookOpen className="h-5 w-5 text-primary" /><button onClick={() => void copyCode(classroom.join_code)} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" />{classroom.join_code}</button></div>
                    <h2 className="mb-1 font-semibold">{classroom.name}</h2><p className="text-sm text-muted-foreground">{t(`subjects.names.${classroom.subject}`)} · {classroom.curriculum}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById("learning-path-progress")?.scrollIntoView({ behavior: "smooth" })} className="gap-1.5 rounded-xl text-xs"><BarChart3 className="h-3 w-3" /> {t("teacherDashboard.analytics")}</Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowLearningPath(null); setShowAssign(classroom.id); }} className="gap-1.5 rounded-xl text-xs"><ClipboardList className="h-3 w-3" /> {t("teacherDashboard.quizAssignment")}</Button>
                      <Button size="sm" onClick={() => openLearningPathForm(classroom.id)} disabled={availableTutorials.length === 0} className="gap-1.5 rounded-xl text-xs"><Route className="h-3 w-3" /> {t("learningPaths.create")}</Button>
                    </div>

                    {showAssign === classroom.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border-t pt-4">
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{t("teacherDashboard.newAssignment")}</h3><button aria-label={t("common.close")} onClick={() => setShowAssign(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>
                        <div className="space-y-3">
                          <div><Label className="text-xs">{t("teacherDashboard.assignmentTitle")}</Label><Input value={assignTitle} onChange={(event) => setAssignTitle(event.target.value)} placeholder={t("teacherDashboard.assignmentTitlePlaceholder")} maxLength={120} className="mt-1 rounded-xl" /></div>
                          <div><Label className="text-xs">{t("teacherDashboard.descriptionOptional")}</Label><Textarea value={assignDesc} onChange={(event) => setAssignDesc(event.target.value)} placeholder={t("teacherDashboard.descriptionPlaceholder")} rows={2} maxLength={1000} className="mt-1 resize-none rounded-xl" /></div>
                          <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">{t("teacherDashboard.topics")}</Label><Input value={assignTopics} onChange={(event) => setAssignTopics(event.target.value)} placeholder={t("teacherDashboard.topicsPlaceholder")} className="mt-1 rounded-xl" /></div><div><Label className="text-xs">{t("teacherDashboard.questions")}</Label><Input type="number" value={assignCount} onChange={(event) => setAssignCount(Number.parseInt(event.target.value, 10) || 10)} min={1} max={50} className="mt-1 rounded-xl" /></div></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label className="text-xs">{t("teacherDashboard.difficultyMin")}</Label><select value={assignDifficultyMin} onChange={(event) => { const value = Number(event.target.value); setAssignDifficultyMin(value); if (value > assignDifficultyMax) setAssignDifficultyMax(value); }} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm">{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}</select></div>
                            <div><Label className="text-xs">{t("teacherDashboard.difficultyMax")}</Label><select value={assignDifficultyMax} onChange={(event) => { const value = Number(event.target.value); setAssignDifficultyMax(value); if (value < assignDifficultyMin) setAssignDifficultyMin(value); }} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm">{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}</select></div>
                          </div>
                          <div><Label className="text-xs">{t("teacherDashboard.dueDateOptional")}</Label><Input type="datetime-local" value={assignDueDate} onChange={(event) => setAssignDueDate(event.target.value)} className="mt-1 rounded-xl" /></div>
                          <Button onClick={() => createAssignment.mutate(classroom.id)} disabled={!assignTitle.trim() || createAssignment.isPending} size="sm" className="gap-1.5 rounded-xl"><Send className="h-3.5 w-3.5" /> {t("teacherDashboard.assign")}</Button>
                        </div>
                      </motion.div>
                    )}

                    {showLearningPath === classroom.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border-t pt-4">
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{t("learningPaths.new")}</h3><button aria-label={t("common.close")} onClick={() => setShowLearningPath(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>
                        <div className="space-y-3">
                          <div><Label className="text-xs">{t("learningPaths.title")}</Label><Input value={pathTitle} onChange={(event) => setPathTitle(event.target.value)} placeholder={t("learningPaths.titlePlaceholder")} maxLength={120} className="mt-1 rounded-xl" /></div>
                          <div><Label className="text-xs">{t("teacherDashboard.descriptionOptional")}</Label><Textarea value={pathDescription} onChange={(event) => setPathDescription(event.target.value)} placeholder={t("learningPaths.descriptionPlaceholder")} rows={2} maxLength={1000} className="mt-1 resize-none rounded-xl" /></div>
                          <div><Label className="text-xs">{t("teacherDashboard.dueDateOptional")}</Label><Input type="datetime-local" value={pathDueDate} onChange={(event) => setPathDueDate(event.target.value)} className="mt-1 rounded-xl" /></div>
                          <fieldset><legend className="mb-2 text-xs font-medium">{t("learningPaths.chooseTutorials", { count: selectedTutorialIds.length })}</legend><div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                            {availableTutorials.map((tutorial) => { const selected = selectedTutorialIds.includes(tutorial.id); return <button key={tutorial.id} type="button" aria-pressed={selected} onClick={() => toggleTutorial(tutorial.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <CheckCircle2 className="h-3.5 w-3.5" />}</span><span><span className="block text-xs font-semibold">{tutorial.title}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{t(`tutorials.levels.${tutorial.level.toLowerCase()}`)} · {t("tutorials.minutes", { count: tutorial.minutes })}</span></span></button>; })}
                          </div></fieldset>
                          <Button onClick={() => createLearningPath.mutate(classroom.id)} disabled={!pathTitle.trim() || selectedTutorialIds.length === 0 || createLearningPath.isPending} size="sm" className="gap-1.5 rounded-xl"><Send className="h-3.5 w-3.5" /> {t("learningPaths.assign")}</Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}

          {learningPaths.length > 0 && (
            <section id="learning-path-progress" className="mt-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h2 className="stem-heading text-xl">{t("learningPaths.progressTitle")}</h2></div>
              <div className="grid gap-4 lg:grid-cols-2">{learningPaths.map((path) => {
                const pathItems = learningPathItems.filter((item) => item.path_id === path.id);
                const learnerRows = learningPathProgress.filter((row) => row.path_id === path.id);
                const completedLearners = learnerRows.filter((row) => row.path_completed).length;
                const completionPercent = learnerRows.length ? Math.round((completedLearners / learnerRows.length) * 100) : 0;
                const classroom = classById.get(path.class_id);
                return <article key={path.id} className="stem-card rounded-xl p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{path.title}</h3><p className="mt-1 text-xs text-muted-foreground">{classroom?.name} · {t("learningPaths.tutorialCount", { count: pathItems.length })}</p></div>{path.due_date && <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(path.due_date).toLocaleDateString()}</span>}</div><div className="mt-4"><div className="mb-1.5 flex items-center justify-between text-xs"><span>{t("learningPaths.learnersComplete", { completed: completedLearners, total: learnerRows.length })}</span><span className="font-semibold text-primary">{completionPercent}%</span></div><Progress value={completionPercent} className="h-2" /></div><div className="mt-4 space-y-2">{learnerRows.length === 0 ? <p className="text-xs text-muted-foreground">{t("learningPaths.noLearners")}</p> : learnerRows.map((row) => <div key={row.student_id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs"><span className="font-medium">{row.student_name}</span><span className={row.path_completed ? "font-semibold text-success" : "text-muted-foreground"}>{row.completed_count}/{row.tutorial_count}</span></div>)}</div>{pathItems.length > 0 && <p className="mt-3 text-[10px] leading-4 text-muted-foreground">{pathItems.map((item) => tutorialById.get(item.tutorial_id)?.title || item.tutorial_id).join(" → ")}</p>}</article>;
              })}</div>
            </section>
          )}

          {assignments.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 stem-heading text-xl">{t("teacherDashboard.recentAssignments")}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {assignments.slice(0, 10).map((assignment) => {
                  const results = assignmentResults.filter((result) => result.assignment_id === assignment.id);
                  const completedCount = results.filter((result) => result.completed_at).length;
                  const averageScore = completedCount
                    ? Math.round(results.filter((result) => result.completed_at).reduce((sum, result) => sum + ((result.score / Math.max(1, result.total)) * 100), 0) / completedCount)
                    : 0;
                  return (
                    <article key={assignment.id} className="stem-card rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{assignment.title}</h3><p className="mt-1 text-xs text-muted-foreground">{t(`subjects.names.${assignment.subject}`)} · {t("teacherDashboard.questionCount", { count: assignment.question_count })}{assignment.topics.length > 0 && ` · ${assignment.topics.join(", ")}`}</p></div>{assignment.due_date ? <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(assignment.due_date).toLocaleDateString()}</span> : <span className="flex shrink-0 items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />{t("teacherDashboard.noDeadline")}</span>}</div>
                      <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted/40 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("teacherDashboard.learnersCompleted")}</p><p className="mt-1 text-lg font-bold">{completedCount}/{results.length}</p></div><div className="rounded-lg bg-muted/40 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("teacherDashboard.averageScore")}</p><p className="mt-1 text-lg font-bold">{averageScore}%</p></div></div>
                      <div className="mt-3 space-y-2">{results.length === 0 ? <p className="text-xs text-muted-foreground">{t("teacherDashboard.noLearners")}</p> : results.map((result) => <div key={result.student_id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-xs"><span className="font-medium">{result.student_name}</span><span className={result.completed_at ? "font-semibold text-success" : "text-muted-foreground"}>{result.completed_at ? `${result.score}/${result.total}` : t("teacherDashboard.answered", { answered: result.answered_count, total: result.total })}</span></div>)}</div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
