import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MASCOT_IDENTITIES, STEMCOACH_IDENTITY } from "../../supabase/functions/_shared/mascotCatalog";
import { PRODUCT_GRANTS } from "../../supabase/functions/_shared/productCatalog";
import { PACKS } from "@/lib/subscriptionTiers";

const root = resolve(process.cwd());
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("release hardening", () => {
  it("keeps every browser price in the server-side entitlement catalogue", () => {
    const browserPrices = Object.values(PACKS).flatMap((pack) =>
      Object.values(pack.regional).map((regional) => regional.price_id),
    );
    expect(new Set(browserPrices)).toEqual(new Set(Object.keys(PRODUCT_GRANTS)));
  });

  it("never trusts browser-supplied quota metadata", () => {
    const checkout = source("supabase/functions/create-checkout/index.ts");
    const verify = source("supabase/functions/verify-purchase/index.ts");
    expect(checkout).toContain("grantForPrice(priceId)");
    expect(checkout).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(checkout).not.toMatch(/const \{[^}]*questionsGranted/);
    expect(verify).toContain('rpc("grant_verified_purchase"');
    expect(verify).toContain("checkout.sessions.retrieve(requestBody.sessionId)");
    expect(verify).not.toContain("Fallback for legacy sessions");
    expect(verify).not.toContain("metadata?.questions_granted");
  });

  it("makes unverified legacy content fail closed", () => {
    const migration = source("supabase/migrations/20260830235900_release_hardening.sql");
    expect(migration).toContain("ALTER COLUMN review_status SET DEFAULT 'needs_review'");
    expect(migration).toContain("release_provenance_missing");
    expect(migration).toContain("reviewed_by = academic_verified_by");
    expect(migration).toContain("get_curriculum_subject_question_counts");
  });

  it("uses one mascot identity catalogue in browser and notification surfaces", () => {
    expect(Object.keys(MASCOT_IDENTITIES)).toHaveLength(14);
    expect(STEMCOACH_IDENTITY.name).toBe("STEMCoach");
    expect(MASCOT_IDENTITIES.biology.emoji).toBe("🐝");
    expect(source("src/lib/mascots.ts")).toContain("MASCOT_IDENTITIES");
    expect(source("supabase/functions/daily-mascot-notify/index.ts")).toContain("MASCOT_IDENTITIES");
  });

  it("uses real exam blueprints instead of hard-coded past-paper claims", () => {
    const library = source("src/pages/PastPapers.tsx");
    const mockExam = source("src/pages/MockExam.tsx");
    expect(library).toContain("mockExamTemplates");
    expect(library).not.toContain("mockPapers");
    expect(library).toContain("/mock-exam?template=");
    expect(mockExam).toContain('searchParams.get("template")');
  });

  it("posts classroom messages through a membership-aware rate-limited RPC", () => {
    const migration = source("supabase/migrations/20260831000000_secure_classroom_hub.sql");
    const chat = source("src/components/classroom/ClassroomChat.tsx");
    const studentClasses = source("src/pages/StudentClasses.tsx");
    expect(migration).toContain("Class membership required");
    expect(migration).toContain("Message rate limit reached");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE");
    expect(migration).toContain('DROP POLICY IF EXISTS "Students can join classes"');
    expect(migration).toContain("Join-code rate limit reached");
    expect(chat).toContain('"send_classroom_message"');
    expect(chat).not.toContain('.from("classroom_messages").insert');
    expect(studentClasses).toContain('"join_class_by_code"');
    expect(studentClasses).not.toContain('.from("class_members").insert');
  });
});
