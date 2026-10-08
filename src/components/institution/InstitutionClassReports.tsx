import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, GraduationCap, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface InstitutionClassSummary {
  class_id: string;
  class_name: string;
  subject: string;
  curriculum: string;
  learner_enrolments: number;
  assigned_quizzes: number;
  completed_submissions: number;
  average_score_percent: number | null;
}

function csvCell(value: unknown): string {
  let cell = String(value ?? "");
  // Prevent spreadsheet-formula execution when class names are exported.
  if (/^[=+\-@\t\r]/.test(cell)) cell = "'" + cell;
  return '"' + cell.replaceAll('"', '""') + '"';
}

export function InstitutionClassReports({ tenantId }: { tenantId: string }) {
  const progress = useQuery({
    queryKey: ["institution-class-progress", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<InstitutionClassSummary[]> => {
      const { data, error } = await (supabase as any).rpc("get_institution_class_progress", {
        _tenant_id: tenantId,
      });
      if (error) throw error;
      return (data || []) as InstitutionClassSummary[];
    },
  });

  const rows = progress.data || [];
  const totalEnrolments = rows.reduce((sum, row) => sum + Number(row.learner_enrolments || 0), 0);
  const totalCompleted = rows.reduce((sum, row) => sum + Number(row.completed_submissions || 0), 0);

  const downloadCSV = () => {
    if (!rows.length) return;
    const headers = ["Class", "Subject", "Curriculum", "Student enrolments", "Quizzes assigned", "Completed submissions", "Average score (%)"];
    const dataRows = rows.map((row) => [
      row.class_name, row.subject, row.curriculum, row.learner_enrolments,
      row.assigned_quizzes, row.completed_submissions, row.average_score_percent,
    ]);
    const text = "\uFEFF" + [headers, ...dataRows].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = "stemcoach-institution-classes.csv";
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <section aria-labelledby="institution-class-report-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="institution-class-report-title" className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="h-5 w-5 text-primary" /> Institution learning reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only classes explicitly linked by approved teachers and approved students at this institution are included.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={downloadCSV} disabled={rows.length === 0}>
          <Download className="h-4 w-4" /> Export summary CSV
        </Button>
      </div>

      {progress.isLoading && <div className="rounded-xl border p-8 text-sm text-muted-foreground">Loading class progress…</div>}
      {progress.isError && (
        <div role="alert" className="rounded-xl border border-destructive/25 p-6 text-sm text-destructive">
          Could not load class progress. Check institution permissions and the reporting migration.
        </div>
      )}
      {!progress.isLoading && !progress.isError && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <GraduationCap className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <h3 className="font-semibold">No institution-linked classes</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Ask an approved teacher to open their Teacher Dashboard and link their class to this institution's reports.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Linked classes</p><p className="mt-1 text-2xl font-bold">{rows.length}</p></div>
            <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Class enrolments</p><p className="mt-1 text-2xl font-bold">{totalEnrolments}</p></div>
            <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Completed assignment submissions</p><p className="mt-1 text-2xl font-bold">{totalCompleted}</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => (
              <article key={row.class_id} className="stem-card rounded-2xl p-5">
                <h3 className="text-lg font-semibold">{row.class_name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{row.subject} · {row.curriculum}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Enrolments</p><p className="mt-1 text-lg font-bold">{row.learner_enrolments}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Quizzes assigned</p><p className="mt-1 text-lg font-bold">{row.assigned_quizzes}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Completed submissions</p><p className="mt-1 text-lg font-bold">{row.completed_submissions}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Average score</p>
                    <p className="mt-1 text-lg font-bold">{row.average_score_percent === null ? "—" : Number(row.average_score_percent).toFixed(1) + "%"}</p></div>
                </div>
                {row.average_score_percent === null && (
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" /> Scores shown after at least 3 completed submissions.
                  </p>
                )}
              </article>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Class enrolments may count the same learner in more than one class. Reports exclude private practice and learners not approved by this institution.
          </p>
        </>
      )}
    </section>
  );
}
