import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const sql = read("supabase/migrations/20261008205000_institution_teacher_invites.sql");
const admin = read("src/components/institution/TeacherInvitations.tsx");
const page = read("src/pages/TeacherInvitation.tsx");
const auth = read("src/pages/Auth.tsx");
const routes = read("src/App.tsx");

describe("institution verified teacher invitations", () => {
  it("does not trust requested teacher role on signup", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user_role()");
    expect(sql).toContain("WHEN NEW.raw_user_meta_data->>'requested_role' = 'parent'");
    expect(sql).not.toContain("requested_role' = 'teacher'");
    expect(sql).toContain("ELSE 'student'::public.app_role");
  });

  it("stores a token hash, checks owner and rate limits issuance", () => {
    expect(sql).toContain("token_hash text NOT NULL UNIQUE");
    expect(sql).toContain("REVOKE ALL ON public.institution_teacher_invites FROM PUBLIC, anon, authenticated");
    expect(sql).toContain("FUNCTION public.create_institution_teacher_invite");
    expect(sql).toContain("invitations_last_hour >= 20");
    expect(sql).toContain("encode(sha256(convert_to(random_token, 'UTF8')), 'hex')");
    expect(sql).toContain("public.is_institution_admin(_tenant_id)");
    expect(admin).toContain('rpc("create_institution_teacher_invite"');
  });

  it("redeems only for the authenticated email-confirmed invitee exactly once", () => {
    expect(sql).toContain("FUNCTION public.accept_institution_teacher_invite");
    expect(sql).toContain("u.email_confirmed_at");
    expect(sql).toContain("confirmed_email <> invitation.invitee_email");
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain("invitation.expires_at <= now()");
    expect(sql).toContain("INSERT INTO public.tenant_members");
    expect(sql).toContain("INSERT INTO public.user_roles");
    expect(sql).toContain("'teacher'::public.app_role");
    expect(sql).toContain("UPDATE public.institution_teacher_invites");
    expect(page).toContain('rpc("accept_institution_teacher_invite"');
  });

  it("supports copy/revoke workflows and returns safely to the invite after sign-in", () => {
    expect(sql).toContain("FUNCTION public.list_institution_teacher_invites");
    expect(sql).toContain("FUNCTION public.revoke_institution_teacher_invite");
    expect(admin).toContain('rpc("list_institution_teacher_invites"');
    expect(admin).toContain('rpc("revoke_institution_teacher_invite"');
    expect(routes).toContain('path="/teacher-invitation"');
    expect(auth).toContain("safeInvitationReturn");
    expect(auth).toContain("navigate(safeInvitationReturn)");
  });
});
