import { tutorials, type Tutorial } from "@/data/tutorials";
import { isLaunchSubject } from "@/lib/launchDiscovery";

/** Existing tutor subjects only. Expanding the list requires server capability checks. */
export const COACH_SUBJECT_IDS = ["mathematics", "physics", "chemistry", "biology", "computer-science", "economics", "english-literature", "psychology", "geography", "business-studies", "ielts", "celta", "german"] as const;
export function isCoachSubject(value: unknown): value is typeof COACH_SUBJECT_IDS[number] {
  return typeof value === "string" && COACH_SUBJECT_IDS.some(id => id === value) && isLaunchSubject(value);
}

/** Resolve public authored lesson IDs only; never accept a model-supplied route. */
export function resolveCoachTutorial(id: unknown, subject?: unknown): Tutorial | null {
  if (typeof id !== "string") return null;
  const lesson = tutorials.find(item => item.id === id && isCoachSubject(item.subject));
  if (!lesson || (isCoachSubject(subject) && lesson.subject !== subject)) return null;
  return lesson;
}

export type CoachStudyAction = { id: "questions" | "due" | "missed" | "practice" | "lesson" | "weak"; path: string };
export function buildCoachStudyActions(subject: unknown, tutorialId?: unknown): CoachStudyAction[] {
  if (!isCoachSubject(subject)) return [];
  const lesson = resolveCoachTutorial(tutorialId, subject);
  const params = new URLSearchParams({ subject });
  if (lesson) params.set("topic", lesson.id);
  const reviewPath = (focus?: "due" | "missed") => {
    const query = new URLSearchParams(params);
    if (focus) query.set("review", focus);
    return "/qa-clinic?" + query.toString();
  };
  const actions: CoachStudyAction[] = [
    { id: "questions", path: reviewPath() },
    { id: "due", path: reviewPath("due") },
    { id: "missed", path: reviewPath("missed") },
    { id: "practice", path: "/practice/" + encodeURIComponent(subject) },
  ];
  if (lesson) actions.push({ id: "lesson", path: "/tutorials?" + new URLSearchParams({ tutorial: lesson.id }).toString() });
  actions.push({ id: "weak", path: "/weak-drills" });
  return actions;
}
