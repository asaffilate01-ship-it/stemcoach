import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, CheckCircle2, Circle, ListChecks, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { tutorials } from "@/data/tutorials";
import { supabase } from "@/integrations/supabase/client";

interface StudentLearningPathsProps {
  classes: Array<{ id: string; name: string }>;
  userId: string;
}

export function StudentLearningPaths({ classes, userId }: StudentLearningPathsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const classIds = classes.map((classroom) => classroom.id);
  const classNames = useMemo(() => new Map(classes.map((classroom) => [classroom.id, classroom.name])), [classes]);
  const tutorialById = useMemo(() => new Map(tutorials.map((tutorial) => [tutorial.id, tutorial])), []);

  const { data: paths = [], isLoading, error } = useQuery({
    queryKey: ["student-learning-paths", userId, classIds],
    queryFn: async () => {
      const { data, error: queryError } = await (supabase as any).from("class_learning_paths").select("*").in("class_id", classIds).order("due_date", { ascending: true, nullsFirst: false });
      if (queryError) throw queryError;
      return data;
    },
    enabled: classIds.length > 0,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["student-learning-path-items", paths.map((path) => path.id)],
    queryFn: async () => {
      const { data, error: queryError } = await (supabase as any).from("class_learning_path_items").select("*").in("path_id", paths.map((path) => path.id)).order("position");
      if (queryError) throw queryError;
      return data;
    },
    enabled: paths.length > 0,
  });

  const tutorialIds = [...new Set(items.map((item) => String(item.tutorial_id)))] as string[];
  const { data: progress = [] } = useQuery({
    queryKey: ["student-learning-path-tutorial-progress", userId, tutorialIds],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("user_tutorial_progress").select("tutorial_id, completed_at, last_opened_at").in("tutorial_id", tutorialIds);
      if (queryError) throw queryError;
      return data;
    },
    enabled: tutorialIds.length > 0,
  });

  const completedIds = new Set(progress.filter((row) => row.completed_at).map((row) => row.tutorial_id));

  if (isLoading) return <div className="mb-8 text-sm text-muted-foreground">{t("learningPaths.loading")}</div>;
  if (error) return <div className="mb-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{t("learningPaths.loadFailed")}</div>;
  if (paths.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Route className="h-5 w-5 text-primary" />{t("learningPaths.assignedTitle")}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {paths.map((path) => {
          const pathItems = items.filter((item) => item.path_id === path.id);
          const completedCount = pathItems.filter((item) => completedIds.has(item.tutorial_id)).length;
          const completionPercent = pathItems.length ? Math.round((completedCount / pathItems.length) * 100) : 0;
          const nextItem = pathItems.find((item) => !completedIds.has(item.tutorial_id));
          const isComplete = pathItems.length > 0 && completedCount === pathItems.length;
          const isOverdue = !isComplete && Boolean(path.due_date && new Date(path.due_date) < new Date());
          return (
            <article key={path.id} className={`stem-card rounded-xl p-5 ${isOverdue ? "border-2 border-destructive/20" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">{classNames.get(path.class_id)}</p><h3 className="mt-1 font-semibold">{path.title}</h3>{path.description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{path.description}</p>}</div>
                {isComplete && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
              </div>
              {path.due_date && <p className={`mt-3 flex items-center gap-1 text-xs ${isOverdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}><Calendar className="h-3 w-3" />{t(isOverdue ? "learningPaths.overdue" : "learningPaths.due", { date: new Date(path.due_date).toLocaleDateString() })}</p>}
              <div className="mt-4"><div className="mb-1.5 flex items-center justify-between text-xs"><span>{t("learningPaths.lessonProgress", { completed: completedCount, total: pathItems.length })}</span><span className="font-semibold text-primary">{completionPercent}%</span></div><Progress value={completionPercent} className="h-2" /></div>
              <ol className="mt-4 space-y-2">
                {pathItems.map((item) => {
                  const tutorial = tutorialById.get(item.tutorial_id);
                  const complete = completedIds.has(item.tutorial_id);
                  return (
                    <li key={item.id}>
                      <button onClick={() => navigate(`/tutorials?tutorial=${encodeURIComponent(item.tutorial_id)}&path=${encodeURIComponent(path.id)}`)} className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-left text-xs hover:bg-muted">
                        {complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="flex-1 font-medium">{tutorial?.title || item.tutorial_id}</span>
                        <span className="text-[10px] text-muted-foreground">{tutorial ? t("tutorials.minutes", { count: tutorial.minutes }) : null}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {nextItem ? <Button size="sm" onClick={() => navigate(`/tutorials?tutorial=${encodeURIComponent(nextItem.tutorial_id)}&path=${encodeURIComponent(path.id)}`)} className="mt-4 gap-1.5 rounded-xl"><ListChecks className="h-3.5 w-3.5" />{t(completedCount > 0 ? "learningPaths.continue" : "learningPaths.start")}<ArrowRight className="h-3.5 w-3.5" /></Button> : <p className="mt-4 text-xs font-semibold text-success">{t("learningPaths.complete")}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
