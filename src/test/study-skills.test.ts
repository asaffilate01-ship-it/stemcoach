import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { studyCategories, studyChecklist, studySkills, studySources, validStudyCategory } from "@/data/studySkills";

describe("student study skills guides", () => {
  it("covers six areas with three original practical methods each", () => {
    expect(studyCategories).toHaveLength(6);
    expect(studySkills).toHaveLength(18);
    expect(new Set(studySkills.map((guide) => guide.id)).size).toBe(18);
    for (const category of studyCategories) {
      expect(studySkills.filter((guide) => guide.category === category)).toHaveLength(3);
    }
  });
  it("delivers full step-by-step content in all supported interface languages", () => {
    for (const guide of studySkills) {
      for (const language of ["en", "de", "fr"] as const) {
        const text = guide.content[language];
        expect(text.title.length).toBeGreaterThan(8);
        expect(text.summary.length).toBeGreaterThan(20);
        expect(text.steps).toHaveLength(3);
        expect(text.steps.every((step) => step.length > 20)).toBe(true);
      }
      expect(studySources[guide.source]).toBeDefined();
    }
  });
  it("links only to expected https education and wellbeing resources", () => {
    expect(Object.keys(studySources).sort()).toEqual(["aqa", "eef", "nhs", "ofqual"]);
    for (const source of Object.values(studySources)) {
      const address = new URL(source.url);
      expect(address.protocol).toBe("https:");
      expect(["www.aqa.org.uk", "www.nhs.uk", "www.gov.uk", "educationendowmentfoundation.org.uk"]).toContain(address.hostname);
    }
  });
  it("has localised practical checklists and rejects unknown categories", () => {
    for (const kind of ["before", "evening", "exam"] as const) {
      for (const lang of ["en", "de", "fr"] as const) {
        expect(studyChecklist[kind][lang]).toHaveLength(4);
        expect(studyChecklist[kind][lang].every((item) => item.length > 15)).toBe(true);
      }
    }
    expect(validStudyCategory("exam")).toBe("exam");
    expect(validStudyCategory("pressure")).toBe("pressure");
    expect(validStudyCategory("<script>")).toBe("all");
    expect(validStudyCategory(null)).toBe("all");
  });
  it("ships a public route and visible learner navigation without relaxing auth", () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
    const app = read("src/App.tsx");
    const header = read("src/components/layout/AppHeader.tsx");
    const dashboard = read("src/pages/Dashboard.tsx");
    const clinic = read("src/pages/QAClinic.tsx");
    expect(app).toContain('path="/study-skills" element={<Pub><StudySkills /></Pub>}');
    expect(app).toContain('path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}');
    expect(header).toContain('to: "/study-skills"');
    expect(dashboard).toContain('to: "/study-skills"');
    expect(clinic).toContain('to="/study-skills"');
    expect(read("src/pages/StudySkills.tsx")).not.toContain("localStorage.setItem");
  });
});
