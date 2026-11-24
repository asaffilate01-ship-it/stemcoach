import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileCheck2, Download, Upload } from "lucide-react";
import { inspectLaunchPlan, launchJobWindow, type PlanReport } from "@/lib/launchBankPlan";

const names = { PK: "Pakistan", GB: "United Kingdom", DE: "Germany" } as const;
const MAX_FILE_BYTES = 40 * 1024 * 1024;

/** Local-only mapping manifest preview. No network, AI inference or database write. */
export function LaunchBankPlanner() {
  const [manifest, setManifest] = useState<unknown>(null);
  const [report, setReport] = useState<PlanReport | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const readVersion = useRef(0);

  async function openManifest(file: File) {
    const version = ++readVersion.current;
    setManifest(null); setReport(null); setCursor(null); setError("");
    setLoading(true);
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("File too large");
      const value: unknown = JSON.parse(await file.text());
      const result = inspectLaunchPlan(value).report;
      if (version !== readVersion.current) return;
      setReport(result);
      if (result.valid) {
        setManifest(value);
        setCursor(result.totalJobs > 0 ? 0 : null);
      }
    } catch {
      if (version === readVersion.current) setError("Could not read the JSON mapping manifest. Check the format and 40 MiB size limit.");
    } finally {
      if (version === readVersion.current) setLoading(false);
    }
  }

  function exportWindow() {
    if (!manifest || !report?.valid || cursor === null) return;
    const window = launchJobWindow(manifest, cursor);
    const file = new Blob([JSON.stringify({ schemaVersion: 1, scope: "stemcoach-three-market-v1", startCursor: cursor, ...window }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url; link.download = "stemcoach-draft-jobs-" + cursor + ".json";
    document.body.appendChild(link);
    link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCursor(window.nextCursor);
  }

  function clear() {
    readVersion.current++;
    setManifest(null); setReport(null); setCursor(null); setError(""); setLoading(false);
  }

  return <section aria-labelledby="launch-bank-planner-title" className="mb-7 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
    <div className="flex items-start gap-3">
      <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <h2 id="launch-bank-planner-title" className="text-lg font-bold">Three-market draft planning</h2>
        <p className="mt-1 text-sm text-muted-foreground">Validate a private, versioned curriculum-outcome manifest against the 1,000,000-question launch allocation. This preview runs on your device. It does not generate, publish or grant access to questions.</p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-ring">
        <Upload className="h-4 w-4" aria-hidden="true" />
        Open private mapping JSON
        <input aria-label="Open private mapping JSON" type="file" accept=".json,application/json" className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void openManifest(file); }} />
      </label>
      <Button type="button" variant="ghost" className="min-h-11" onClick={clear} disabled={!report && !loading && !error}>Clear preview</Button>
    </div>
    {loading && <p role="status" className="mt-3 text-sm text-muted-foreground">Validating mapping metadata…</p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {report && <div className="mt-4 space-y-4">
      <p role="status" className="text-sm font-semibold">{!report.valid ? "Mapping validation failed" : report.complete ? "Full target allocation mapped (metadata only)" : "Partial allocation mapped (metadata only)"}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {report.markets.map(m => <div key={m.market} className="min-w-0 rounded-xl border bg-muted/20 p-3">
          <p className="font-semibold">{names[m.market]}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{m.allocated.toLocaleString()} / {m.target.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{m.outcomes.toLocaleString()} outcome rows · {m.missing.toLocaleString()} unallocated</p>
        </div>)}
      </div>
      {!report.valid && <div role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm">
        <p className="font-medium">{report.errorCount} mapping issues. No jobs can be exported.</p>
        <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-xs">{report.errors.map((message, i) => <li key={i}>{message}</li>)}</ul>
      </div>}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-muted px-3 py-2">{report.totalJobs.toLocaleString()} planned job slots</span>
        <span className="rounded-lg bg-muted px-3 py-2">0 newly approved</span>
        <span className="rounded-lg bg-muted px-3 py-2">0 newly published</span>
      </div>
      {report.valid && report.totalJobs > 0 && <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={exportWindow} disabled={cursor === null} className="min-h-11 gap-2"><Download className="h-4 w-4" /> Export next draft job window</Button>
        <span className="text-xs text-muted-foreground">{cursor === null ? "All planned job windows exported" : "Next job offset: " + cursor.toLocaleString()}</span>
      </div>}
      <p className="text-xs leading-relaxed text-muted-foreground">The planner checks structure and allocation, not the accuracy or authenticity of a syllabus or review reference. Keep exported job specifications private. An approved backend import, independent academic checks and entitlement verification are still required.</p>
    </div>}
  </section>;
}
