import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20261008220000_institution_teacher_offboarding.sql", "utf8");

describe("institution teacher offboarding migration guardrails", () => {
  it("requires tenant-scoped admin authorization and rejects self-removal", () => {
    expect(sql).toContain("public.is_institution_admin(_tenant_id)");
    expect(sql).toContain("actor = _teacher_user_id");
  });
  it("only offboards an approved teacher in the targeted tenant", () => {
    expect(sql).toContain("tenant_id = _tenant_id");
    expect(sql).toContain("role = 'teacher'");
    expect(sql).toContain("status = 'approved'");
  });
  it("retains global teacher role when another approved teaching membership remains", () => {
    expect(sql).toContain("IF NOT EXISTS");
    expect(sql).toContain("DELETE FROM public.user_roles");
    expect(sql).toContain("pg_advisory_xact_lock");
  });
  it("does not grant anonymous access", () => {
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.offboard_institution_teacher(uuid, uuid) FROM PUBLIC, anon");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.offboard_institution_teacher(uuid, uuid) TO authenticated");
  });
});
