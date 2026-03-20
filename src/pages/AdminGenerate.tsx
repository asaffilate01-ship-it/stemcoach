import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { subjects, curricula } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Database, ShieldAlert, Rocket, BarChart3, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

const questionTypes = [
  { id: "mcq", label: "Multiple Choice (single answer)" },
  { id: "multi-select", label: "Multiple Choice (multi-answer)" },
  { id: "essay", label: "Essay / Extended Response" },
  { id: "numerical", label: "Numerical Entry" },
];

export default function AdminGenerate() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("physics");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk-alevel");
  const [selectedBoards, setSelectedBoards] = useState<string[]>(["AQA", "Edexcel", "OCR"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);
  const [selectedType, setSelectedType] = useState("mcq");
  const [count, setCount] = useState(10);
  const [log, setLog] = useState<string[]>([]);

  const subjectInfo = subjects.find((s) => s.id === selectedSubject);
  const curriculumInfo = curricula.find((c) => c.id === selectedCurriculum);

  const { data: dbCount, refetch: refetchCount } = useQuery({
    queryKey: ["question-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 5000,
  });

  const { data: subjectCounts } = useQuery({
    queryKey: ["subject-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const s of subjects) {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("subject", s.id);
        counts[s.id] = count || 0;
      }
      return counts;
    },
    refetchInterval: 10000,
  });

  const { data: batchStatus, refetch: refetchBatch } = useQuery({
    queryKey: ["batch-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("batch-generate", {
          body: { action: "status" },
        });
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    },
    refetchInterval: 10000,
  });

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  if (!roleLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive/50" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can generate questions.</p>
        </main>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedTopic) {
      toast({ title: "Select a topic", variant: "destructive" });
      return;
    }
    setGenerating(true);
    addLog(`Generating ${count} ${selectedType} questions for ${selectedSubject} > ${selectedTopic}...`);

    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: {
          subject: selectedSubject,
          topic: selectedTopic,
          subtopic: selectedSubtopic || selectedTopic,
          curriculum: selectedCurriculum,
          boards: selectedBoards,
          difficulty: selectedDifficulty,
          question_type: selectedType,
          count,
        },
      });

      if (error) throw error;

      if (data?.error) {
        addLog(`❌ Error: ${data.error}`);
        toast({ title: "Generation failed", description: data.error, variant: "destructive" });
      } else {
        addLog(`✅ Inserted ${data.inserted} questions`);
        toast({ title: "Questions generated!", description: `${data.inserted} questions added.` });
        refetchCount();
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSeedQueue = async () => {
    setSeeding(true);
    addLog("🌱 Seeding batch generation queue with all 2M combinations...");
    try {
      const { data, error } = await supabase.functions.invoke("batch-generate", {
        body: { action: "seed" },
      });
      if (error) throw error;
      addLog(`✅ Queue seeded: ${data.pending} pending combos (~${data.estimated_questions?.toLocaleString()} questions)`);
      toast({ title: "Queue seeded!", description: `${data.pending} combinations queued for generation.` });
      refetchBatch();
    } catch (e: any) {
      addLog(`❌ Seed failed: ${e.message}`);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleProcessBatch = async () => {
    setGenerating(true);
    addLog("⚡ Processing next batch from queue...");
    try {
      const { data, error } = await supabase.functions.invoke("batch-generate", {
        body: { action: "process" },
      });
      if (error) throw error;
      addLog(`✅ Batch complete: ${data.inserted} questions inserted from ${data.processed} items`);
      data.results?.forEach((r: any) => {
        if (r.status === "done") addLog(`  ✅ ${r.subject}/${r.topic}: ${r.inserted} questions`);
        else if (r.status === "rate_limited") addLog(`  ⏳ Rate limited — will retry`);
        else addLog(`  ❌ ${r.status}: ${r.error || ""}`);
      });
      toast({ title: "Batch processed!", description: `${data.inserted} questions generated.` });
      refetchCount();
      refetchBatch();
    } catch (e: any) {
      addLog(`❌ Batch error: ${e.message}`);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    addLog("🚀🚀 Starting auto-generation loop (will process until rate-limited)...");

    let totalInserted = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 50; // Safety cap

    while (iterations < MAX_ITERATIONS) {
      iterations++;
      try {
        const { data, error } = await supabase.functions.invoke("batch-generate", {
          body: { action: "process" },
        });
        if (error) throw error;

        if (data.message === "No pending items in queue") {
          addLog("🏆 All queue items processed!");
          break;
        }

        totalInserted += data.inserted || 0;
        const hasRateLimit = data.results?.some((r: any) => r.status === "rate_limited");

        addLog(`  Iteration ${iterations}: +${data.inserted} questions (total: ${totalInserted})`);

        if (hasRateLimit) {
          addLog("  ⏳ Rate limited — waiting 30s...");
          await new Promise(r => setTimeout(r, 30000));
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e: any) {
        addLog(`  ❌ Error: ${e.message}`);
        if (e.message?.includes("429") || e.message?.includes("rate")) {
          addLog("  ⏳ Waiting 30s...");
          await new Promise(r => setTimeout(r, 30000));
        } else {
          break;
        }
      }
    }

    addLog(`🏁 Auto-generation stopped. Total: ${totalInserted} questions in ${iterations} iterations.`);
    toast({ title: "Auto-generation complete", description: `${totalInserted} questions added.` });
    refetchCount();
    refetchBatch();
    setGenerating(false);
  };

  const progressPct = batchStatus?.progress_pct || ((dbCount || 0) / 2000000) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Admin Panel</div>
          <h1 className="stem-heading text-3xl">Question Generator</h1>
          <p className="mt-2 text-muted-foreground">
            Generate exam-accurate questions using STEMcoach. Target: 2,000,000 questions.
          </p>
        </div>

        {/* Progress to 1M */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 stem-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" /> Progress to 2,000,000 Questions
            </h3>
            <span className="text-sm font-bold text-primary">{progressPct.toFixed(1)}%</span>
          </div>
          <Progress value={progressPct} className="h-3 mb-3" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center text-sm">
            <div>
              <div className="text-xl font-bold">{(dbCount || 0).toLocaleString()}</div>
              <div className="stem-label">Total Questions</div>
            </div>
            <div>
              <div className="text-xl font-bold">{(batchStatus?.queue_pending || 0).toLocaleString()}</div>
              <div className="stem-label">Queue Pending</div>
            </div>
            <div>
              <div className="text-xl font-bold">{(batchStatus?.queue_done || 0).toLocaleString()}</div>
              <div className="stem-label">Queue Done</div>
            </div>
            <div>
              <div className="text-xl font-bold">1,000,000</div>
              <div className="stem-label">Target</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleSeedQueue} disabled={seeding || generating} variant="outline" className="gap-2 rounded">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              1. Seed Queue (All Combos)
            </Button>
            <Button onClick={handleProcessBatch} disabled={generating} variant="outline" className="gap-2 rounded">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              2. Process Next Batch
            </Button>
            <Button onClick={handleAutoGenerate} disabled={generating} className="gap-2 rounded bg-primary">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              🚀 Auto-Generate (Loop)
            </Button>
            <Button onClick={() => refetchBatch()} variant="ghost" size="sm" className="gap-1 rounded">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats per subject */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-8">
          <div className="stem-card rounded-xl p-4 text-center">
            <Database className="mx-auto mb-2 h-5 w-5 text-primary" />
            <div className="text-2xl font-bold">{(dbCount || 0).toLocaleString()}</div>
            <div className="stem-label">Total</div>
          </div>
          {subjects.map((s) => (
            <div key={s.id} className="stem-card rounded-xl p-4 text-center">
              <span className="text-lg">{s.icon}</span>
              <div className="text-xl font-bold">{(subjectCounts?.[s.id] || 0).toLocaleString()}</div>
              <div className="stem-label">{s.name}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Manual Generator */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Manual Generate</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm">Subject</Label>
                  <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(""); }}
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Topic</Label>
                  <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">Select topic...</option>
                    {subjectInfo?.topics.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-sm">Subtopic (optional)</Label>
                <Input value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(e.target.value)}
                  placeholder="e.g. SUVAT Equations" className="mt-1.5" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm">Curriculum</Label>
                  <select value={selectedCurriculum} onChange={(e) => setSelectedCurriculum(e.target.value)}
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {curricula.map((c) => <option key={c.id} value={c.id}>{c.country} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Question Type</Label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {questionTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm">Difficulty (1-5)</Label>
                  <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Level {d}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Count</Label>
                  <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))}
                    min={1} max={20} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label className="text-sm">Boards</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {curriculumInfo?.boards.map((b) => (
                    <button key={b} onClick={() => setSelectedBoards((prev) =>
                      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
                    )}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                        selectedBoards.includes(b)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >{b}</button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating || !selectedTopic} className="gap-2 rounded">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate {count} Questions
              </Button>
            </div>
          </div>

          {/* Generation Log */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Generation Log</h3>
            <div className="h-[500px] overflow-y-auto rounded-lg bg-muted/50 p-4 font-mono text-xs">
              {log.length === 0 ? (
                <span className="text-muted-foreground">
                  How to generate 1M questions:{"\n\n"}
                  1. Click "Seed Queue" to create all subject×curriculum×type×difficulty combos{"\n"}
                  2. Click "Auto-Generate (Loop)" to start processing{"\n"}
                  3. The system will auto-pause on rate limits and resume{"\n"}
                  4. You can close this page and come back — progress is saved{"\n\n"}
                  Each batch processes 3 items (~30-45 questions) per iteration.
                </span>
              ) : (
                log.map((l, i) => (
                  <div key={i} className={`mb-1 ${l.includes("✅") || l.includes("🏆") ? "text-success" : l.includes("❌") ? "text-destructive" : l.includes("⏳") ? "text-warning" : "text-foreground"}`}>
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
