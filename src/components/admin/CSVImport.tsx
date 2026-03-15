import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from "lucide-react";

interface CSVQuestion {
  question_text: string;
  correct_answer: string;
  explanation: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  curriculum: string;
  question_type: string;
  options?: string;
  [key: string]: any;
}

const REQUIRED_FIELDS = ["question_text", "correct_answer", "subject", "topic", "subtopic", "difficulty", "curriculum"];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
  return { headers, rows };
}

export function CSVImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      const missingFields = REQUIRED_FIELDS.filter(f => !parsed.headers.includes(f));
      if (missingFields.length > 0) {
        setErrors([`Missing required columns: ${missingFields.join(", ")}`]);
        setPreview(null);
        return;
      }
      setErrors([]);
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    const questions = preview.rows.map(row => ({
      question_text: row.question_text,
      correct_answer: row.correct_answer,
      explanation: row.explanation || "",
      subject: row.subject,
      topic: row.topic,
      subtopic: row.subtopic || row.topic,
      difficulty: parseInt(row.difficulty) || 3,
      curriculum: row.curriculum,
      question_type: row.question_type || "mcq",
      options: row.options ? JSON.parse(row.options) : null,
      worked_solution: row.worked_solution || "",
      exam_tip: row.exam_tip || "",
      points: parseInt(row.points) || 1,
    }));

    const batchSize = 50;
    let imported = 0;
    const importErrors: string[] = [];

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const { error } = await supabase.from("questions").insert(batch);
      if (error) {
        importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    setImporting(false);
    if (importErrors.length > 0) {
      setErrors(importErrors);
      toast({ title: `Imported ${imported} questions with errors`, variant: "destructive" });
    } else {
      toast({ title: `Successfully imported ${imported} questions! 🎉` });
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    }
  };

  const reset = () => {
    setPreview(null);
    setErrors([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="stem-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-primary" /> CSV Question Import
        </h3>
        {preview && (
          <button onClick={reset} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!preview ? (
        <div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 rounded w-full">
            <FileText className="h-4 w-4" /> Select CSV File
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Required columns: {REQUIRED_FIELDS.join(", ")}. Optional: explanation, question_type, options (JSON array), points, worked_solution, exam_tip
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>{preview.rows.length} questions parsed</span>
            <span className="text-muted-foreground">· {preview.headers.length} columns</span>
          </div>

          {/* Preview table */}
          <div className="mb-3 max-h-48 overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Subject</th>
                  <th className="px-2 py-1 text-left">Topic</th>
                  <th className="px-2 py-1 text-left">Question</th>
                  <th className="px-2 py-1 text-left">Diff</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1">{row.subject}</td>
                    <td className="px-2 py-1">{row.topic}</td>
                    <td className="px-2 py-1 max-w-[200px] truncate">{row.question_text}</td>
                    <td className="px-2 py-1">{row.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 10 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                ...and {preview.rows.length - 10} more
              </div>
            )}
          </div>

          <Button onClick={handleImport} disabled={importing} className="gap-2 rounded w-full">
            {importing ? "Importing..." : `Import ${preview.rows.length} Questions`}
          </Button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
