import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(),"docs/staging/stemcoach_partner_and_monthly_release.sql"),"utf8");
const checker = readFileSync(resolve(process.cwd(),"supabase/functions/check-answer/index.ts"),"utf8");

describe("staged, disabled-by-default partner and monthly access", () => {
  it("preserves existing source IDs and requires operator-reviewed partner/course/student links", () => {
    for (const id of ["ilmvero","unipathways","traindirekt","skillfinch"])
      expect(sql).toContain("'"+id+"'");
    for (const table of ["education_partner_course_proposals","education_partner_bindings",
      "education_partner_course_maps","education_partner_learner_links","tenant_members"])
      expect(sql).toContain("public."+table);
    for (const condition of [
      "membership.role = 'student'","membership.status = 'approved'",
      "binding.status = 'verified'","course.status = 'reviewed'",
      "learner.status = 'verified'","learner.revoked_at IS NULL",
      "proposal.status = 'reviewed'","proposal.effective_from <= now()",
      "learner.verified_until > now()","course.curriculum = _curriculum",
      "course.subject = _subject",
    ]) expect(sql).toContain(condition);
    expect(sql).not.toContain("raw_user_meta_data");
  });
  it("keeps sensitive SQL functions and tables off anonymous / authenticated public APIs", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON TABLE");
    expect(sql).toContain("FROM PUBLIC, anon, authenticated");
    for (const fn of [
      "stemcoach_partner_question_eligible(uuid, text, text)",
      "stemcoach_monthly_subscriber_eligible(uuid)",
      "publish_stemcoach_monthly_release(text, uuid)",
    ]) expect(sql).toContain(fn);
    expect(sql).toContain("TO service_role");
  });
  it("does not activate or implicitly trust partner access without verified server gate", () => {
    expect(checker).toContain('Deno.env.get("STEMCOACH_PARTNER_ACCESS_ENABLED") === "true"');
    expect(checker).toContain('admin.rpc("stemcoach_partner_question_eligible"');
    expect(checker).toContain("_user_id: user.id");
    expect(checker).toContain("_subject: question.subject");
    expect(checker).toContain("_curriculum: question.curriculum");
    expect(checker).toContain("if (!assignmentId && !partnerEligible)");
    expect(checker).not.toContain("user.user_metadata");
    expect(sql).toContain("STAGING DESIGN ONLY");
  });
  it("requires published question IDs for monthly release and server-verified subscriber lifecycle", () => {
    expect(sql).toContain("review_status = 'published'");
    expect(sql).toContain("release_month ~");
    expect(sql).toContain("billing_subscription_ref");
    expect(sql).toContain("access_until > now()");
    expect(sql).toContain("entitlement.status IN ('active','grace')");
    expect(sql).toContain("all_count <> approved_count");
    expect(sql).toContain("status = 'approved'");
  });
});
