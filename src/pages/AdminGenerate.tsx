import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { subjects, curricula } from "@/data/questions";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Database, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const questionTypes = [
  { id: "mcq", label: "Multiple Choice (single answer)" },
  { id: "multi-select", label: "Multiple Choice (multi-answer)" },
  { id: "essay", label: "Essay / Extended Response" },
  { id: "numerical", label: "Numerical Entry" },
];

export default function AdminGenerate() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
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

  // Get DB question count
  const { data: dbCount } = useQuery({
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

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleGenerate = async () => {
    if (!selectedTopic) {
      toast({ title: "Select a topic", variant: "destructive" });
      return;
    }
    setGenerating(true);
    addLog(`Generating ${count} ${selectedType} questions for ${selectedSubject} > ${selectedTopic} > ${selectedSubtopic || "General"}...`);

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
        toast({ title: "Questions generated!", description: `${data.inserted} questions added to the database.` });
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!subjectInfo) return;
    setGenerating(true);
    addLog(`🚀 Starting bulk generation for ${subjectInfo.name}...`);

    for (const topic of subjectInfo.topics) {
      for (const type of ["mcq", "multi-select", "essay"]) {
        for (const diff of [1, 2, 3, 4, 5]) {
          addLog(`Generating ${type} D${diff}: ${topic}...`);
          try {
            const { data, error } = await supabase.functions.invoke("generate-questions", {
              body: {
                subject: selectedSubject,
                topic,
                subtopic: topic,
                curriculum: selectedCurriculum,
                boards: selectedBoards,
                difficulty: diff,
                question_type: type,
                count: type === "essay" ? 5 : 10,
              },
            });
            if (error) throw error;
            addLog(`  ✅ ${data?.inserted || 0} ${type} questions`);
            await new Promise((r) => setTimeout(r, 1500));
          } catch (e: any) {
            addLog(`  ❌ ${e.message}`);
            if (e.message?.includes("429") || e.message?.includes("rate")) {
              addLog("  ⏳ Rate limited — waiting 15s...");
              await new Promise((r) => setTimeout(r, 15000));
            }
          }
        }
      }
    }
    addLog(`✅ Bulk generation complete for ${subjectInfo.name}`);
    setGenerating(false);
  };

  const handleMegaGenerate = async () => {
    setGenerating(true);
    addLog(`🚀🚀 MEGA GENERATION: All subjects × all curricula`);
    
    const allCurricula = curricula.slice(0, 8); // Top 8 curricula
    
    for (const sub of subjects) {
      for (const curr of allCurricula) {
        for (const topic of sub.topics) {
          for (const type of ["mcq", "multi-select", "essay", "numerical"]) {
            for (const diff of [1, 2, 3, 4, 5]) {
              addLog(`${sub.name} > ${curr.label} > ${topic} > ${type} D${diff}...`);
              try {
                const { data, error } = await supabase.functions.invoke("generate-questions", {
                  body: {
                    subject: sub.id,
                    topic,
                    subtopic: topic,
                    curriculum: curr.id,
                    boards: curr.boards.slice(0, 3),
                    difficulty: diff,
                    question_type: type,
                    count: type === "essay" ? 5 : 15,
                  },
                });
                if (error) throw error;
                addLog(`  ✅ ${data?.inserted || 0} questions`);
                await new Promise((r) => setTimeout(r, 1200));
              } catch (e: any) {
                addLog(`  ❌ ${e.message}`);
                if (e.message?.includes("429") || e.message?.includes("rate")) {
                  addLog("  ⏳ Rate limited — waiting 20s...");
                  await new Promise((r) => setTimeout(r, 20000));
                }
              }
            }
          }
        }
      }
    }
    addLog(`🏆 MEGA GENERATION COMPLETE`);
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Admin Panel</div>
          <h1 className="stem-heading text-3xl">Question Generator</h1>
          <p className="mt-2 text-muted-foreground">
            Generate exam-accurate questions using AI. Each question includes tuition tips, worked solutions, and exam technique advice.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="stem-card rounded-xl p-4 text-center">
            <Database className="mx-auto mb-2 h-5 w-5 text-primary" />
            <div className="text-2xl font-bold">{(dbCount || 0).toLocaleString()}</div>
            <div className="stem-label">Total Questions</div>
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
          {/* Generator Form */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Generate Questions</h3>
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
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={generating || !selectedTopic} className="gap-2 rounded">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate {count} Questions
                </Button>
                <Button onClick={handleBulkGenerate} disabled={generating} variant="outline" className="gap-2 rounded">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Bulk: All Topics
                </Button>
              </div>
            </div>
          </div>

          {/* Generation Log */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Generation Log</h3>
            <div className="h-[400px] overflow-y-auto rounded-lg bg-muted/50 p-4 font-mono text-xs">
              {log.length === 0 ? (
                <span className="text-muted-foreground">No activity yet. Generate some questions to see logs.</span>
              ) : (
                log.map((l, i) => (
                  <div key={i} className={`mb-1 ${l.includes("✅") ? "text-success" : l.includes("❌") ? "text-destructive" : "text-foreground"}`}>
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
