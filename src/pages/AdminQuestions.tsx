import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight, Database } from "lucide-react";
import { CSVImport } from "@/components/admin/CSVImport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AdminQuestions() {
  useDocumentTitle("Question Bank");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-questions", filterSubject, filterTopic, search, page],
    queryFn: async () => {
      let q = supabase
        .from("questions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filterSubject) q = q.eq("subject", filterSubject);
      if (filterTopic) q = q.ilike("topic", `%${filterTopic}%`);
      if (search) q = q.ilike("question_text", `%${search}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { questions: data || [], total: count || 0 };
    },
  });

  const { data: subjectList } = useQuery({
    queryKey: ["distinct-subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("questions").select("subject");
      const unique = [...new Set(data?.map(d => d.subject) || [])];
      return unique.sort();
    },
  });

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setEditData({
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
      subtopic: q.subtopic,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("questions")
      .update(editData)
      .eq("id", editingId);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Question updated!" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    }
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Question deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Admin Panel</div>
          <h1 className="stem-heading text-3xl">Content Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse, search, edit, and delete questions. {data?.total.toLocaleString()} total questions.
          </p>
        </div>

        {/* CSV Import */}
        <CSVImport />

        {/* Filters */}
        <div className="stem-card mb-6 rounded-xl p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search question text..."
                className="pl-9"
              />
            </div>
            <select
              value={filterSubject}
              onChange={(e) => { setFilterSubject(e.target.value); setPage(0); }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Subjects</option>
              {subjectList?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input
              value={filterTopic}
              onChange={(e) => { setFilterTopic(e.target.value); setPage(0); }}
              placeholder="Filter by topic..."
              className="max-w-[200px]"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading questions...</div>
          ) : (
            data?.questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="stem-card rounded-xl p-4"
              >
                {editingId === q.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editData.question_text}
                      onChange={(e) => setEditData({ ...editData, question_text: e.target.value })}
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      rows={3}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        value={editData.correct_answer}
                        onChange={(e) => setEditData({ ...editData, correct_answer: e.target.value })}
                        placeholder="Correct answer"
                      />
                      <Input
                        value={editData.topic}
                        onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                        placeholder="Topic"
                      />
                      <select
                        value={editData.difficulty}
                        onChange={(e) => setEditData({ ...editData, difficulty: Number(e.target.value) })}
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>Difficulty {d}</option>)}
                      </select>
                    </div>
                    <textarea
                      value={editData.explanation}
                      onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      rows={2}
                      placeholder="Explanation"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="gap-1 rounded">
                        <Save className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="gap-1 rounded">
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed">{q.question_text.slice(0, 200)}{q.question_text.length > 200 ? "..." : ""}</p>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => startEdit(q)} className="rounded p-1.5 text-muted-foreground hover:text-primary">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteQuestion(q.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{q.subject}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.topic}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">D{q.difficulty}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.question_type}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.curriculum}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="gap-1 rounded"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="gap-1 rounded"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
