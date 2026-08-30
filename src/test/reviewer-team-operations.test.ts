import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const roleMigration = read("supabase/migrations/20260830222900_add_content_reviewer_role.sql");
const authorizationMigration = read("supabase/migrations/20260830222930_reviewer_authorization.sql");
const operations = read("supabase/migrations/20260830230000_review_team_operations.sql");
const adminPage = read("src/pages/AdminQuestions.tsx");
const routes = read("src/App.tsx");
const header = read("src/components/layout/AppHeader.tsx");

describe("least-privilege academic reviewer team", () => {
  it("adds a dedicated reviewer role without granting administrator access", () => {
    expect(roleMigration).toContain("ADD VALUE IF NOT EXISTS 'reviewer'");
    expect(roleMigration).not.toContain("'reviewer'::public.app_role");
    expect(authorizationMigration).toContain("can_review_questions");
    expect(routes).toContain('allowedRoles={["admin", "reviewer"]}');
    expect(header).toContain('roles: ["admin", "reviewer"]');
    expect(adminPage).toContain("{isAdmin && <CSVImport />}");
    expect(adminPage).toContain("{isAdmin && <button");
  });

  it("assigns only active reviewers within their expertise and workload limit", () => {
    expect(operations).toContain("reviewer_profiles");
    expect(operations).toContain("reviewer.active");
    expect(operations).toContain("q.subject = ANY(reviewer.subjects)");
    expect(operations).toContain("q.curriculum = ANY(reviewer.curricula)");
    expect(operations).toContain("q.question_type = ANY(reviewer.question_types)");
    expect(operations).toContain("reviewer.daily_review_limit");
    expect(operations).toContain("active_claim.review_claimed_at >= now() - interval '60 minutes'");
  });

  it("onboards reviewers securely by existing account email", () => {
    expect(operations).toContain("configure_content_reviewer");
    expect(operations).toContain("IF NOT public.has_role(auth.uid(), 'admin')");
    expect(operations).toContain("FROM auth.users WHERE lower(email)");
    expect(operations).toContain("ON CONFLICT (user_id, role) DO NOTHING");
    expect(operations).toContain("DELETE FROM public.user_roles WHERE user_id = target_user AND role = 'reviewer'");
  });

  it("reports review workload, velocity and objective release blockers", () => {
    expect(operations).toContain("get_reviewer_workload");
    expect(operations).toContain("get_content_release_readiness");
    expect(operations).toContain("review_passes_remaining");
    expect(operations).toContain("estimated_days_to_clear");
    expect(operations).toContain("published_missing_specification");
    expect(adminPage).toContain("Release readiness");
    expect(adminPage).toContain("Reviewer team");
  });
});
