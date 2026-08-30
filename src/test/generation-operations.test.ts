import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260830210000_generation_campaign_operations.sql");
const generator = read("supabase/functions/batch-generate/index.ts");
const adminPage = read("src/pages/AdminGenerate.tsx");
const config = read("supabase/config.toml");

describe("production generation campaign operations", () => {
  it("lets the secured cron worker reach both cron-protected functions", () => {
    expect(config).toMatch(/\[functions\.batch-generate\]\s+verify_jwt = false/);
    expect(config).toMatch(/\[functions\.daily-mascot-notify\]\s+verify_jwt = false/);
    expect(generator).toContain("requireCronOrAdmin");
  });

  it("provides atomic pause, resume, cancel and failed-job recovery", () => {
    expect(migration).toContain("manage_generation_campaign");
    expect(migration).toContain("WHEN 'pause'");
    expect(migration).toContain("WHEN 'resume'");
    expect(migration).toContain("WHEN 'retry_failed'");
    expect(migration).toContain("WHEN 'cancel'");
    expect(migration).toContain("status IN ('planning','queued','running','paused','completed','failed','cancelled')");
    expect(generator).toContain('pause: "pause"');
    expect(generator).toContain('resume: "resume"');
    expect(generator).toContain('"retry-failed": "retry_failed"');
    expect(generator).toContain('cancel: "cancel"');
  });

  it("does not claim paused or cancelled campaigns and preserves terminal operator state", () => {
    expect(migration).toContain("campaign.status IN ('planning','queued','running')");
    expect(migration).toContain("current_status IN ('paused','cancelled')");
    expect(generator).toContain('.eq("status", "processing")');
    expect(generator).toContain('.in("status", ["planning", "queued", "running"])');
  });

  it("exposes lifecycle controls and review throughput metrics to administrators", () => {
    for (const label of ["Pause", "Resume", "Retry failed", "Cancel", "Review backlog", "Approval yield", "Queue complete"]) {
      expect(adminPage).toContain(label);
    }
    for (const metric of ["generation_remaining", "review_backlog", "review_yield_pct", "queue_completion_pct"]) {
      expect(migration).toContain(`'${metric}'`);
    }
    expect(adminPage).toContain("You can close this page");
    expect(adminPage).not.toContain("Auto-Generate (Loop)");
  });
});
