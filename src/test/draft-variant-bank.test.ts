import { describe, expect, it } from "vitest";
import { DRAFT_VARIANT_CAPACITY, DRAFT_VARIANT_SKILLS, MAX_PREVIEW_BATCH, VARIANTS_PER_SKILL, draftVariantAt, previewDraftVariants } from "@/lib/draftVariantBank";

describe("on-demand million-variant authored-skill drafts", () => {
  it("describes generator capacity separately from independently reviewed questions", () => {
    expect(DRAFT_VARIANT_SKILLS).toHaveLength(16);
    expect(VARIANTS_PER_SKILL).toBe(65_536);
    expect(DRAFT_VARIANT_CAPACITY).toBe(1_048_576);
    expect(draftVariantAt(0)?.reviewStatus).toBe("draft");
    expect(draftVariantAt(DRAFT_VARIANT_CAPACITY - 1)?.reviewStatus).toBe("draft");
    expect(draftVariantAt(DRAFT_VARIANT_CAPACITY)).toBeNull();
    expect(draftVariantAt(-1)).toBeNull();
    expect(draftVariantAt(NaN)).toBeNull();
    expect(draftVariantAt(Infinity)).toBeNull();
    expect(draftVariantAt(1.5)).toBeNull();
  });

  it("returns exact, worked answers on representative different subjects", () => {
    expect(draftVariantAt(0)).toMatchObject({ subject: "mathematics", answer: "0", reviewStatus: "draft" });
    expect(draftVariantAt(VARIANTS_PER_SKILL)).toMatchObject({ subject: "mathematics", answer: "1" });
    expect(draftVariantAt(VARIANTS_PER_SKILL * 9)).toMatchObject({ subject: "physics", answer: "1" });
    expect(draftVariantAt(VARIANTS_PER_SKILL * 13)).toMatchObject({ subject: "chemistry", answer: "1" });
    expect(draftVariantAt(VARIANTS_PER_SKILL * 14)).toMatchObject({ subject: "biology", answer: "1" });
    expect(draftVariantAt(VARIANTS_PER_SKILL * 15)).toMatchObject({ subject: "computer-science", answer: "1" });
  });

  it("caps preview allocations and rejects bad requests without partial wrapping", () => {
    expect(previewDraftVariants(0, 5)).toHaveLength(5);
    expect(previewDraftVariants(DRAFT_VARIANT_CAPACITY - 2, 10)).toHaveLength(2);
    expect(previewDraftVariants(DRAFT_VARIANT_CAPACITY, 5)).toEqual([]);
    expect(previewDraftVariants(0, 0)).toEqual([]);
    expect(previewDraftVariants(-1, 5)).toEqual([]);
    expect(previewDraftVariants(0, MAX_PREVIEW_BATCH + 1)).toEqual([]);
    expect(previewDraftVariants(0, 5.1)).toEqual([]);
    expect(previewDraftVariants(0, MAX_PREVIEW_BATCH)).toHaveLength(MAX_PREVIEW_BATCH);
  });

  it.each(DRAFT_VARIANT_SKILLS)("produces 65,536 unique reproducible question strings for %s", (skill) => {
    const family = DRAFT_VARIANT_SKILLS.indexOf(skill);
    const seenIds = new Set<string>();
    const seenQuestions = new Set<string>();
    const start = family * VARIANTS_PER_SKILL;
    for (let offset = 0; offset < VARIANTS_PER_SKILL; offset++) {
      const index = start + offset;
      const first = draftVariantAt(index);
      expect(first, "Missing question for " + index).not.toBeNull();
      const item = first!;
      expect(item.skill).toBe(skill);
      expect(item.reviewStatus).toBe("draft");
      expect(item.answer.trim().length).toBeGreaterThan(0);
      expect(item.workedSolution.length).toBeGreaterThan(35);
      expect(seenIds.has(item.id), "Duplicate ID in family " + skill).toBe(false);
      expect(seenQuestions.has(item.question), "Duplicate prompt in family " + skill).toBe(false);
      seenIds.add(item.id);
      seenQuestions.add(item.question);
    }
    expect(seenIds.size).toBe(65_536);
    expect(seenQuestions.size).toBe(65_536);
  });
});
