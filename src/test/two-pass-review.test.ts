import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260830223000_two_pass_content_verification.sql");
const adminPage = read("src/pages/AdminQuestions.tsx");

describe("independent two-pass academic review", () => {
  it("keeps first-pass content hidden until a different reviewer approves it", () => {
    expect(migration).toContain("academic_verified_by IS NULL");
    expect(migration).toContain("academic_verified_by = auth.uid()");
    expect(migration).toContain("independent_second_reviewer_required");
    expect(migration).toContain("requires_second_review");
    expect(migration).toContain("'decision', 'verified'");
    expect(migration).toContain("SET review_status = _decision");
  });

  it("prevents a first reviewer from claiming the second pass", () => {
    expect(migration.match(/academic_verified_by IS DISTINCT FROM auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("CASE WHEN q.academic_verified_by IS NOT NULL THEN 0 ELSE 1 END");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
  });

  it("invalidates verification whenever material academic content changes", () => {
    expect(migration).toContain("invalidate_question_verification_on_edit");
    expect(migration).toContain("BEFORE UPDATE OF");
    expect(migration).toContain("NEW.review_status := 'needs_review'");
    expect(migration).toContain("NEW.academic_verified_by := NULL");
    expect(migration).toContain("NEW.review_revision := OLD.review_revision + 1");
    expect(migration).toContain("'verification_reset'");
    expect(migration).toContain("guard_direct_question_review_state_update");
    expect(migration).toContain("Use the audited question review workflow");
    expect(migration).toContain("enforce_question_insert_review_state");
    expect(migration).toContain("IF current_user = 'authenticated'");
    expect(migration).toContain("REVOKE DELETE ON public.questions FROM authenticated");
  });

  it("keeps active claims alive and exposes country/curriculum quality gaps", () => {
    expect(migration).toContain("renew_question_review");
    expect(migration).toContain("get_content_quality_matrix");
    expect(migration).toContain("missing_specification");
    expect(adminPage).toContain("Curriculum quality matrix");
    expect(adminPage).toContain("Second independent review");
    expect(adminPage).toContain("Complete first review");
    expect(adminPage).toContain("renew_question_review");
  });
});
