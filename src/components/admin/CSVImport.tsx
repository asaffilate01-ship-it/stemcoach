import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { curricula, subjects } from "@/data/questions";

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
  const parsedRows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) parsedRows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) parsedRows.push(row);
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (parsedRows.length < 2) return { headers: [], rows: [] };
  const headers = parsedRows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = parsedRows.slice(1).map((values) => {
    const mapped: Record<string, string> = {};
    headers.forEach((header, index) => { mapped[header] = values[index] || ""; });
    return mapped;
  });
  return { headers, rows };
}

const allowedSubjects = new Set(subjects.map((subject) => subject.id));
const allowedCurricula = new Set(curricula.map((curriculum) => curriculum.id));
const allowedTypes = new Set(["mcq", "multi-select", "numerical", "multi-step", "essay", "code", "data-interpretation", "assertion-reason", "true-false", "ordering", "short-answer"]);

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
    if (file.size > 5 * 1024 * 1024) {
      setErrors(["CSV is too large. Split imports into files of 5 MB or less."]);
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      let parsed: ReturnType<typeof parseCSV>;
      try { parsed = parseCSV(text); } catch (error) {
        setErrors([error instanceof Error ? error.message : "Unable to parse CSV"]);
        setPreview(null);
        return;
      }
      const missingFields = REQUIRED_FIELDS.filter(f => !parsed.headers.includes(f));
      if (missingFields.length > 0) {
        setErrors([`Missing required columns: ${missingFields.join(", ")}`]);
        setPreview(null);
        return;
      }
      if (parsed.rows.length > 10_000) {
        setErrors(["A single import is limited to 10,000 rows. Split this file into smaller review batches."]);
        setPreview(null);
        return;
      }
      const rowErrors = parsed.rows.flatMap((row, index) => {
        const issues: string[] = [];
        if (!allowedSubjects.has(row.subject as never)) issues.push(`Row ${index + 2}: unsupported subject '${row.subject}'`);
        if (!allowedCurricula.has(row.curriculum as never)) issues.push(`Row ${index + 2}: unsupported curriculum '${row.curriculum}'`);
        if (!allowedTypes.has(row.question_type || "mcq")) issues.push(`Row ${index + 2}: unsupported question type '${row.question_type}'`);
        if (row.question_text.trim().length < 12) issues.push(`Row ${index + 2}: question is too short`);
        if (!row.correct_answer.trim()) issues.push(`Row ${index + 2}: correct answer is missing`);
        const difficulty = Number(row.difficulty);
        if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) issues.push(`Row ${index + 2}: difficulty must be 1–5`);
        return issues;
      });
      if (rowErrors.length) {
        setErrors(rowErrors.slice(0, 30));
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
    let questions;
    try {
      questions = preview.rows.map(row => ({
        question_text: row.question_text.trim(),
        correct_answer: row.correct_answer.trim(),
        correct_answers: row.correct_answers ? JSON.parse(row.correct_answers) : [],
        explanation: row.explanation || "",
        subject: row.subject,
        topic: row.topic,
        subtopic: row.subtopic || row.topic,
        difficulty: Number(row.difficulty),
        curriculum: row.curriculum,
        boards: row.boards ? JSON.parse(row.boards) : [],
        question_type: row.question_type || "mcq",
        options: row.options ? JSON.parse(row.options) : null,
        worked_solution: row.worked_solution || "",
        tuition_tips: row.tuition_tips ? JSON.parse(row.tuition_tips) : [],
        exam_tip: row.exam_tip || "",
        points: Math.max(1, Number(row.points) || 1),
        specification_version: row.specification_version || null,
        source_url: row.source_url || null,
        review_status: "needs_review",
        content_origin: "admin-csv-import",
      }));
    } catch {
      setErrors(["One or more JSON columns are invalid. Options, boards, correct_answers and tuition_tips must be JSON arrays."]);
      setImporting(false);
      return;
    }

    const batchSize = 50;
    let imported = 0;
    const importErrors: string[] = [];

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const { data, error } = await supabase.from("questions").upsert(batch, {
        onConflict: "subject,curriculum,content_hash",
        ignoreDuplicates: true,
      }).select("id");
      if (error) {
        importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += data?.length || 0;
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
            Required columns: {REQUIRED_FIELDS.join(", ")}. Optional JSON arrays: options, boards, correct_answers, tuition_tips. Every import remains hidden until academic review.
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
