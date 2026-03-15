import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Users, BookOpen, Plus, Copy, BarChart3, ClipboardList, Send, Calendar, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjects, curricula } from "@/data/questions";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("mathematics");
  const [newClassCurriculum, setNewClassCurriculum] = useState("uk-alevel");

  // Assignment form state
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignTopics, setAssignTopics] = useState("");
  const [assignCount, setAssignCount] = useState(10);
  const [assignDueDate, setAssignDueDate] = useState("");

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("teacher_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["teacher-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select("*").eq("teacher_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createClass = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classes").insert({
        teacher_id: user!.id, name: newClassName, subject: newClassSubject, curriculum: newClassCurriculum,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      setShowCreate(false);
      setNewClassName("");
      toast({ title: "Class created", description: "Students can now join with the class code." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createAssignment = useMutation({
    mutationFn: async (classId: string) => {
      const cls = classes.find((c: any) => c.id === classId);
      if (!cls) throw new Error("Class not found");
      const { error } = await supabase.from("assignments").insert({
        class_id: classId,
        teacher_id: user!.id,
        title: assignTitle,
        description: assignDesc || null,
        subject: cls.subject,
        topics: assignTopics.split(",").map((t: string) => t.trim()).filter(Boolean),
        curriculum: cls.curriculum,
        question_count: assignCount,
        due_date: assignDueDate ? new Date(assignDueDate).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setShowAssign(null);
      setAssignTitle("");
      setAssignDesc("");
      setAssignTopics("");
      setAssignCount(10);
      setAssignDueDate("");
      toast({ title: "Assignment created", description: "Students in this class can now see and complete this work." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Join code: ${code}` });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="stem-label mb-2">Teacher Portal</div>
            <h1 className="stem-heading text-3xl">Your Classes</h1>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2 rounded">
            <Plus className="h-4 w-4" /> Create Class
          </Button>
        </div>

        {/* Create Class Form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="stem-card mb-6 rounded-xl p-6">
            <h3 className="mb-4 font-semibold">New Class</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">Class Name</Label>
                <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Year 12 Physics" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">Subject</Label>
                <select value={newClassSubject} onChange={(e) => setNewClassSubject(e.target.value)} className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Curriculum</Label>
                <select value={newClassCurriculum} onChange={(e) => setNewClassCurriculum(e.target.value)} className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {curricula.map((c) => <option key={c.id} value={c.id}>{c.country} {c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => createClass.mutate()} disabled={!newClassName} className="rounded">Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded">Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Classes Grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="stem-card rounded-xl p-8 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No classes yet</h3>
            <p className="text-sm text-muted-foreground">Create your first class to start tracking students.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls: any, i: number) => (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stem-card rounded-xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <button onClick={() => copyCode(cls.join_code)} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />{cls.join_code}
                  </button>
                </div>
                <h3 className="mb-1 font-semibold">{cls.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{cls.subject} · {cls.curriculum}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded text-xs">
                    <BarChart3 className="h-3 w-3" /> Analytics
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAssign(cls.id)} className="gap-1.5 rounded text-xs">
                    <ClipboardList className="h-3 w-3" /> Assign Work
                  </Button>
                </div>

                {/* Inline assignment form */}
                {showAssign === cls.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border-t pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">New Assignment</h4>
                      <button onClick={() => setShowAssign(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} placeholder="Mechanics Quiz Week 3" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Description (optional)</Label>
                        <Textarea value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} placeholder="Focus on SUVAT equations..." rows={2} className="mt-1 resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Topics (comma-separated)</Label>
                          <Input value={assignTopics} onChange={(e) => setAssignTopics(e.target.value)} placeholder="Mechanics, Waves" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Questions</Label>
                          <Input type="number" value={assignCount} onChange={(e) => setAssignCount(parseInt(e.target.value) || 10)} min={1} max={50} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Due Date (optional)</Label>
                        <Input type="datetime-local" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} className="mt-1" />
                      </div>
                      <Button onClick={() => createAssignment.mutate(cls.id)} disabled={!assignTitle} size="sm" className="gap-1.5 rounded">
                        <Send className="h-3.5 w-3.5" /> Assign
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Assignments */}
        {assignments.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 stem-heading text-xl">Recent Assignments</h2>
            <div className="space-y-2">
              {assignments.slice(0, 10).map((a: any) => (
                <div key={a.id} className="stem-card flex items-center justify-between rounded-xl px-5 py-3">
                  <div>
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.subject} · {a.question_count} questions
                      {a.topics?.length > 0 && ` · ${a.topics.join(", ")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {a.due_date ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" /> No deadline
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
