import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260830233000_adaptive_mastery_engine.sql");
const checker = read("supabase/functions/check-answer/index.ts");
const essayGrader = read("supabase/functions/ai-tutor/index.ts");
const practice = read("src/pages/Practice.tsx");
const masteryPage = read("src/pages/Mastery.tsx");
const routes = read("src/App.tsx");
const en = read("src/i18n/locales/en.ts");
const fr = read("src/i18n/locales/fr.ts");
const de = read("src/i18n/locales/de.ts");

describe("adaptive mastery phase", () => {
  it("stores curriculum-aware topic mastery with learner-only read access", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.learner_topic_mastery");
    expect(migration).toContain("UNIQUE (user_id, curriculum, subject, topic)");
    expect(migration).toContain('CREATE POLICY "Learners view own mastery"');
    expect(migration).toContain('DROP POLICY IF EXISTS "Paid users can read questions"');
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.attempts FROM authenticated");
  });

  it("updates mastery only from server-verified answer paths", () => {
    expect(migration).toContain("update_learner_topic_mastery");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("next_review_at");
    expect(checker).toContain('admin.rpc("update_learner_topic_mastery"');
    expect(essayGrader).toContain('sb.rpc("update_learner_topic_mastery"');
  });

  it("selects published adaptive questions without returning canonical answers", () => {
    expect(migration).toContain("get_adaptive_practice_questions");
    expect(migration).toContain("q.review_status = 'published'");
    expect(migration).toContain("safe_mode NOT IN ('diagnostic', 'focus', 'mixed')");
    const returnShape = migration.slice(migration.indexOf("RETURNS TABLE ("), migration.indexOf("LANGUAGE plpgsql", migration.indexOf("RETURNS TABLE (")));
    expect(returnShape).not.toContain("correct_answer");
    expect(practice).toContain('"get_adaptive_practice_questions"');
  });

  it("ships a routed and translated mastery experience", () => {
    expect(routes).toContain('path="/mastery"');
    expect(masteryPage).toContain('"get_learner_mastery_dashboard"');
    expect(masteryPage).toContain("getMascot");
    for (const locale of [en, fr, de]) {
      expect(locale).toContain("adaptiveSession");
      expect(locale).toContain("mastery:");
      expect(locale).toContain("diagnostic:");
    }
  });
});
