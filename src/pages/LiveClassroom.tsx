import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Loader2, LockKeyhole, LogIn, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/AppHeader";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { getMascot } from "@/lib/mascots";

interface ClassroomSummary {
  id: string;
  name: string;
  subject: string;
  curriculum: string;
  teacher_id: string;
}

export default function LiveClassroom() {
  const { t } = useTranslation();
  useDocumentTitle(t("classroom.documentTitle"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ["classroom-hub-classes", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("classes")
        .select("id, name, subject, curriculum, teacher_id")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return (data || []) as ClassroomSummary[];
    },
  });

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId(null);
      return;
    }
    if (!selectedClassId || !classes.some((classroom) => classroom.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><LockKeyhole className="h-8 w-8 text-primary" /></div>
          <h1 className="text-2xl font-extrabold">{t("classroom.signInTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("classroom.signInDescription")}</p>
          <Button className="mt-6 gap-2" onClick={() => navigate("/auth")}><LogIn className="h-4 w-4" />{t("classroom.signIn")}</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-7xl px-4 py-7 pb-28 lg:py-10">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><MessageSquare className="h-4 w-4" />{t("classroom.label")}</div>
              <h1 className="text-3xl font-extrabold tracking-tight">{t("classroom.title")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("classroom.description")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" />{t("classroom.membersOnly")}</div>
          </div>
        </motion.section>

        {isLoading || roleLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("common.loading")}</div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-10 text-center text-sm text-destructive">{t("classroom.loadFailed")}</div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground/35" />
            <h2 className="text-lg font-bold">{t("classroom.noClasses")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t(isTeacher ? "classroom.noTeacherClassesDescription" : "classroom.noStudentClassesDescription")}</p>
            <Button className="mt-5" onClick={() => navigate(isTeacher ? "/teacher" : "/my-classes")}>{t(isTeacher ? "classroom.createClass" : "classroom.joinClass")}</Button>
          </div>
        ) : (
          <div className="grid min-h-[620px] overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-[300px_1fr]">
            <aside className="border-b bg-muted/20 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-bold">{t("classroom.yourClasses")}</h2><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{classes.length}</span></div>
              <div className="space-y-2">
                {classes.map((classroom) => {
                  const selected = classroom.id === selectedClassId;
                  const mascot = getMascot(classroom.subject);
                  return (
                    <button key={classroom.id} onClick={() => setSelectedClassId(classroom.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-primary/25 bg-primary/8" : "border-transparent hover:bg-muted"}`}>
                      <img src={mascot.image} alt="" className="h-10 w-10 rounded-xl bg-background object-cover" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{classroom.name}</span><span className="block truncate text-[10px] text-muted-foreground">{t(`subjects.names.${classroom.subject}`, { defaultValue: classroom.subject })} · {classroom.curriculum}</span></span>
                      <ChevronRight className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" className="mt-4 w-full gap-2" onClick={() => navigate(isTeacher ? "/teacher" : "/my-classes")}><BookOpen className="h-4 w-4" />{t("classroom.classesAndAssignments")}</Button>
            </aside>
            <section className="min-h-[520px]">
              {selectedClassId && <ClassroomChat roomId={selectedClassId} />}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
