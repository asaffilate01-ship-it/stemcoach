import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20261008190000_institution_onboarding_security.sql");
const register = read("src/pages/RegisterInstitution.tsx");
const admin = read("src/pages/TenantAdmin.tsx");
const join = read("src/pages/JoinInstitution.tsx");

describe("secure institution onboarding", () => {
  it("creates the owner and institution atomically on the server", () => {
    expect(migration).toContain("FUNCTION public.register_institution");
    expect(migration).toContain("LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''");
    expect(migration).toContain("INSERT INTO public.tenants");
    expect(migration).toContain("INSERT INTO public.tenant_members");
    expect(migration).toContain("'admin', 'approved'");
    expect(register).toContain('rpc("register_institution"');
    expect(register).not.toContain('.from("tenants").insert');
    expect(register).not.toContain('.from("tenant_members").insert');
  });

  it("requires institution admin approval with capacity checks", () => {
    expect(migration).toContain("FUNCTION public.is_institution_admin");
    expect(migration).toContain("FUNCTION public.review_institution_member");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("_active_students >= _capacity");
    expect(migration).toContain("Pending student membership not found");
    expect(admin).toContain('rpc("review_institution_member"');
    expect(admin).not.toContain('.from("tenant_members").update');
    expect(admin).toContain('.eq("role", "admin")');
  });

  it("prevents self-approved elevated joins and direct plan edits", () => {
    expect(migration).toContain("AND role = 'student'");
    expect(migration).toContain("AND status = 'pending'");
    expect(migration).toContain("AND approved_by IS NULL");
    expect(migration).toContain("REVOKE UPDATE, DELETE ON public.tenant_members");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.tenants");
    expect(migration).toContain("DROP POLICY IF EXISTS \"Tenant admins can manage members\"");
    expect(join).toContain('role: "student"');
    expect(join).toContain('status: "pending"');
  });

  it("uses a tenant-scoped branding RPC without exposing subscription fields", () => {
    expect(migration).toContain("FUNCTION public.update_institution_branding");
    expect(migration).toContain("public.is_institution_admin(_tenant_id)");
    expect(migration).not.toMatch(/SET plan\s*=/);
    expect(migration).not.toMatch(/SET max_students\s*=/);
    expect(admin).toContain('rpc("update_institution_branding"');
    expect(admin).not.toContain('.from("tenants").update');
  });
});
