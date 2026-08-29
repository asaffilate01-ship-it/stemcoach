import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Archive, Edit3, Save, X, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert, Eye, Ban, ClipboardCheck, Loader2, RotateCcw, History } from "lucide-react";
import { CSVImport } from "@/components/admin/CSVImport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { curricula, subjects } from "@/data/questions";

export default function AdminQuestions() {
  useDocumentTitle("Question Bank");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterCurriculum, setFilterCurriculum] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClaimedByMe, setFilterClaimedByMe] = useState(false);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [reviewQuestion, setReviewQuestion] = useState<any | null>(null);
  const [reviewAttested, setReviewAttested] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [claiming, setClaiming] = useState(false);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-questions", filterSubject, filterCurriculum, filterTopic, filterStatus, filterClaimedByMe, search, page, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("questions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filterSubject) q = q.eq("subject", filterSubject);
      if (filterCurriculum) q = q.eq("curriculum", filterCurriculum);
      if (filterTopic) q = q.ilike("topic", `%${filterTopic}%`);
      if (filterStatus) q = q.eq("review_status", filterStatus);
      if (filterClaimedByMe && user) q = q.eq("review_claimed_by", user.id);
      if (search) q = q.ilike("question_text", `%${search}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { questions: data || [], total: count || 0 };
    },
  });

  const { data: reviewMetrics } = useQuery({
    queryKey: ["review-queue-metrics"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_review_queue_metrics");
      if (error) throw error;
      return data as { needs_review: number; unclaimed: number; claimed_by_me: number; published: number; rejected: number; reviewed_today: number };
    },
    refetchInterval: 15_000,
  });

  const { data: reviewHistory } = useQuery({
    queryKey: ["question-review-history", reviewQuestion?.id],
    enabled: Boolean(reviewQuestion?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_review_events")
        .select("id, action, notes, created_at, reviewer_id, flags_snapshot")
        .eq("question_id", reviewQuestion.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
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
      worked_solution: q.worked_solution,
      exam_tip: q.exam_tip,
      specification_version: q.specification_version || "",
      source_url: q.source_url || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("questions")
      .update({ ...editData, review_status: "needs_review", reviewed_at: null, reviewed_by: null, review_claimed_by: null, review_claimed_at: null })
      .eq("id", editingId);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Question updated!" });
      setEditingId(null);
      refreshReviewData();
    }
  };

  const refreshReviewData = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    queryClient.invalidateQueries({ queryKey: ["review-queue-metrics"] });
  };

  const openReview = async (question: any) => {
    const { data, error } = await (supabase.rpc as any)("claim_question_review", { _question_id: question.id });
    if (error || !data) {
      toast({ title: "Question is already being reviewed", description: error?.message || "Another reviewer currently owns this question.", variant: "destructive" });
      refreshReviewData();
      return;
    }
    setReviewQuestion({ ...question, review_claimed_by: user?.id, review_claimed_at: new Date().toISOString() });
    setReviewAttested(false);
    setReviewNotes(question.review_notes || "");
    refreshReviewData();
  };

  const decideReview = async (decision: "published" | "rejected" | "needs_review") => {
    if (!reviewQuestion) return;
    const { data: result, error } = await (supabase.rpc as any)("review_question_decision", {
      _question_id: reviewQuestion.id,
      _decision: decision,
      _notes: reviewNotes || null,
      _attested: decision === "published" ? reviewAttested : false,
    });
    if (error) {
      toast({ title: "Review failed", description: error.message, variant: "destructive" });
      return;
    }
    const outcome = result as { success: boolean; error?: string; flags?: string[] };
    if (!outcome.success) {
      toast({
        title: "Question needs more work",
        description: outcome.flags?.length ? outcome.flags.join(", ").replace(/_/g, " ") : (outcome.error || "Review decision was not saved").replace(/_/g, " "),
        variant: "destructive",
      });
      return;
    }
    toast({ title: decision === "published" ? "Question reviewed and published" : decision === "rejected" ? "Question rejected with audit notes" : "Question returned to the review queue" });
    setReviewQuestion(null);
    setReviewAttested(false);
    setReviewNotes("");
    refreshReviewData();
  };

  const claimReviewBatch = async () => {
    setClaiming(true);
    const { data, error } = await (supabase.rpc as any)("claim_question_review_batch", {
      _limit: 20,
      _subject: filterSubject || null,
      _curriculum: filterCurriculum || null,
    });
    setClaiming(false);
    if (error) {
      toast({ title: "Unable to claim review batch", description: error.message, variant: "destructive" });
      return;
    }
    const count = Array.isArray(data) ? data.length : 0;
    setFilterStatus("needs_review");
    setFilterClaimedByMe(true);
    setPage(0);
    toast({ title: count ? `${count} questions assigned to you` : "No unclaimed questions matched these filters" });
    refreshReviewData();
  };

  const releaseReview = async () => {
    if (!reviewQuestion) return;
    const { data, error } = await (supabase.rpc as any)("release_question_review", { _question_id: reviewQuestion.id, _notes: reviewNotes || null });
    if (error || !data) {
      toast({ title: "Unable to release question", description: error?.message || "The review claim is no longer active.", variant: "destructive" });
      return;
    }
    setReviewQuestion(null);
    setReviewAttested(false);
    setReviewNotes("");
    refreshReviewData();
  };

  const archiveQuestion = async (id: string) => {
    const { data, error } = await (supabase.rpc as any)("archive_question", { _question_id: id, _notes: "Archived from content management" });
    if (error || !data) {
      toast({ title: "Error archiving question", description: error?.message || "The question could not be archived.", variant: "destructive" });
    } else {
      toast({ title: "Question archived with an audit event" });
      setReviewQuestion(null);
      refreshReviewData();
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
            Review full answers, edit drafts, publish approved content, and archive unsuitable questions. {data?.total.toLocaleString()} total questions.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Needs review", reviewMetrics?.needs_review || 0],
            ["Unclaimed", reviewMetrics?.unclaimed || 0],
            ["Assigned to me", reviewMetrics?.claimed_by_me || 0],
            ["Reviewed today", reviewMetrics?.reviewed_today || 0],
            ["Published", reviewMetrics?.published || 0],
            ["Rejected", reviewMetrics?.rejected || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="stem-card rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{Number(value).toLocaleString()}</div>
              <div className="stem-label">{label}</div>
            </div>
          ))}
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
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <select
              value={filterCurriculum}
              onChange={(e) => { setFilterCurriculum(e.target.value); setPage(0); }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Filter by curriculum"
            >
              <option value="">All curricula</option>
              {curricula.map((curriculum) => <option key={curriculum.id} value={curriculum.id}>{curriculum.label}</option>)}
            </select>
            <Input
              value={filterTopic}
              onChange={(e) => { setFilterTopic(e.target.value); setPage(0); }}
              placeholder="Filter by topic..."
              className="max-w-[200px]"
            />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Filter by review status"
            >
              <option value="">All review states</option>
              <option value="needs_review">Needs review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
            <Button type="button" variant={filterClaimedByMe ? "default" : "outline"} onClick={() => { setFilterClaimedByMe((value) => !value); setPage(0); }} className="gap-2 rounded-md">
              <ClipboardCheck className="h-4 w-4" /> My batch
            </Button>
            <Button type="button" onClick={claimReviewBatch} disabled={claiming} className="gap-2 rounded-md">
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Claim next 20
            </Button>
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
                    <textarea value={editData.worked_solution} onChange={(e) => setEditData({ ...editData, worked_solution: e.target.value })} className="w-full rounded-md border bg-background p-2 text-sm" rows={4} placeholder="Worked solution" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input value={editData.exam_tip} onChange={(e) => setEditData({ ...editData, exam_tip: e.target.value })} placeholder="Exam tip" />
                      <Input value={editData.specification_version} onChange={(e) => setEditData({ ...editData, specification_version: e.target.value })} placeholder="Specification version, e.g. AQA 8463 (2026)" />
                    </div>
                    <Input type="url" value={editData.source_url} onChange={(e) => setEditData({ ...editData, source_url: e.target.value })} placeholder="Official specification URL (https://...)" />
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
                        {q.review_status === "needs_review" && (
                          <button
                            onClick={() => void openReview(q)}
                            className="rounded p-1.5 text-muted-foreground hover:text-emerald-600"
                            title="Open full academic review"
                            aria-label="Open full academic review"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => startEdit(q)} className="rounded p-1.5 text-muted-foreground hover:text-primary">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => archiveQuestion(q.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive" title="Archive question" aria-label="Archive question">
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{q.subject}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.topic}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">D{q.difficulty}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.question_type}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.curriculum}</span>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        q.review_status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
                      }`}>
                        {q.review_status !== "published" && <ShieldAlert className="h-3 w-3" />}
                        {q.review_status || "needs_review"}
                      </span>
                      {q.review_claimed_by && <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${q.review_claimed_by === user?.id ? "bg-blue-500/10 text-blue-700" : "bg-muted text-muted-foreground"}`}>{q.review_claimed_by === user?.id ? "assigned to me" : "claimed"}</span>}
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

        <Dialog open={Boolean(reviewQuestion)} onOpenChange={(open) => { if (!open) { setReviewQuestion(null); setReviewAttested(false); setReviewNotes(""); } }}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Academic content review</DialogTitle>
              <DialogDescription>Verify the curriculum fit, calculation, answer, distractors and teaching explanation before publication.</DialogDescription>
            </DialogHeader>
            {reviewQuestion && <div className="space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">{[reviewQuestion.subject, reviewQuestion.curriculum, reviewQuestion.question_type, `Difficulty ${reviewQuestion.difficulty}`, ...(reviewQuestion.boards || [])].map((label: string) => <span key={label} className="rounded bg-muted px-2 py-1 text-xs">{label}</span>)}</div>
              <section><h3 className="mb-1 font-semibold">Question</h3><p className="whitespace-pre-wrap leading-6">{reviewQuestion.question_text}</p></section>
              {Array.isArray(reviewQuestion.options) && <section><h3 className="mb-1 font-semibold">Options</h3><ol className="list-inside list-[upper-alpha] space-y-1">{reviewQuestion.options.map((option: string) => <li key={option}>{option}</li>)}</ol></section>}
              <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><h3 className="mb-1 font-semibold text-emerald-700 dark:text-emerald-300">Approved answer to verify</h3><p>{reviewQuestion.allow_multiple_answers ? (reviewQuestion.correct_answers || []).join(", ") : reviewQuestion.correct_answer}</p></section>
              <section><h3 className="mb-1 font-semibold">Explanation</h3><p className="whitespace-pre-wrap leading-6 text-muted-foreground">{reviewQuestion.explanation}</p></section>
              <section><h3 className="mb-1 font-semibold">Worked solution</h3><p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 font-mono text-xs leading-6">{reviewQuestion.worked_solution}</p></section>
              {reviewQuestion.mark_scheme && <section><h3 className="mb-1 font-semibold">Mark scheme</h3><p className="whitespace-pre-wrap leading-6">{reviewQuestion.mark_scheme}</p></section>}
              {reviewQuestion.model_answer && <section><h3 className="mb-1 font-semibold">Model answer</h3><p className="whitespace-pre-wrap leading-6">{reviewQuestion.model_answer}</p></section>}
              <section className="grid gap-3 sm:grid-cols-2"><div><h3 className="font-semibold">Specification version</h3><p className="text-muted-foreground">{reviewQuestion.specification_version || "Missing"}</p></div><div><h3 className="font-semibold">Source</h3>{reviewQuestion.source_url ? <a className="break-all text-primary underline underline-offset-2" href={reviewQuestion.source_url} target="_blank" rel="noreferrer">{reviewQuestion.source_url}</a> : <p className="text-muted-foreground">No source recorded — verify independently</p>}</div></section>
              {reviewQuestion.quality_flags?.length > 0 && <p className="rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">Flags: {reviewQuestion.quality_flags.join(", ")}</p>}
              {reviewHistory?.length > 0 && <section className="rounded-xl border p-4"><h3 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4" />Review history</h3><div className="space-y-2">{reviewHistory.map((event) => <div key={event.id} className="flex items-start justify-between gap-3 text-xs"><div><span className="font-semibold capitalize">{event.action}</span>{event.notes && <p className="mt-0.5 text-muted-foreground">{event.notes}</p>}</div><time className="shrink-0 text-muted-foreground" dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></div>)}</div></section>}
              <label className="block"><span className="mb-1 block font-semibold">Reviewer notes</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} maxLength={4000} rows={3} className="w-full rounded-xl border bg-background p-3 text-sm" placeholder="Record corrections, rejection reasons or verification notes for the audit history."/><span className="mt-1 block text-right text-[10px] text-muted-foreground">{reviewNotes.length}/4000</span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><input type="checkbox" checked={reviewAttested} onChange={(event) => setReviewAttested(event.target.checked)} className="mt-1 h-4 w-4"/><span><span className="block font-semibold">Academic verification complete</span><span className="text-xs leading-5 text-muted-foreground">I checked the answer, working, distractors, board mapping and exact current specification against the official source.</span></span></label>
            </div>}
            <DialogFooter className="flex-wrap gap-2 sm:gap-2">
              <Button variant="ghost" className="gap-2" onClick={releaseReview}><RotateCcw className="h-4 w-4" />Release claim</Button>
              <Button variant="outline" onClick={() => { setReviewQuestion(null); setReviewAttested(false); setReviewNotes(""); }}>Close</Button>
              <Button variant="outline" className="gap-2" onClick={() => decideReview("needs_review")}><RotateCcw className="h-4 w-4" />Return</Button>
              <Button variant="outline" disabled={reviewNotes.trim().length < 10} className="gap-2 border-destructive/30 text-destructive" onClick={() => decideReview("rejected")}><Ban className="h-4 w-4" />Reject</Button>
              <Button className="gap-2" disabled={!reviewAttested} onClick={() => decideReview("published")}><CheckCircle2 className="h-4 w-4" />Approve and publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
