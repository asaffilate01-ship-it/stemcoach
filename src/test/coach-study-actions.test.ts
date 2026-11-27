import { describe, expect, it } from "vitest";
import { buildCoachStudyActions, isCoachSubject, resolveCoachTutorial } from "@/lib/coachStudyActions";
import { tutorials } from "@/data/tutorials";

describe("allowlisted coach learning actions", () => {
  it("binds the exact authored lesson and uses only internal routes", () => {
    const id = "arithmetic-sequences-nth-term";
    expect(resolveCoachTutorial(id, "mathematics")?.id).toBe(id);
    const actions = buildCoachStudyActions("mathematics", id);
    expect(actions).toEqual([
      { id: "questions", path: "/qa-clinic?subject=mathematics&topic=" + id },
      { id: "due", path: "/qa-clinic?subject=mathematics&topic=" + id + "&review=due" },
      { id: "missed", path: "/qa-clinic?subject=mathematics&topic=" + id + "&review=missed" },
      { id: "practice", path: "/practice/mathematics" },
      { id: "lesson", path: "/tutorials?tutorial=" + id },
      { id: "weak", path: "/weak-drills" },
    ]);
  });
  it("ignores untrusted paths, mismatched lessons and archived subjects", () => {
    const archived = tutorials.find(t => t.subject === "french");
    expect(archived).toBeDefined();
    expect(resolveCoachTutorial(archived?.id)).toBeNull();
    expect(resolveCoachTutorial("arithmetic-sequences-nth-term", "physics")).toBeNull();
    for (const subject of [null, "__proto__", "french", "https://example.org", "mathematics&review=saved"]) {
      expect(isCoachSubject(subject)).toBe(false);
      expect(buildCoachStudyActions(subject)).toEqual([]);
    }
    const actions = buildCoachStudyActions("physics", "arithmetic-sequences-nth-term");
    expect(actions.some(action => action.id === "lesson")).toBe(false);
    expect(actions[0].path).toBe("/qa-clinic?subject=physics");
    expect(buildCoachStudyActions("physics", "https://example.org")).toEqual(actions);
  });
});
