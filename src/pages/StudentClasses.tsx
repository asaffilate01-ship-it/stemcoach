import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Users, Calendar, CheckCircle2, Clock, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function StudentClasses() {
  useDocumentTitle("My Classes");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState("");

  // Fetch classes student belongs to
  const { data: myClasses = [] } = useQuery({
    queryKey: ["student-classes", user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("user_id", user!.id);

      if (!memberships?.length) return [];

      const classIds = memberships.map(m => m.class_id);
      const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds);

      return classes || [];
    },
    enabled: !!user,
  });

  // Fetch assignments for student's classes
  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments", myClasses.map((c: any) => c.id)],
    queryFn: async () => {
      if (!myClasses.length) return [];
      const classIds = myClasses.map((c: any) => c.id);
      const { data } = await supabase
        .from("assignments")
        .select("*")
        .in("class_id", classIds)
        .order("due_date", { ascending: true, nullsFirst: false });

      // Get submissions
      const { data: subs } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", user!.id);

      const subMap = new Map((subs || []).map(s => [s.assignment_id, s]));
      return (data || []).map(a => ({ ...a, submission: subMap.get(a.id) || null }));
    },
    enabled: myClasses.length > 0 && !!user,
  });

  const joinClass = useMutation({
    mutationFn: async () => {
      const { data: classId, error } = await supabase.rpc("join_class_by_code", {
        _join_code: joinCode.trim(),
      });
      if (error) throw error;
      if (!classId) throw new Error("Invalid join code. Please check and try again.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      setJoinCode("");
      toast({ title: "Joined class!", description: "You can now view assignments for this class." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const startAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user!.id,
      });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments"] });
      // Navigate to practice with assignment context
      const assignment = assignments.find((a: any) => a.id === assignmentId);
      if (assignment) {
        navigate(`/practice/${assignment.subject}`);
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="stem-heading mb-2 text-2xl">Sign in to view your classes</h2>
          <Button onClick={() => navigate("/auth")} className="mt-4 rounded">Sign In</Button>
        </main>
      </div>
    );
  }

  const pendingAssignments = assignments.filter((a: any) => !a.submission?.completed_at);
  const completedAssignments = assignments.filter((a: any) => a.submission?.completed_at);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">My Classes</div>
          <h1 className="stem-heading text-3xl">Classes & Assignments</h1>
        </div>

        {/* Join a class */}
        <div className="stem-card mb-6 rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <LogIn className="h-4 w-4 text-primary" /> Join a Class
          </h3>
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter class join code"
              className="max-w-xs font-mono"
            />
            <Button onClick={() => joinClass.mutate()} disabled={!joinCode.trim()} className="rounded">
              Join
            </Button>
          </div>
        </div>

        {/* My classes */}
        {myClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Your Classes</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((cls: any, i: number) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="stem-card rounded-xl p-5"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{cls.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{cls.subject} · {cls.curriculum}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pending assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-warning" /> Due Assignments ({pendingAssignments.length})
            </h2>
            <div className="space-y-2">
              {pendingAssignments.map((a: any) => {
                const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                const started = !!a.submission;
                return (
                  <div key={a.id} className={`stem-card flex items-center justify-between rounded-xl px-5 py-4 ${isOverdue ? "border-2 border-destructive/20" : ""}`}>
                    <div>
                      <div className="text-sm font-semibold">{a.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.question_count} questions · {a.subject}
                        {a.topics?.length > 0 && ` · ${a.topics.join(", ")}`}
                      </div>
                      {a.due_date && (
                        <div className={`mt-1 flex items-center gap-1 text-xs ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          {isOverdue ? "OVERDUE — " : "Due "}
                          {new Date(a.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startAssignment.mutate(a.id)}
                      className="gap-1.5 rounded"
                    >
                      {started ? "Continue" : "Start"} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed assignments */}
        {completedAssignments.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-success" /> Completed ({completedAssignments.length})
            </h2>
            <div className="space-y-2">
              {completedAssignments.map((a: any) => (
                <div key={a.id} className="stem-card flex items-center justify-between rounded-xl px-5 py-3">
                  <div>
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-success">
                      {a.submission?.score}/{a.submission?.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(((a.submission?.score || 0) / (a.submission?.total || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myClasses.length === 0 && (
          <div className="stem-card rounded-xl p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">No classes yet</h3>
            <p className="text-sm text-muted-foreground">Ask your teacher for a join code to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
