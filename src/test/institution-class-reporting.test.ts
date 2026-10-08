import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20261008212000_institution_class_reporting.sql");
const teacher = read("src/pages/TeacherDashboard.tsx");
const admin = read("src/components/institution/InstitutionClassReports.tsx");

describe("institution class reporting boundaries", () => {
  it("links classrooms only through a teacher-owned, tenant-authorised server operation", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.institution_class_links");
    expect(migration).toContain("class_id uuid PRIMARY KEY");
    expect(migration).toContain("REVOKE ALL ON public.institution_class_links FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("c.id = _class_id AND c.teacher_id = actor");
    expect(migration).toContain("m.role = 'teacher' AND m.status = 'approved'");
    expect(migration).toContain("existing_tenant <> _tenant_id");
    expect(teacher).toContain('rpc("link_institution_class"');
    expect(teacher).toContain('rpc("get_my_institution_class_links"');
  });

  it("restricts administrator reports to aggregated approved institution enrolments", () => {
    expect(migration).toContain("FUNCTION public.get_institution_class_progress");
    expect(migration).toContain("public.is_institution_admin(_tenant_id)");
    expect(migration).toContain("learner.tenant_id = _tenant_id");
    expect(migration).toContain("learner.status = 'approved'");
    expect(migration).toContain("learner.role = 'student'");
    expect(migration).toContain("s.completed_at IS NOT NULL");
    expect(migration).toContain("coalesce(completions.total, 0) >= 3");
    expect(migration).not.toContain("public.attempts");
    expect(admin).toContain('rpc("get_institution_class_progress"');
  });

  it("preserves private classes unless their owner links them deliberately", () => {
    expect(migration).not.toContain("UPDATE public.classes");
    expect(migration).toContain("ON CONFLICT (class_id) DO NOTHING");
    expect(teacher).toContain("Link to institution report");
    expect(admin).toContain("No institution-linked classes");
  });
});
