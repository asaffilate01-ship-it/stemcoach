import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reviewMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260829233000_review_workflow_and_personalised_coaching.sql"), "utf8");
const aiChat = readFileSync(resolve(process.cwd(), "supabase/functions/ai-chat/index.ts"), "utf8");
const practice = readFileSync(resolve(process.cwd(), "src/pages/Practice.tsx"), "utf8");
const tutor = readFileSync(resolve(process.cwd(), "src/pages/AITutor.tsx"), "utf8");

describe("audited academic review operations", () => {
  it("atomically claims review work and records immutable reviewer events", () => {
    expect(reviewMigration).toContain("FOR UPDATE SKIP LOCKED");
    expect(reviewMigration).toContain("question_review_events");
    expect(reviewMigration).toContain("review_claimed_by = auth.uid()");
    expect(reviewMigration).toContain("interval '60 minutes'");
  });

  it("requires an active claim, academic attestation and quality checks before publication", () => {
    expect(reviewMigration).toContain("active_review_claim_required");
    expect(reviewMigration).toContain("academic_attestation_required");
    expect(reviewMigration).toContain("public.question_quality_flags(_question_id)");
    expect(reviewMigration).toContain("rejection_reason_required");
    expect(reviewMigration).toContain("REVOKE EXECUTE ON FUNCTION public.publish_question(uuid) FROM authenticated");
  });
});

describe("curriculum-aware personalised coaching", () => {
  it("derives curriculum and weak topics on the server without exposing answer-bank content", () => {
    expect(aiChat).toContain('from("user_preferences").select("curriculum")');
    expect(aiChat).toContain('from("attempts")');
    expect(aiChat).toContain('from("user_quotas")');
    expect(aiChat).toContain("Coaching requires an active question pack");
    expect(aiChat).toContain('eq("correct", false)');
    expect(aiChat).toContain("Recent weak-topic evidence");
    expect(aiChat).toContain("hidden answer-bank data");
    expect(aiChat).not.toContain('"Access-Control-Allow-Origin": "*"');
  });

  it("filters learner practice and coach requests by the selected curriculum", () => {
    expect(practice).toContain('questionQuery.eq("curriculum", curriculumId)');
    expect(practice).toContain("getCachedQuestions(subjectId, curriculumId)");
    expect(tutor).toContain("curriculum: curriculumId");
    expect(tutor).toContain("coach.personalised");
    expect(tutor).toContain("language: normalizeLanguage");
  });
});
