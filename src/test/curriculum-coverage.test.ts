import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function idsBetween(source: string, start: string, end: string) {
  const block = source.slice(source.indexOf(start), source.indexOf(end));
  return [...block.matchAll(/\{ id: "([^"]+)"/g)].map((match) => match[1]);
}

describe("curriculum bank coverage", () => {
  const frontend = readFileSync(resolve(process.cwd(), "src/data/questions.ts"), "utf8");
  const generator = readFileSync(resolve(process.cwd(), "supabase/functions/batch-generate/index.ts"), "utf8");
  const frontendCurricula = idsBetween(frontend, "export const curricula = [", "export const sampleQuestions");
  const generatedCurricula = idsBetween(generator, "const CURRICULUM_BOARDS", "const SPECIALISED_CURRICULUM_SUBJECTS");

  it("generates every school-level curriculum exposed to learners", () => {
    const intentionallyModuleSpecificOrLegacy = [
      "uni-uk", "uni-us", "uni-au", "uni-nz", "uni-ca", "uni-in", "uni-pk", "uni-bd", "uni-lk", "uni-intl",
      "uae-emsat-legacy",
    ];
    const missing = frontendCurricula.filter((id) => !generatedCurricula.includes(id)).sort();

    expect(missing).toEqual(intentionallyModuleSpecificOrLegacy.sort());
  });

  it("does not plan curricula that learners cannot select", () => {
    expect(generatedCurricula.filter((id) => !frontendCurricula.includes(id))).toEqual([]);
  });

  it("includes the previously omitted official school pathways", () => {
    for (const id of [
      "uk-scottish-adv-higher",
      "au-atar",
      "nz-scholarship",
      "ca-quebec-cegep",
      "ph-abm",
      "ph-humss",
    ]) {
      expect(generatedCurricula).toContain(id);
    }
  });

  it("advertises only implemented interface languages", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('"inLanguage": ["en", "fr", "de"]');
    expect(html).toContain('"availableLanguage": ["English", "French", "German"]');
  });
});
