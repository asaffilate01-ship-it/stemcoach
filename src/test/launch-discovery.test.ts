import { describe, expect, it } from "vitest";
import { curricula, subjects } from "@/data/questions";
import { launchCountryGroups, launchCurricula, launchExamTemplates, launchStudyLanguages, launchSubjects, isLaunchCurriculum, isLaunchSubject } from "@/lib/launchDiscovery";

describe("three-market discovery without destructive changes", () => {
  it("exposes exactly the three markets and five requested study languages", () => {
    expect(launchCountryGroups.map(m => m.id)).toEqual(["uk", "de", "pk"]);
    expect(launchStudyLanguages.map(l => l.id)).toEqual(["english", "german", "arabic", "urdu", "welsh"]);
    for (const market of launchCountryGroups) expect(market.keys.every(id => curricula.some(c => c.id === id))).toBe(true);
  });
  it("retains international qualifications within the selected markets", () => {
    expect(launchCountryGroups.find(m => m.id === "pk")?.keys).toContain("uk-igcse");
    expect(launchCountryGroups.find(m => m.id === "uk")?.keys).toContain("uk-scottish-higher");
    expect(launchCountryGroups.find(m => m.id === "de")?.keys).toContain("uni-de");
    for (const id of ["us-sat", "india-cbse-10", "fr-bac-general", "au-hsc", "uni-intl"]) expect(isLaunchCurriculum(id)).toBe(false);
    expect(launchCurricula.every(c => isLaunchCurriculum(c.id))).toBe(true);
  });
  it("preserves historical subject and curriculum IDs outside discovery", () => {
    expect(subjects.some(s => s.id === "french")).toBe(true);
    expect(curricula.some(c => c.id === "us-sat")).toBe(true);
    expect(launchSubjects).toHaveLength(14);
    for (const id of ["french", "italian", "spanish", "turkish"]) expect(isLaunchSubject(id)).toBe(false);
    expect(launchExamTemplates.every(t => isLaunchCurriculum(t.curriculum) && isLaunchSubject(t.subject))).toBe(true);
  });
});
